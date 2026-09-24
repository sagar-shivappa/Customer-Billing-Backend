const Customer = require("./customer.model");

/**
 * Generate Customer Code
 */
const generateCustomerCode = async () => {
  const count = await Customer.countDocuments();

  const customerCode = `CUS${String(count + 1).padStart(6, "0")}`;

  return customerCode;
};

/**
 * Create Customer
 */
const createCustomer = async (customerData) => {
  const customerCode = await generateCustomerCode();

  const customer = await Customer.create({
    ...customerData,
    customerCode,
  });

  return customer;
};

/**
 * Get All Customers
 */
const getCustomers = async () => {
  const customers = await Customer.find().sort({ createdAt: -1 });

  return customers;
};

/**
 * Get Customer By Phone Number or Customer Code
 */
const getCustomerByPhoneOrCode = async ({ phone, customerCode }) => {
  const query = {};

  if (phone) {
    query.phone = phone.trim();
  } else if (customerCode) {
    query.customerCode = customerCode.trim().toUpperCase();
  } else {
    throw new Error("Phone number or customer code is required.");
  }

  const customer = await Customer.findOne(query);

  if (!customer) {
    throw new Error("Customer not found.");
  }

  return customer;
};

/**
 * Get Customer By ID
 */
const getCustomerById = async (customerId) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new Error("Customer not found.");
  }

  return customer;
};

/**
 * Update Customer
 */
const updateCustomer = async (customerId, customerData) => {
  const customer = await Customer.findByIdAndUpdate(customerId, customerData, {
    new: true,
    runValidators: true,
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  return customer;
};

/**
 * Deactivate Customer
 */
const deactivateCustomer = async (customerId) => {
  const customer = await Customer.findByIdAndUpdate(
    customerId,
    {
      isActive: false,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!customer) {
    throw new Error("Customer not found.");
  }

  return customer;
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  getCustomerByPhoneOrCode,
  updateCustomer,
  deactivateCustomer,
};
