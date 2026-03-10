import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Hospital from "../models/hospital.model.js";
import BloodStock from "../models/bloodStock.model.js";
import Donation from "../models/donation.model.js";
import mongoose from "mongoose";

export const createBloodStock = asyncHandler(async (req, res) => {
  const { donationId, componentType, quantity, expiryDate, notes } = req.body;

  const hospitalId = req.user.hospitalId;

  if (!hospitalId) {
    throw new ApiError(403, "Hospital account not linked properly");
  }

  const [hospital, donation, existingStock] = await Promise.all([
    Hospital.findById(hospitalId).select("verificationStatus isActive").lean(),
    Donation.findById(donationId).lean(),
    BloodStock.exists({ donation: donationId, componentType }),
  ]);

  if (!hospital) {
    throw new ApiError(404, "hospital not found");
  }

  if (
    hospital.verificationStatus !== "Approved" ||
    hospital.isActive !== true
  ) {
    throw new ApiError(
      403,
      "Only approved and active hospitals can create blood stock",
    );
  }

  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  if (!donation.hospital.equals(hospitalId)) {
    throw new ApiError(
      403,
      "You can only create stock for your hospital donations",
    );
  }

  if (donation.status !== "Completed") {
    throw new ApiError(
      400,
      "Stock can only be created for completed donations",
    );
  }

  const requiredTests = [
    "hiv",
    "hepatitisB",
    "hepatitisC",
    "malaria",
    "syphilis",
  ];
  const hasFailedTests = requiredTests.some(
    (test) => donation.labTests[test] !== "Negative",
  );

  if (hasFailedTests) {
    throw new ApiError(
      400,
      "Cannot create stock. all lab tests must be Negative",
    );
  }

  if (existingStock) {
    throw new ApiError(
      409,
      "Stock for this component already exists for this donation",
    );
  }

  let finalExpiryDate = expiryDate;

  if (!finalExpiryDate) {
    const donationDate = donation.donationDate || new Date();

    const expiryMap = {
      "Whole Blood": 35,
      RBC: 42,
      Plasma: 365,
      Platelets: 5,
    };

    const days = expiryMap[componentType];

    if (!days) {
      throw new ApiError(400, "Invalid componentType");
    }

    finalExpiryDate = new Date(
      donationDate.getTime() + days * 24 * 60 * 60 * 1000,
    );
  }

  const bloodStock = await BloodStock.create({
    hospital: hospitalId,
    donation: donationId,
    bloodGroup: donation.bloodGroup,
    componentType,
    quantity,
    expiryDate: finalExpiryDate,
    screeningPassed: true,
    notes,
  });

  await Donation.findByIdAndUpdate(donationId, {
    $push: {
      bloodUnits: bloodStock._id,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Blood stock created successfully", bloodStock));
});

export const getBloodStock = asyncHandler(async (req, res) => {
  const {
    bloodGroup,
    componentType,
    status,
    hospitalId,
    page = 1,
    limit = 10,
    sortBy,
    sortOrder,
  } = req.query;

  const skip = (page - 1) * limit;

  const filter = {};

  if (req.user.role == "hospital") {
    filter.hospital = req.user.hospitalId;
  }

  if (req.user.role == "admin" && hospitalId) {
    filter.hospital = hospitalId;
  }

  if (bloodGroup) {
    filter.bloodGroup = bloodGroup;
  }

  if (componentType) {
    filter.componentType = componentType;
  }

  if (status) {
    filter.status = status;
  }

  const expiredCount = await BloodStock.countDocuments({
    expiryDate: { $lt: new Date() },
    status: "Active",
  });

  if (expiredCount > 0) {
    await BloodStock.updateMany(
      {
        expiryDate: { $lt: new Date() },
        status: "Active",
      },
      {
        $set: {
          status: "Expired",
        },
      },
    );
  }

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [bloodStocks, totalCount] = await Promise.all([
    BloodStock.find(filter)
      .populate("hospital", "name type address phone")
      .populate({
        path: "donation",
        select: "donor donationDate bloodGroup",
        populate: {
          path: "donor",
          model: "User",
          select: "name email phone",
        },
      })
      .select("-__v")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    BloodStock.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "Blood stock fetched successfully", {
      bloodStocks,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }),
  );
});

export const getBloodStockById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bloodStock = await BloodStock.findById(id)
    .populate("hospital", "name type address phone")
    .populate({
      path: "donation",
      select: "donor donationDate",
      populate: {
        path: "donor",
        model: "User",
        select: "name email phone bloodGroup",
      },
    })
    .populate("request", "patient bloodGroup status")
    .populate("transfer", "status")
    .lean();

  if (!bloodStock) {
    throw new ApiError(404, "Blood stock not found");
  }

  if (req.user.role === "hospital") {
    const hospital = await Hospital.findById(req.user.hospitalId).select("_id");

    if (!hospital) {
      throw new ApiError(403, "Hospital not associated with user");
    }

    if (
      !bloodStock.hospital ||
      bloodStock.hospital._id.toString() !== hospital._id.toString()
    ) {
      throw new ApiError(403, "You are not allowed to access this blood stock");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Blood stock fetched successfully", bloodStock));
});

export const getHospitalBloodStock = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;

  const {
    bloodGroup,
    componentType,
    status,
    page = 1,
    limit = 10,
    sortBy,
    sortOrder,
  } = req.query;

  const hospital = await Hospital.findById(hospitalId)
    .select("name address phone")
    .lean();

  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  const filter = {
    hospital: hospitalId,
  };

  if (bloodGroup) {
    filter.bloodGroup = bloodGroup;
  }

  if (componentType) {
    filter.componentType = componentType;
  }

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [bloodStocks, totalCount] = await Promise.all([
    BloodStock.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "donation",
        select: "donor donationDate bloodGroup",
        populate: {
          path: "donor",
          model: "User",
          select: "name email phone",
        },
      })
      .lean(),

    BloodStock.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "Hospital blood stock fetched successfully", {
      hospital,
      bloodStocks,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }),
  );
});

export const updateBloodStockStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const bloodStock = await BloodStock.findById(id).lean();

  if (!bloodStock) {
    throw new ApiError(404, "Blood stock not found");
  }

  if (
    req.user.role === "hospital" &&
    bloodStock.hospital.toString() !== req.user.hospitalId.toString()
  ) {
    throw new ApiError(403, "Unauthorized to modify this stock");
  }

  if (["Issued", "Discarded"].includes(bloodStock.status)) {
    throw new ApiError(
      400,
      `Cannot modify stock once it is ${bloodStock.status}`,
    );
  }

  if (bloodStock.status == status) {
    throw new ApiError(400, "Stock already in requested status");
  }

  if (new Date(bloodStock.expiryDate) < new Date() && status !== "Expired") {
    throw new ApiError(400, "Stock is already expired");
  }

  const updateBloodStock = await BloodStock.findByIdAndUpdate(
    id,
    {
      status,
      ...(notes && { notes }),
      updatedAt: new Date(),
    },
    {
      new: true,
    },
  ).lean();

  if (!updateBloodStock) {
    throw new ApiError(500, "Failed to update blood stock");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Blood stock status updated successfully",
        updateBloodStock,
      ),
    );
});
