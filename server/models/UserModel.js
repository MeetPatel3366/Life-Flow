import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: TransformStreamDefaultController,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.isOAuthUser;
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    isOAuthUser: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["admin", "donor", "patient", "hospital"],
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    age: {
      type: Number,
      min: 18,
      max: 65,
    },
    weight: {
      type: Number,
      min: 50,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    medicalHistory: {
      type: String,
      trim: true,
    },
    eligibilityStatus: {
      type: String,
      enum: ["Eligible", "Temporarily Not Eligible", "Deferred"],
      default: "Eligible",
    },
    lastDonationDate: {
      type: Date,
    },
    nextEligibleDate: {
      type: Date,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
