const ownerService = require("./owner.service");

/**
 * Create Bill
 * POST /api/owner
 */
const addOwner = async (req, res, next) => {
  try {
    const owner = await ownerService.createOwner(req.body);

    res.status(201).json({
      success: true,
      message: "Owner created successfully.",
      data: owner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Owner
 * PUT /api/owner
 */
const updateOwner = async (req, res, next) => {
  try {
    const owner = await ownerService.updateOwner(req.body);

    res.status(200).json({
      success: true,
      message: "Owner updated successfully.",
      data: owner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Owner
 * GET /api/owner
 */
const getOwner = async (req, res, next) => {
  try {
    const owner = await ownerService.getOwner();

    res.status(200).json(owner);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addOwner,
  getOwner,
  updateOwner,
};
