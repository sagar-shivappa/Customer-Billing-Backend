const express = require("express");
const customerController = require("./customer.controller");

const router = express.Router();

/**
 * Create Customer
 */
router.post("/", customerController.createCustomer);

/**
 * Get All Customers
 */
router.get("/", customerController.getCustomers);

router.get("/lookup", customerController.getCustomerByPhoneOrCode);

/**
 * Get Customer By ID
 */
router.get("/:id", customerController.getCustomerById);

/**
 * Update Customer
 */
router.put("/:id", customerController.updateCustomer);

/**
 * Deactivate Customer
 */
router.delete("/:id", customerController.deactivateCustomer);

module.exports = router;
