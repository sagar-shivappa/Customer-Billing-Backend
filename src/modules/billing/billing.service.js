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
  const { items, paymentType, customerCode } = billData;

  if (!items || items.length === 0) {
    throw new Error("Bill should contain at least one product.");
  }

  const billItems = [];

  let grandTotal = 0;
  let ItemsQuantity = 0;

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
    ItemsQuantity += quantity;
  }

  const billNumber = await generateBillNumber();

  const bill = await Billing.create({
    billNumber,
    items: billItems,
    ItemsQuantity,
    grandTotal,
    paymentType,
    customerCode,
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
 * Get Bills With Date Range
 */
const getBills = async (filters) => {
  const { from, to, page = 1, limit = 20 } = filters;

  const query = {};

  if (from && to) {
    query.saleDate = {
      $gte: new Date(`${from}T00:00:00.000Z`),

      $lte: new Date(`${to}T23:59:59.999Z`),
    };
  }

  const skip = (page - 1) * limit;

  const bills = await Billing.find(query)

    .sort({
      saleDate: -1,
    })

    .skip(skip)

    .limit(Number(limit));

  const total = await Billing.countDocuments(query);

  return {
    total,

    page: Number(page),

    limit: Number(limit),

    data: bills,
  };
};

module.exports = {
  createBill,

  getBillById,

  getBills,
};
