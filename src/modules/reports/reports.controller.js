const reportsService = require("./reports.service");

/**
 * GET /api/reports/overview
 */
const getOverview = async (req, res) => {
  try {
    const result = await reportsService.getOverviewSummary(req.query);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching overview:", error);

    res.status(500).json({
      message: "Failed to fetch overview",
      error: error.message,
    });
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
    console.error("Error fetching transactions:", error);

    res.status(500).json({
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

module.exports = {
  getOverview,
  getTransactions,
};
