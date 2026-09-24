const express = require("express");

const billingController = require("./billing.controller");

const router = express.Router();


/**
 * Create Bill
 * POST /api/billing
 */
router.post(
    "/",
    billingController.createBill
);


/**
 * Get Bills
 * GET /api/billing?from=2026-08-01&to=2026-08-31
 */
router.get(
    "/",
    billingController.getBills
);


/**
 * Get Bill By Id
 * GET /api/billing/:id
 */
router.get(
    "//:id",
    billingController.getBillById
);


module.exports = router;