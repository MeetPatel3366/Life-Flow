import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import handleFileUpload from "../utils/handleFileUpload.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token",
    );
  }
};

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

  if (role === "admin") {
    throw new ApiError(403, "You cannot register as admin");
  }

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

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user?.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(200, "user logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      }),
    );
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    { $unset: { refreshToken: 1 } },
    { new: true },
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully", {}));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(200, "Access token refreshed successfully", {
        accessToken,
        refreshToken: newRefreshToken,
      }),
    );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", req.user));
});

export const updateProfileDetails = asyncHandler(async (req, res) => {
  const updates = req.body;

  const allowedFields = [
    "name",
    "phone",
    "gender",
    "medicalHistory",
    "age",
    "weight",
  ];

  const sanitizedUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      sanitizedUpdates[field] = updates[field];
    }
  }

  if (
    (sanitizedUpdates.age || sanitizedUpdates.weight) &&
    req.user.role !== "donor"
  ) {
    throw new ApiError(403, "Age and weight can be updated by donors");
  }

  if (Object.keys(sanitizedUpdates).length == 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: sanitizedUpdates },
    { new: true, runValidators: true },
  ).select("-password -refreshToken -otp -otpExpiry");

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully", user));
});

export const updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Profile image is required");
  }

  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const uploadedImage = await handleFileUpload(
    req.file,
    "lifeflow/profile-images",
    user.profileImage?.public_id,
  );

  if (!uploadedImage) {
    throw new ApiError(500, "Image upload failed");
  }

  user.profileImage = uploadedImage;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, "Profile image updated successfully", {
      profileImage: user.profileImage,
    }),
  );
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const userId = req.user?._id;

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  const isSamePassword = await user.isPasswordCorrect(newPassword);

  if (isSamePassword) {
    throw new ApiError(400, "New password must be different from old password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log("email : ", email);

  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "If an account with this email exists, a password reset link has been sent",
        ),
      );
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
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
      to: user.email,
      subject: "Life Flow - Password Reset Request",
      html: `
    <div>
    <h2>Password Reset Request</h2>
    <p>Hello,</p>
    <p>We received a request to reset your password for your <strong>Life Flow</strong> account.</p>
    <p>Please click the link below to set a new password. This link is valid for 15 minutes:</p>
    <p>
      <a href="${resetUrl}" target="_blank">
        <strong>Reset Password</strong>
      </a>
    </p>    
    <hr />
    <p>If the link above doesn't work, copy and paste this URL into your browser:</p>
    <p>${resetUrl}</p>
    <p>Best regards,<br>The Life Flow Team</p>
  </div>
  `,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "If an account with this email exists, a password reset link has been sent",
        ),
      );
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError(500, "Failed to send reset email");
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    throw new ApiError(400, "Reset token is required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const isSamePassword = await user.isPasswordCorrect(password);

  if (isSamePassword) {
    throw new ApiError(
      400,
      "New password must be different from the old password",
    );
  }

  user.password = password;
  user.passwordChangedAt = Date.now();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse("Password reset successful. you can now login"));
});
