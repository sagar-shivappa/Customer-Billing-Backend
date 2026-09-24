const mongoose = require("mongoose");
const ItemSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const billingSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerCode: {
      type: String,
    },

    items: {
      type: [ItemSchema],
      required: true,
    },

    grandTotal: {
      type: Number,
      required: true,
    },

    paymentType: {
      type: String,
      enum: ["Cash", "Credit", "UPI"],
      default: "Cash",
    },

    saleDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Billing", billingSchema);
