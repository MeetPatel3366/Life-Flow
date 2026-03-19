import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Hospital from "../models/hospital.model.js";
import Request from "../models/request.model.js";
import BloodStock from "../models/bloodStock.model.js";
import Transfer from "../models/transfer.model.js";

export const createRequest = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  const {
    hospital: hospitalId,
    bloodGroup,
    componentType,
    unitsRequired,
    urgency,
    requiredDate,
    diagnosis,
    notes,
  } = req.body;

  const [hospitalDoc, existingActiveRequest] = await Promise.all([
    Hospital.findOne({
      _id: hospitalId,
      verificationStatus: "Approved",
      isActive: true,
    }).lean(),

    Request.findOne({
      hospital: hospitalId,
      patient: patientId,
      status: { $in: ["Pending", "Approved", "Ready for Issue"] },
    }).lean(),
  ]);

  if (!hospitalDoc) {
    throw new ApiError(
      404,
      "Hospital not found or is currently not authorized to accept requests.",
    );
  }

  if (existingActiveRequest) {
    throw new ApiError(
      400,
      "You already have an active request for this specific hospital.",
    );
  }

  if (requiredDate && new Date(requiredDate) < new Date()) {
    throw new ApiError(400, "Required date cannot be in the past");
  }

  const newRequest = await Request.create({
    patient: patientId,
    hospital: hospitalId,
    bloodGroup: bloodGroup,
    componentType,
    unitsRequired,
    urgency,
    requiredDate,
    diagnosis,
    notes,
    status: "Pending",
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, "Blood request submitted successfully", newRequest),
    );
});

export const getMyRequests = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  const { status, page, limit, sortBy, sortOrder } = req.query;

  const skip = (page - 1) * limit;

  const filter = {
    patient: patientId,
  };

  if (status) {
    filter.status = status;
  }

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [requests, totalCount] = await Promise.all([
    Request.find(filter).sort(sort).skip(skip).limit(limit).lean(),

    Request.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "Patient request history fetched successfully", {
      requests,
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
