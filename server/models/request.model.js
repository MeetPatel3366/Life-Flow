import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
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
    unitsRequired: {
      type: Number,
      required: true,
      min: 1,
    },
    urgency: {
      type: String,
      enum: [
        "Normal", //Planned need
        "Urgent", //Needed soon
        "Emergency", //Accident, ICU bleeding
      ],
      default: "Normal",
    },
    requiredDate: {
      type: Date,
    },
    diagnosis: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "Pending", // waiting admin review
        "Approved", // approved, stock reserved
        "Rejected", // denied
        "Awaiting Donor", // no stock, donor alert sent
        "Transfer Required", // stock in other center
        "Ready for Issue", // blood prepared
        "Completed", // blood issued
        "Cancelled",
      ],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    bloodUnits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BloodStock",
      },
    ],
    transfer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transfer",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

requestSchema.index({ hospital: 1, status: 1 });
requestSchema.index({ bloodGroup: 1, componentType: 1 });

export default mongoose.model("Request", requestSchema);
