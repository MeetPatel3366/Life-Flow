import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Hospital from "../models/hospital.model.js";
import Request from "../models/request.model.js";

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

export const getMyRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.user._id;

  const request = await Request.findOne({
    _id: id,
    patient: patientId,
  })
    .populate("hospital", "name type address location phone")
    .populate("bloodUnits", "bloodGroup componentType status expiryDate")
    .populate("transfer")
    .lean();

  if (!request) {
    throw new ApiError(404, "Request not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Request details fetched successfully", request),
    );
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.user._id;

  const request = await Request.findOneAndUpdate(
    {
      _id: id,
      patient: patientId,
      status: "Pending",
    },
    {
      $set: { status: "Cancelled" },
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!request) {
    const existingRequest = await Request.exists({
      _id: id,
      patient: patientId,
    });

    if (!existingRequest) {
      throw new ApiError(404, "Request not found or unauthorized");
    }

    throw new ApiError(400, "Only pending requests can be cancelled");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Request cancelled successfully", request));
});
