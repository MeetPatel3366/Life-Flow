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

export const getMyDonations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const skip = (page - 1) * limit;

  const filter = {
    donor: new mongoose.Types.ObjectId(req.user._id),
  };

  if (status) {
    filter.status = status;
  }

  const [donations, totalCount] = await Promise.all([
    Donation.find(filter)
      .populate({
        path: "hospital",
        select: "name type phone address",
      })
      .sort({ donor: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .lean(),

    Donation.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        donations,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      "Donations fetched successfully",
    ),
  );
});

export const cancelDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const donorId = req.user._id;

  const donation = await Donation.findOneAndUpdate(
    {
      _id: id,
      donor: donorId,
      status: "Scheduled",
      scheduledDate: { $gte: new Date() },
    },
    {
      $set: { status: "Cancelled" },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select("_id status")
    .lean();

  if (!donation) {
    const existing = await Donation.findById(id).lean();
    if (existing.donor.toString() !== donorId.toString()) {
      throw new ApiError(403, "You can only cancel your own donation");
    }

    if (existing.status !== "Scheduled") {
      throw new ApiError(
        400,
        `Cannot cancel donation in '${existing.status}' status`,
      );
    }

    if (existing.scheduledDate < new Date()) {
      throw new ApiError(400, "Cannot cancel past scheduled donation");
    }

    throw new ApiError(400, "Cancellation criteria not met");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, donation, "Donation cancelled successfully"));
});

export const getHospitalDonations = asyncHandler(async (req, res) => {
  const { hospitalId, isHospitalVerified } = req.user;

  if (!hospitalId) {
    throw new ApiError(400, "Hospital account not linked properly");
  }

  if (!isHospitalVerified) {
    throw new ApiError(403, "Hospital not verified yet");
  }

  const { status, fromDate, toDate, page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const filter = {
    hospital: hospitalId,
  };

  if (status) {
    filter.status = status;
  }

  if (fromDate || toDate) {
    filter.scheduledDate = {};
    if (fromDate) {
      const start = new Date(fromDate);
      filter.scheduledDate.$gte = start;
    }
    if (toDate) {
      const end = new Date(toDate);
      filter.scheduledDate.$lte = end;
    }
  }

  const [donations, totalCount] = await Promise.all([
    Donation.find(filter)
      .populate("donor", "name email bloodGroup phone")
      .sort({ status: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .lean(),

    Donation.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        donations,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      "Hospital donations fetched successfully",
    ),
  );
});

export const getDonationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const filter = { _id: id };

  if (user.role === "donor") {
    filter.donor = user._id;
  } else if (user.role == "hospital") {
    if (!user.hospitalId) {
      throw new ApiError(400, "Hospital not linked properly");
    }
    filter.hospital = user.hospitalId;
  }
  const donation = await Donation.findOne(filter)
    .populate("donor", "name email bloodGroup phone")
    .populate("hospital", "name type phone address")
    .populate("verifiedBy", "name role")
    .lean();

  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, donation, "Donation fetched successfully"));
});

export const updateScreening = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  if (user.role == "hospital" && !user.hospitalId) {
    throw new ApiError(400, "Hospital not linked properly");
  }

  const {
    hemoglobin,
    bloodPressure,
    weight,
    temperature,
    pulse,
    passed,
    remarks,
    deferralReason,
  } = req.body;

  const updateQuery = {
    _id: id,
    status: "Scheduled",
  };

  if (user.role == "hospital") {
    updateQuery.hospital = user.hospitalId;
  }

  const statusUpdate = passed ? "Screening" : "Deferred";

  const donation = await Donation.findOneAndUpdate(
    updateQuery,
    {
      $set: {
        status: statusUpdate,
        verifiedBy: user._id,
        deferralReason: passed ? undefined : deferralReason,
        screening: {
          hemoglobin,
          bloodPressure,
          weight,
          temperature,
          pulse,
          passed,
          remarks,
        },
      },
    },
    { new: true, runValidators: true },
  ).lean();

  if (!donation) {
    const existing = await Donation.findById(id).lean();

    if (!existing) throw new ApiError(404, "Donation not found");

    if (
      user.role == "hospital" &&
      existing.hospital.toString() !== user.hospitalId.toString()
    ) {
      throw new ApiError(
        403,
        "Access denied: This donation belongs to another hospital",
      );
    }

    if (existing.status !== "Scheduled") {
      throw new ApiError(
        400,
        `Cannot screen: Donation is already ${existing.status}`,
      );
    }

    throw new ApiError(400, "Update failed: Screening criteria not met");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        donation,
        passed
          ? "Screening completed successfully"
          : "Donation deferred after screening",
      ),
    );
});

export const completeDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const donation = await Donation.findById(id)
    .select("status screening hospital donor")
    .lean();

  if (!donation) {
    throw new ApiError(404, "Donation record not found");
  }

  if (
    user.role === "hospital" &&
    donation.hospital.toString() != user.hospitalId.toString()
  ) {
    throw new ApiError(
      403,
      "You can only complete your own hospital donations",
    );
  }

  if (donation.status !== "Screening") {
    throw new ApiError(
      400,
      `Cannot complete donation in '${donation.status}' state`,
    );
  }

  if (!donation.screening?.passed) {
    throw new ApiError(
      400,
      "Donation cannot be completed because screening did not pass",
    );
  }

  const today = new Date();
  const nextEligible = new Date(today);
  nextEligible.setDate(nextEligible.getDate() + 90);

  const donorUpdate = await User.findByIdAndUpdate(
    donation.donor,
    {
      $set: {
        lastDonationDate: today,
        nextEligibleDate: nextEligible,
      },
    },
    { new: true, runValidators: true },
  ).lean();

  if (!donorUpdate) {
    throw new ApiError(404, "Associated donor could not be found or updated");
  }

  const updateDonation = await Donation.findOneAndUpdate(
    { _id: id, status: "Screening" },
    {
      $set: {
        status: "Completed",
        donationDate: today,
      },
    },
    { new: true },
  )
    .select("-__v")
    .lean();

  if (!updateDonation) {
    throw new ApiError(409, "Donation was already modified by another process");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateDonation,
        "Donaton completed and donor eligibility updated",
      ),
    );
});

export const updateLabTests = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hiv, hepatitisB, hepatitisC, malaria, syphilis } = req.body;
  const user = req.user;

  const donation = await Donation.findById(id)
    .select("status hospital labTests")
    .lean();

  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  if (
    user.role === "hospital" &&
    donation.hospital.toString() !== user.hospitalId.toString()
  ) {
    throw new ApiError(403, "You can update only your hospital donations");
  }

  if (donation.status !== "Completed") {
    throw new ApiError(
      400,
      "Lab tests can only be updated after donation is completed",
    );
  }

  if (donation.labTests?.testedAt) {
    throw new ApiError(400, "Lab tests already finalized");
  }

  const hasPositive = [hiv, hepatitisB, hepatitisC, malaria, syphilis].some(
    (result) => result === "Positive",
  );

  const finalStatus = hasPositive ? "Deferred" : "Completed";
  const deferralReason = hasPositive
    ? "Infectious disease detected in lab test"
    : null;

  const updatedDonation = await Donation.findOneAndUpdate(
    {
      _id: id,
      status: "Completed",
      "labTests.testedAt": { $exists: false },
    },
    {
      $set: {
        "labTests.hiv": hiv,
        "labTests.hepatitisB": hepatitisB,
        "labTests.hepatitisC": hepatitisC,
        "labTests.malaria": malaria,
        "labTests.syphilis": syphilis,
        "labTests.testedAt": new Date(),
        status: finalStatus,
        deferralReason: deferralReason,
      },
    },
    { new: true },
  )
    .select("-__v")
    .lean();

  if (!updatedDonation) {
    throw new ApiError(
      409,
      "Update failed: The record was modified by another user or is in an invalid state",
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedDonation,
        hasPositive
          ? "Lab tests updated. Donation marked as deferred due to positive result."
          : "Lab tests updated successfully. Donation is safe.",
      ),
    );
});

export const getDonationsByHospital = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const filter = {
    hospital: new mongoose.Types.ObjectId(hospitalId),
  };

  if (status) {
    filter.status = status;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
  }

  const [donations, totalCount] = await Promise.all([
    await Donation.find(filter)
      .populate("donor", "name email bloodGroup")
      .populate("hospital", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v -updatedAt")
      .lean(),

    Donation.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        donations,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      "Hospital donations fetched successfully",
    ),
  );
});

export const rescheduleDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduledDate } = req.body;
  const user = req.user;

  const donation = await Donation.findById(id)
    .select("donor status scheduledDate")
    .lean();

  if (!donation) {
    throw new ApiError(404, "Donation record not found");
  }

  if (donation.donor.toString() !== user._id.toString()) {
    throw new ApiError(403, "You can only reschedule your own donation");
  }

  if (donation.status !== "Scheduled") {
    throw new ApiError(
      400,
      `Donation cannot be rescheduled after ${donation.status}`,
    );
  }

  const donor = await User.findById(user._id).select("nextEligibleDate").lean();

  if (
    donor.nextEligibleDate &&
    new Date(scheduledDate) < new Date(donor.nextEligibleDate)
  ) {
    throw new ApiError(
      400,
      `You are eligible to donate only after ${donor.nextEligibleDate}`,
    );
  }

  const updateDonation = await Donation.findByIdAndUpdate(
    id,
    { $set: { scheduledDate: new Date(scheduledDate) } },
    { new: true, runValidators: true },
  )
    .select("-__v")
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(200, updateDonation, "Donation rescheduled successfully"),
    );
});