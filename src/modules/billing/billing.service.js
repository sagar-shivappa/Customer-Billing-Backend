const Billing = require("./billing.model");
const Product = require("../products/product.model");
const Owner = require("../owner/owner.model");

/**
 * Round money to 2 decimal places
 */
const roundMoney = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * Generate Bill Number
 */
const generateBillNumber = () => {
  const now = new Date();

  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

/**
 * Create Bill
 */
const createBill = async (billData) => {
  const { items, paymentType, customerId, customerName } = billData;

  if (!items || items.length === 0) {
    throw new Error("Bill should contain at least one product.");
  }

  /**
   * Get shop configuration
   */
  const owner = await Owner.findOne({
    profileKey: "OWNER",
  }).select("stockManagement includeGst gstPercentage");

  if (!owner) {
    throw new Error("Owner profile not found.");
  }

  const stockManagement = owner.stockManagement;

  const billItems = [];
  let subtotal = 0;

  /**
   * Keep track of stock that has been reduced.
   *
   * This allows us to restore stock if something fails
   * after some products have already been updated.
   */
  const stockUpdates = [];

  try {
    /**
     * Loop through received products
     */
    for (const item of items) {
      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      let product;

      /**
       * Stock Management ENABLED
       */
      if (stockManagement) {
        product = await Product.findOneAndUpdate(
          {
            productCode: item.productCode,
            stock: { $gte: quantity },
          },
          {
            $inc: {
              stock: -quantity,
            },
          },
          {
            new: true,
          },
        );

        if (!product) {
          const existingProduct = await Product.findOne({
            productCode: item.productCode,
          });

          if (!existingProduct) {
            throw new Error(`Product not found: ${item.productCode}`);
          }

          throw new Error(
            `Insufficient stock for ${existingProduct.productName}. Available: ${existingProduct.stock}, requested: ${quantity}`,
          );
        }

        /**
         * Remember stock update for rollback
         */
        stockUpdates.push({
          productId: product._id,
          quantity,
        });
      }

      /**
       * Stock Management DISABLED
       */
      else {
        product = await Product.findOne({
          productCode: item.productCode,
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productCode}`);
        }
      }

      const totalPrice = roundMoney(product.sellingPrice * quantity);

      billItems.push({
        productCode: product.productCode,
        productName: product.productName,
        quantity,
        unitPrice: product.sellingPrice,
        totalPrice,
      });

      subtotal += totalPrice;
    }

    // =========================
    // GST CALCULATION
    // =========================

    subtotal = roundMoney(subtotal);

    const includeGst = owner.includeGst === true;

    const gstPercentage = includeGst ? Number(owner.gstPercentage || 0) : 0;

    const halfGstPercentage = gstPercentage / 2;

    const sgstAmount = includeGst
      ? roundMoney((subtotal * halfGstPercentage) / 100)
      : 0;

    const cgstAmount = includeGst
      ? roundMoney((subtotal * halfGstPercentage) / 100)
      : 0;

    // Amount before final round-off
    const calculatedGrandTotal = roundMoney(subtotal + sgstAmount + cgstAmount);

    // Final bill amount rounded to nearest whole rupee
    const grandTotal = Math.round(calculatedGrandTotal);

    // Difference caused by rounding
    const roundOff = roundMoney(grandTotal - calculatedGrandTotal);

    // =========================
    // GENERATE BILL NUMBER
    // =========================

    const billNumber = generateBillNumber();

    // =========================
    // CREATE BILL
    // =========================

    const bill = await Billing.create({
      billNumber,

      items: billItems,

      subtotal,

      gstPercentage,

      sgstAmount,

      cgstAmount,

      roundOff,

      grandTotal,

      paymentType,

      customerId,

      customerName,
    });

    return bill;
  } catch (error) {
    /**
     * If anything failed after stock was reduced,
     * restore the stock.
     */
    for (const update of stockUpdates) {
      await Product.findByIdAndUpdate(update.productId, {
        $inc: {
          stock: update.quantity,
        },
      });
    }

    throw error;
  }
};

/**
 * Get Bill By Id
 */
const getBillById = async (id) => {
  const bill = await Billing.findById(id);

  if (!bill) {
    throw new Error("Bill not found.");
  }

  return bill;
};

/**
 * Get Bills With Filters
 */
const getBills = async (filters) => {
  const { date, from, to, month, customerId, page = 1, limit = 20 } = filters;

  const query = {};

  /**
   * Customer ID Filter
   */
  if (customerId) {
    query.customerId = customerId.trim();
  }

  /**
   * Date Filter
   */
  if (date) {
    query.saleDate = {
      $gte: new Date(`${date}T00:00:00.000Z`),
      $lte: new Date(`${date}T23:59:59.999Z`),
    };
  }

  /**
   * Date Range Filter
   */
  else if (from || to) {
    query.saleDate = {};

    if (from) {
      query.saleDate.$gte = new Date(`${from}T00:00:00.000Z`);
    }

    if (to) {
      query.saleDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }
  }

  /**
   * Month Filter
   */
  else if (month) {
    const [year, monthNumber] = month.split("-");

    const startDate = new Date(
      Date.UTC(Number(year), Number(monthNumber) - 1, 1),
    );

    const endDate = new Date(Date.UTC(Number(year), Number(monthNumber), 1));

    query.saleDate = {
      $gte: startDate,
      $lt: endDate,
    };
  }

  /**
   * Pagination
   */
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  const skip = (pageNumber - 1) * limitNumber;

  /**
   * Fetch Bills
   */
  const bills = await Billing.find(query)
    .sort({
      saleDate: -1,
    })
    .skip(skip)
    .limit(limitNumber);

  /**
   * Total Bills
   */
  const total = await Billing.countDocuments(query);

  return {
    total,
    page: pageNumber,
    limit: limitNumber,
    data: bills,
  };
};

const updatePaymentType = async (billId, paymentType) => {
  if (!["Cash", "UPI"].includes(paymentType)) {
    throw new Error("Credit bill can only be settled with Cash or UPI");
  }

  const bill = await Billing.findById(billId);

  if (!bill) {
    throw new Error("Bill not found");
  }

  if (bill.paymentType !== "Credit") {
    throw new Error("Only credit bills can be marked as paid");
  }

  bill.paymentType = paymentType;

  return await bill.save();
};

module.exports = {
  createBill,
  getBillById,
  getBills,
  updatePaymentType,
};
