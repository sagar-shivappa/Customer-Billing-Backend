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
    required: true,
  },
});

module.exports = mongoose.model("Owner", ownerSchema);
