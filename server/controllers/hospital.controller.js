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
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }),
  );
});

export const approveHospital = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can approve hospitals");
  }

  const hospital = await Hospital.findOneAndUpdate(
    {
      _id: id,
      verificationStatus: { $ne: "Approved" },
    },
    {
      $set: {
        verificationStatus: "Approved",
        isActive: true,
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
    },
    { new: true, runValidators: true },
  );

  if (!hospital) {
    const existing = await Hospital.findById(id);

    if (!existing) {
      throw new ApiError(404, "Hospital not found");
    }

    throw new ApiError(400, "Hospital is already approved");
  }

  await User.updateOne(
    { hospitalId: hospital._id },
    { $set: { isHospitalVerified: true } },
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        hospitalId: hospital._id,
        verificationStatus: hospital.verificationStatus,
        verifiedAt: hospital.verifiedAt,
      },
      "Hospital approved successfully",
    ),
  );
});

export const rejectHospital = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can approve hospitals");
  }

  const hospital = await Hospital.findOneAndUpdate(
    {
      _id: id,
      verificationStatus: { $ne: "Rejected" },
    },
    {
      $set: {
        verificationStatus: "Rejected",
        isActive: false,
        rejectedBy: req.user._id,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason,
        verifiedBy: null,
        verifiedAt: null,
      },
    },
    { new: true, runValidators: true },
  );

  if (!hospital) {
    const existing = await Hospital.findById(id);

    if (!existing) {
      throw new ApiError(404, "Hospital not found");
    }

    throw new ApiError(400, "Hospital is already rejected");
  }

  await User.updateOne(
    { hospitalId: hospital._id },
    { $set: { isHospitalVerified: false } },
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        hospitalId: hospital._id,
        verificationStatus: hospital.verificationStatus,
        rejectedAt: hospital.rejectedAt,
        rejectionReason: hospital.rejectionReason,
      },
      "Hospital rejected successfully",
    ),
  );
});

export const getHospitals = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can access hospital list");
  }

  const { page, limit, status, search, sortBy, order } = req.query;

  const skip = (page - 1) * limit;

  const filter = {};

  if (status) {
    filter.verificationStatus = status;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.name = { $regex: escapedSearch, $options: "i" };
  }

  const sortOrder = order === "asc" ? 1 : -1;

  const [hospitals, totalCount] = await Promise.all([
    Hospital.find(filter)
      .select("name phone verificationStatus isActive address createdAt")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),

    Hospital.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        hospitals,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit,
        },
      },
      "Hospitals fetched successfully",
    ),
  );
});

export const getHospitalById = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can access hospital details");
  }

  const { id } = req.params;

  const hospital = await Hospital.findById(id)
    .populate("verifiedBy", "name email role")
    .populate("rejectedBy", "name email role")
    .select("-__v")
    .lean();

  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  const processedHospital = {
    ...hospital,
    isVerified: hospital.verificationStatus === "Approved",
    canBeEdited: hospital.verificationStatus !== "Approved",
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        processedHospital,
        "Hospital details fetched successfully",
      ),
    );
});