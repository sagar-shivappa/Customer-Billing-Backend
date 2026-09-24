const Owner = require("./owner.model");

/**
 * Create Bill
 */
const createOwner = async (ownerData) => {
  const owner = await Owner.create(ownerData);

  return owner;
};

const updateOwner = async (profileData) => {
  const ownerProfile = await Owner.findOneAndUpdate(
    {
      profileKey: "OWNER",
    },
    profileData,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!ownerProfile) {
    throw new Error("Owner profile not found.");
  }

  return ownerProfile;
};

/**
 * Get Bill By Id
 */
const getOwner = async () => {
  const owner = await Owner.findOne({
    profileKey: "OWNER",
  }).select("-_id -profileKey");

  if (!owner) {
    throw new Error("owner not found.");
  }

  return owner;
};

module.exports = {
  createOwner,
  getOwner,
  updateOwner,
};
