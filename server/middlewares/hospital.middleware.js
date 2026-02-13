import { asyncHandler } from "../utils/asyncHandler";
import Hospital from "../models/hospital.model.js";
import { ApiError } from "../utils/ApiError";

export const requireApprovedHospital = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "hospital") {
    return next();
  }

  const hospital = await Hospital.findById(req.user.hospitalId);

  if (!hospital) {
    throw new ApiError(403, "Hospital profile not completed");
  }

  if (!req.user.isHospitalVerified) {
    throw new ApiError(
      403,
      "Your hospital authorization is still pending admin approval.",
    );
  }
  next();
});
