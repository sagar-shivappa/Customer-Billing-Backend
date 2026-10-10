const reportsService = require("./reports.service");

const getProductsReport = async (req, res) => {
  try {
    const data = await reportsService.getProductsReport(req.query);

    return res.status(200).json({
      success: true,
      message: "Products report fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/overview
 */
const getOverview = async (req, res) => {
  try {
    const result = await reportsService.getOverviewSummary(req.query);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const result = await reportsService.getTransactions(req.query);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getTransactions,
  getProductsReport,
};
