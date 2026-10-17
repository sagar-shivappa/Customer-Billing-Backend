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
    customerId: {
      type: String,
    },
    customerName: {
      type: String,
    },

    items: {
      type: [ItemSchema],
      required: true,
    },

    // =========================
    // BILL AMOUNTS
    // =========================

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    gstPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },

    sgstAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    cgstAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    roundOff: {
      type: Number,
      required: true,
      default: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
      min: 0,
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
