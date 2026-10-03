const reportsService = require("./reports.service");

const getOverviewSummary = async (req, res) => {
  try {
    const summary = await reportsService.getOverviewSummary(req.query);

    res.json(summary);
  } catch (error) {
    console.error("Failed to get overview summary:", error);

    res.status(500).json({
      message: "Failed to get overview summary",
    });
  }
};

module.exports = {
  getOverviewSummary,
};
