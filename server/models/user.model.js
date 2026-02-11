import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
      required: function () {
        return this.role === "donor" || this.role === "patient";
      },
    },
    age: {
      type: Number,
      min: 18,
      max: 65,
      required: function () {
        return this.role === "donor";
      },
    },
    weight: {
      type: Number,
      required: function () {
        return this.role === "donor";
      },
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
      required: function () {
        return this.role === "donor";
      },
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
    refreshToken: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      name: this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export default mongoose.model("User", userSchema);
