const qzService = require("./qz.service");

/**
 * GET /api/qz/certificate
 *
 * Returns the public QZ Tray certificate.
 */
const getCertificate = (req, res) => {
  res.type("text/plain").send(qzService.getCertificate());
};

/**
 * POST /api/qz/sign
 *
 * Signs the data sent by QZ Tray.
 */
const sign = (req, res) => {
  try {
    const data = req.body?.data;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Data is required for signing.",
      });
    }

    const signature = qzService.sign(data);

    return res.status(200).json({
      success: true,
      signature,
    });
  } catch (error) {
    console.error("QZ signing error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to sign QZ Tray request.",
    });
  }
};

module.exports = {
  getCertificate,
  sign,
};
