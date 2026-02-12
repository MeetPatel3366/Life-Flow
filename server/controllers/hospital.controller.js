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
