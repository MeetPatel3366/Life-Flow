import mongoose from "mongoose";

const transferSchema = new mongoose.Schema({
  fromHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  toHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  bloodUnits: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodStock",
      required: true,
    },
  ],
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
  },
  transportMode: {
    type: String,
    enum: ["Ambulance", "Courier", "Cold Chain Vehicle"],
  },
  trackingNumber: {
    type: String,
  },
  status: {
    type: String,
    enum: [
      "Pending Approval", // admin reviewing
      "Approved", // ready for dispatch
      "Dispatched", // left source hospital
      "In Transit", // on the way
      "Delivered", // reached destination
      "Completed", // stock updated
      "Cancelled",
    ],
    default: "Pending Approval",
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  dispatchDate: {
    type: Date,
  },
  deliveryDate: {
    type: Date,
  },
  temperatureLog: [
    {
      temperature: {
        type: Number,
      },
      recordedAt: {
        type: Date,
      },
    },
  ],
  issuesReported: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
});

export default mongoose.model("Transfer", transferSchema);
