import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    confirmpassword,
    role,
    phone,
    bloodGroup,
    age,
    weight,
    gender,
    medicalHistory,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (!existingUser.isVerified) {
      throw new ApiError(
        409,
        "Account already exists but email is not verified. Please verify your email.",
      );
    }
    throw new ApiError(400, "User already exists");
  }

  if (password?.trim() !== confirmpassword?.trim()) {
    throw new ApiError(400, "passwords do not match");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000;

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    bloodGroup,
    age,
    weight,
    gender,
    medicalHistory,
    otp,
    otpExpiry,
    isVerified: false,
  });

  await user.save({ validateBeforeSave: false });

  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?email=${email}`;

  const transporter = nodemailer.createTransport({
    host: process.env.MAILHOST,
    port: parseInt(process.env.MAILPORT, 10),
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: email,
    subject: "Life Flow - Email Verification OTP",
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP for Life Flow registration is:</p>
      <h2>${otp}</p>
      <p>This OTP will expire in 10 minutes.</p>
      <a href="${verificationLink}">Verify Email</a>
    `,
  };

  await transporter.sendMail(mailOptions);

  return res.status(201).json(
    new ApiResponse(201, "Registration successful. Please verify your email.", {
      email: user.email,
    }),
  );
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email already verified");
  }

  if (!user.otp || !user.otpExpiry) {
    throw new ApiError(400, "OTP not found. Please request a new one.");
  }

  if (user.otp != otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (user.otpExpiry < Date.now()) {
    throw new ApiError(400, "OTP has expired");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Email verified successfully. You can now login"),
    );
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email already verified");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000;

  user.otp = otp;
  user.otpExpiry = otpExpiry;

  await user.save({ validateBeforeSave: false });

  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?email=${email}`;

  const transporter = nodemailer.createTransport({
    host: process.env.MAILHOST,
    port: parseInt(process.env.MAILPORT, 10),
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: email,
    subject: "Life Flow - New Email Verification OTP",
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP for Life Flow registration is:</p>
      <h2>${otp}</p>
      <p>This OTP will expire in 10 minutes.</p>
      <a href="${verificationLink}">Verify Email</a>
    `,
  };

  await transporter.sendMail(mailOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, "New OTP send to your email"));
});
