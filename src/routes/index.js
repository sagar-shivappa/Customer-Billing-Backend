const router = require("express").Router();

router.use("/products", require("../modules/products/product.routes"));

router.use("/billing", require("../modules/billing/billing.routes"));

router.use("/owner", require("../modules/owner/owner.routes"));

module.exports = router;
