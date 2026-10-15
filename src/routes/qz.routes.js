const router = require("express").Router();

const qzController = require("../qz.controller");

/**
 * GET /api/qz/certificate
 */
router.get("/certificate", qzController.getCertificate);

/**
 * POST /api/qz/sign
 */
router.post("/sign", qzController.sign);

module.exports = router;
