import mongoose from "mongoose";

const bloodStockSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    componentType: {
      type: String,
      enum: ["Whole Blood", "RBC", "Plasma", "Platelets"],
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Available", // ready in stock
        "Reserved", // assigned to a patient request
        "In Transit", // being transferred
        "Issued", // given to patient
        "Expired", // out of date
        "Discarded", // failed screening/damaged
        "Processed", // whole blood already separated
      ],
      default: "Available",
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
    },
    transfer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transfer",
    },
    parentUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodStock",
    },
    isComponentSeparated: {
      type: Boolean,
      default: false,
    },
    screeningPassed: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("BloodStock", bloodStockSchema);
