const express = require("express");

const router = express.Router();

const reportsController = require("./reports.controller");

router.get("/overview", reportsController.getOverview);

router.get("/transactions", reportsController.getTransactions);

module.exports = router;
