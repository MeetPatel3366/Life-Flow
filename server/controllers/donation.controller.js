import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Hospital from "../models/hospital.model.js";
import User from "../models/user.model.js";
import Donation from "../models/donation.model.js";
import mongoose from "mongoose";

export const createDonation = asyncHandler(async (req, res) => {
  const { hospitalId, scheduledDate } = req.body;
  const donorId = req.user._id;

  const [donor, hospital] = await Promise.all([
    User.findById(donorId)
      .select("isActive eligibilityStatus lastDonationDate bloodGroup")
      .lean(),
    Hospital.findById(hospitalId).select("verificationStatus isActive").lean(),
  ]);

  if (!donor || !donor.isActive) {
    throw new ApiError(403, "Your account is inactive or not found");
  }

  if (donor.eligibilityStatus !== "Eligible") {
    throw new ApiError(
      400,
      `You are not eligible to donate. status: ${donor.eligibilityStatus}`,
    );
  }

  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  if (hospital.verificationStatus !== "Approved" || !hospital.isActive) {
    throw new ApiError(400, "Hospital is not accepting donations currently");
  }

  if (donor.lastDonationDate) {
    const diffDays =
      (Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24);

    const MIN_DONATION_GAP_DAYS = 90;
    if (diffDays < MIN_DONATION_GAP_DAYS) {
      const remaining = Math.ceil(MIN_DONATION_GAP_DAYS) - diffDays;

      throw new ApiError(400, `You can donate again after ${remaining} days`);
    }
  }
  try {
    const donation = await Donation.create({
      donor: donorId,
      hospital: hospitalId,
      bloodGroup: donor.bloodGroup,
      scheduledDate: new Date(scheduledDate),
      status: "Scheduled",
    });

    return res
      .status(201)
      .json(new ApiResponse(201, donation, "Donation scheduled successfully"));
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(400, "You already have an active donation booking");
    }
    throw error;
  }
});
