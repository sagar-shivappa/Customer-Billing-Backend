const Billing = require("./billing.model");
const Product = require("../products/product.model");

/**
 * Generate Bill Number
 */
const generateBillNumber = async () => {
  const count = await Billing.countDocuments();

  const billNumber = `BILL${String(count + 1).padStart(6, "0")}`;

  return billNumber;
};

/**
 * Create Bill
 */
const createBill = async (billData) => {
  const { items, paymentType, customerId } = billData;

  if (!items || items.length === 0) {
    throw new Error("Bill should contain at least one product.");
  }

  const billItems = [];

  let grandTotal = 0;

  /*
       Loop through received products
    */
  for (const item of items) {
    const product = await Product.findOne({
      productCode: item.productCode,
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productCode}`);
    }

    const quantity = item.quantity;

    if (quantity <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }

    const totalPrice = product.sellingPrice * quantity;

    billItems.push({
      productCode: product.productCode,
      productName: product.productName,
      quantity,
      unitPrice: product.sellingPrice,
      totalPrice,
    });

    grandTotal += totalPrice;
  }

  const billNumber = await generateBillNumber();

  const bill = await Billing.create({
    billNumber,
    items: billItems,
    grandTotal,
    paymentType,
    customerId,
  });

  return bill;
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
 *
 * Supported filters:
 * ?date=2026-09-24
 * ?from=2026-09-01&to=2026-09-24
 * ?month=2026-09
 * ?customerId=6360959764
 *
 * Filters can also be combined.
 */
const getBills = async (filters) => {
  const { date, from, to, month, customerId, page = 1, limit = 20 } = filters;

  const query = {};

  /**
   * Customer Code Filter
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
   * Example: month=2026-09
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

module.exports = {
  createBill,

  getBillById,

  getBills,
};
