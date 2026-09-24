const customerService = require("./customer.service");

/**
 * Create Customer
 */
const createCustomer = async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body);

    res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get All Customers
 */
const getCustomers = async (req, res) => {
  try {
    const customers = await customerService.getCustomers();

    res.status(200).json({
      success: true,
      message: "Customers fetched successfully.",
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Customer By Phone Number or Customer Code
 */
const getCustomerByPhoneOrCode = async (req, res) => {
  try {
    const customer = await customerService.getCustomerByPhoneOrCode(req.query);

    res.status(200).json({
      success: true,
      message: "Customer fetched successfully.",
      data: customer,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Customer By ID
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Customer fetched successfully.",
      data: customer,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update Customer
 */
const updateCustomer = async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Customer updated successfully.",
      data: customer,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Deactivate Customer
 */
const deactivateCustomer = async (req, res) => {
  try {
    const customer = await customerService.deactivateCustomer(req.params.id);

    res.status(200).json({
      success: true,
      message: "Customer deactivated successfully.",
      data: customer,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerByPhoneOrCode,
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
};
