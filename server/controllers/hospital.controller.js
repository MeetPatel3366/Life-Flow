import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Hospital from "../models/hospital.model.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import handleFileUpload from "../utils/handleFileUpload.js";

export const registerHospital = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "hospital") {
    throw new ApiError(403, "Only hospital accounts can register a hospital");
  }

  if (user.hospitalId) {
    throw new ApiError(400, "Hospital profile already exists for this account");
  }

  const existingLicense = await Hospital.findOne({
    licenseNumber: req.body.licenseNumber,
  });

  if (existingLicense) {
    throw new ApiError(409, "Hospital with this license number already exists");
  }

  if (!req.file) {
    throw new ApiError(400, "License document is required");
  }

  const uploadedDoc = await handleFileUpload(req.file, "lifeflow/hospitals");

  const newHospital = await Hospital.create({
    ...req.body,
    licenseDocument: uploadedDoc,
    verificationStatus: "Pending",
    isActive: false,
  });

  await User.findByIdAndUpdate(user._id, { hospitalId: newHospital._id });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newHospital,
        "Hospital registered successfully. Awaiting admin approval.",
      ),
    );
});

export const getPendingHospitals = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can access pending hospitals");
  }

  const { page, limit } = req.query;
  const skip = (page - 1) * limit;

  const filter = {
    verificationStatus: "Pending",
  };

  const [hospitals, total] = await Promise.all([
    Hospital.find(filter)
      .select(
        "name type licenseNumber phone address verificationStatus createdAt",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Hospital.countDocuments(filter),
  ]);

  if (page > Math.ceil(total / limit) && total > 0) {
    throw new ApiError(404, "This page does not exists");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      hospitals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }),
  );
});
