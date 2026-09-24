const billingService = require("./billing.service");

/**
 * Create Bill
 * POST /api/billing
 */
const createBill = async (req, res, next) => {
    try {
        const bill = await billingService.createBill(req.body);

        res.status(201).json({
            success: true,
            message: "Bill created successfully.",
            data: bill
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Bill By Id
 * GET /api/billing/:id
 */
const getBillById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bill = await billingService.getBillById(id);

        res.status(200).json({
            success: true,
            message: "Bill fetched successfully.",
            data: bill
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Bills
 * GET /api/billing
 *
 * Query Parameters:
 * from
 * to
 * page
 * limit
 */
const getBills = async (req, res, next) => {
    try {
        const bills = await billingService.getBills(req.query);

        res.status(200).json({
            success: true,
            message: "Bills fetched successfully.",
            data: bills
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBill,
    getBillById,
    getBills
};