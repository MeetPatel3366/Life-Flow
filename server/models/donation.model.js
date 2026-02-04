import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donor: {
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
    scheduledDate: {
      type: Date,
    },
    donationDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        "Scheduled", // donor booked slot
        "Screening", // medical test happening
        "Completed", // blood collected
        "Deferred", // failed medical check
        "Cancelled", // donor didn’t show
      ],
      default: "Scheduled",
    },
    screening: {
      hemoglobin: {
        type: Number,
      },
      bloodPressure: {
        type: String,
      },
      weight: {
        type: Number,
      },
      temperature: {
        type: Number,
      },
      pulse: {
        type: Number,
      },
      passed: {
        type: Boolean,
      },
      remarks: {
        type: String,
      },
    },
    labTests: {
      hiv: {
        type: Boolean,
        default: null,
        //null : test not done yet,
        //true : test done , infection not found (Safe),
        //false : test done , infection found (Unsafe)
      },
      hepatitisB: {
        type: Boolean,
        default: null,
      },
      hepatitisC: {
        type: Boolean,
        default: null,
      },
      malaria: {
        type: Boolean,
        default: null,
      },
      syphilis: {
        type: Boolean,
        default: null,
      },
      testedAt: {
        type: Date,
      },
    },
    deferralReason: {
      type: String,
      trim: true,
    },
    bloodUnits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BloodStock",
      },
    ],
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Donation", donationSchema);
