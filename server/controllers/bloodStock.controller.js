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

export const separateComponents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { createPlatelets } = req.body;
  const user = req.user;

  const [parentUnit, hospital] = await Promise.all([
    BloodStock.findById(id).lean(),
    Hospital.findById(user.hospitalId).lean(),
  ]);

  if (!parentUnit) {
    throw new ApiError(404, "Blood unit not found");
  }

  if (
    user.role === "hospital" &&
    parentUnit.hospital.toString() !== user.hospitalId.toString()
  ) {
    throw new ApiError(403, "Unauthorized to separate this unit");
  }

  if (parentUnit.componentType !== "Whole Blood") {
    throw new ApiError(400, "Only Whole Blood can be separated");
  }

  if (parentUnit.status !== "Available") {
    throw new ApiError(400, "Only Available units can be separated");
  }

  if (parentUnit.isComponentSeparated) {
    throw new ApiError(400, "Components already separated");
  }

  if (!hospital?.hasComponentSeparation) {
    throw new ApiError(
      400,
      "Your hospital does not have component separation capability",
    );
  }

  const now = new Date();

  const expiryRules = [
    { type: "RBC", days: 40 },
    { type: "Plasma", years: 1 },
    ...(createPlatelets ? [{ type: "Platelets", days: 5 }] : []),
  ];

  const updatedParentUnit = await BloodStock.findOneAndUpdate(
    {
      _id: id,
      isComponentSeparated: false,
      status: "Available",
    },
    {
      $set: {
        status: "Processed",
        isComponentSeparated: true,
      },
    },
    { new: true },
  ).lean();

  if (!updatedParentUnit) {
    throw new ApiError(
      409,
      "Unit was modified by another process. Please refresh and try again.",
    );
  }

  const componentsToCreate = expiryRules.map((rule) => {
    const expiry = new Date(now);
    if (rule.days) {
      expiry.setDate(expiry.getDate() + rule.days);
    }
    if (rule.years) {
      expiry.setFullYear(expiry.getFullYear() + rule.years);
    }

    return {
      hospital: parentUnit.hospital,
      donation: parentUnit.donation,
      bloodGroup: parentUnit.bloodGroup,
      componentType: rule.type,
      expiryDate: expiry,
      parentUnit: parentUnit._id,
      status: "Available",
    };
  });

  const createdUnits = await BloodStock.insertMany(componentsToCreate);

  return res.status(201).json(
    new ApiResponse(201, "Components separated successfully", {
      parent: updatedParentUnit._id,
      components: createdUnits,
    }),
  );
});

export const getAvailableBloodStock = asyncHandler(async (req, res) => {
  const {
    bloodGroup,
    componentType,
    hospital,
    page = 1,
    limit = 10,
    sortBy,
    sortOrder,
  } = req.query;

  const user = req.user;

  const skip = (page - 1) * limit;
  const now = new Date();

  const filter = {
    status: "Available",
    expiryDate: { $gt: now },
  };

  if (bloodGroup) {
    filter.bloodGroup = bloodGroup;
  }

  if (componentType) {
    filter.componentType = componentType;
  }

  if (hospital) {
    filter.hospital = hospital;
  }

  if (user.role === "hospital") {
    filter.hospital = user.hospitalId;
  }

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [bloodStocks, totalCount] = await Promise.all([
    BloodStock.find(filter)
      .populate("hospital", "name phone address location")
      .select("-__v -updatedAt")
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean(),

    BloodStock.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "Available blood stock fetched successfully", {
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

export const getBloodStockStats = asyncHandler(async (req, res) => {
  const { hospital, expiringInDays = 7 } = req.query;

  const now = new Date();
  const expiryThreshold = new Date();
  expiryThreshold.setDate(now.getDate() + expiringInDays);

  const matchStage = {};

  if (hospital) {
    matchStage.hospital = new mongoose.Types.ObjectId(hospital);
  }

  const stats = await BloodStock.aggregate([
    { $match: matchStage },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalUnits: {
                $sum: 1,
              },
              availableUnits: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Available"] }, 1, 0],
                },
              },
              reservedUnits: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Reserved"] }, 1, 0],
                },
              },
              issuedUnits: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Issued"] }, 1, 0],
                },
              },
              expiredUnits: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Expired"] }, 1, 0],
                },
              },
            },
          },
        ],

        byBloodGroup: [
          {
            $group: {
              _id: "$bloodGroup",
              total: { $sum: 1 },
              available: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Available"] }, 1, 0],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ],

        byComponentType: [
          {
            $group: {
              _id: "$componentType",
              total: { $sum: 1 },
              available: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Available"] }, 1, 0],
                },
              },
            },
          },
        ],

        expiringSoon: [
          {
            $match: {
              expiryDate: { $gte: now, $lte: expiryThreshold },
              status: "Available",
            },
          },
          {
            $group: {
              _id: "$bloodGroup",
              count: { $sum: 1 },
            },
          },
        ],

        lowStock: [
          {
            $group: {
              _id: "$bloodGroup",
              available: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Available"] }, 1, 0],
                },
              },
            },
          },
          { $match: { available: { $lt: 5 } } },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Blood stock statistics fetched successfully",
        stats[0],
      ),
    );
});

export const updateBloodStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;

  const filter = {
    _id: id,
    status: "Available",
  };

  if (req.user.role === "hospital") {
    filter.hospital = req.user.hospitalId;
  }

  const updateData = {};

  if (quantity) {
    updateData.quantity = quantity;
  }

  if (notes) {
    updateData.notes = notes;
  }

  const updatedStock = await BloodStock.findOneAndUpdate(
    filter,
    { $set: updateData },
    { new: true, runValidators: true },
  ).lean();

  if (!updatedStock) {
    const exists = await BloodStock.exists({ _id: id });
    if (!exists) {
      throw new ApiError(400, "Blood stock record not found");
    }

    throw new ApiError(400, "Update failed: Stock is no longer available");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Blood stock updated successfully", updatedStock),
    );
});
