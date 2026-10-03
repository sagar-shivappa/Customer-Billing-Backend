const express = require("express");

const router = express.Router();

const reportsController = require("./reports.controller");

router.get("/overview", reportsController.getOverviewSummary);

module.exports = router;
