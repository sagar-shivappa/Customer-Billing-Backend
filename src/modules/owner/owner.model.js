const mongoose = require("mongoose");
const ownerSchema = new mongoose.Schema({
  profileKey: {
    type: String,
    required: true,
    unique: true,
    default: "OWNER",
  },
  shopName: {
    type: String,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  pinCode: {
    type: String,
    required: true,
  },

  gstin: {
    type: String,
  },

  productCategories: {
    type: [String],
    default: [],
  },
  stockManagement: {
    type: Boolean,
    default: false,
  },
  includeGst: {
    type: Boolean,
    default: false,
  },

  gstPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
});

module.exports = mongoose.model("Owner", ownerSchema);
