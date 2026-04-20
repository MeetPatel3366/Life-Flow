import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Complaint from "../models/complaint.model.js";
import handleFileUpload from "../utils/handleFileUpload.js";

export const createComplaint = asyncHandler(async (req, res) => {
  const { category, subject, description, hospital } = req.body;
  const userId = req.user._id;

  const complaintData = {
    raisedBy: userId,
    category,
    subject,
    description,
    status: "Open",
  };

  if (hospital) {
    complaintData.hospital = hospital;
  }

  if (req.file) {
    const uploadedFile = await handleFileUpload(
      req.file,
      "lifeflow/complaints",
    );
    complaintData.attachment = {
      fileUrl: uploadedFile,
      uploadedAt: new Date(),
    };
  }

  const complaint = await Complaint.create(complaintData);

  return res
    .status(201)
    .json(
      new ApiResponse(201, "Complaint submitted successfully", complaint),
    );
});

export const getMyComplaints = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, category, page, limit, sortBy, sortOrder } = req.query;

  const skip = (page - 1) * limit;

  const filter = { raisedBy: userId };

  if (status) filter.status = status;
  if (category) filter.category = category;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [complaints, totalCount] = await Promise.all([
    Complaint.find(filter)
      .select("category subject status hospital createdAt")
      .populate("hospital", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "Complaints fetched successfully", {
      complaints,
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

export const getComplaintById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const complaint = await Complaint.findById(id)
    .populate("raisedBy", "name email role")
    .populate("hospital", "name type address phone")
    .populate("handledBy", "name email role")
    .lean();

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  if (
    user.role !== "admin" &&
    complaint.raisedBy._id.toString() !== user._id.toString()
  ) {
    throw new ApiError(403, "You are not authorized to view this complaint");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Complaint details fetched successfully", complaint),
    );
});

export const getHospitalComplaints = asyncHandler(async (req, res) => {
  const hospitalId = req.user.hospitalId;

  if (!hospitalId) {
    throw new ApiError(400, "Hospital profile not linked to user");
  }

  const { status, category, page, limit, sortBy, sortOrder } = req.query;

  const skip = (page - 1) * limit;

  const filter = { hospital: hospitalId };

  if (status) filter.status = status;
  if (category) filter.category = category;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [complaints, totalCount] = await Promise.all([
    Complaint.find(filter)
      .select("category subject status raisedBy createdAt")
      .populate("raisedBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "Hospital complaints fetched successfully", {
      complaints,
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

export const getAllComplaints = asyncHandler(async (req, res) => {
  const { status, category, search, page, limit, sortBy, sortOrder } =
    req.query;

  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.subject = { $regex: escapedSearch, $options: "i" };
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [complaints, totalCount] = await Promise.all([
    Complaint.find(filter)
      .select(
        "category subject status raisedBy hospital handledBy createdAt resolvedAt",
      )
      .populate("raisedBy", "name email role")
      .populate("hospital", "name")
      .populate("handledBy", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "All complaints fetched successfully", {
      complaints,
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

export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const adminId = req.user._id;

  const complaint = await Complaint.findById(id).select("status").lean();

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  if (complaint.status !== "Open") {
    throw new ApiError(
      400,
      `Cannot move complaint to '${status}' from '${complaint.status}'. Only 'Open' complaints can be moved to 'In Review'`,
    );
  }

  const updatedComplaint = await Complaint.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "In Review",
        handledBy: adminId,
      },
    },
    { new: true },
  )
    .select("status handledBy updatedAt")
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Complaint status updated to In Review",
        updatedComplaint,
      ),
    );
});

export const resolveComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, resolutionNote } = req.body;
  const adminId = req.user._id;

  const complaint = await Complaint.findById(id).select("status").lean();

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  const allowedFrom = ["Open", "In Review"];
  if (!allowedFrom.includes(complaint.status)) {
    throw new ApiError(
      400,
      `Cannot resolve complaint from '${complaint.status}' status. Must be 'Open' or 'In Review'`,
    );
  }

  const updatedComplaint = await Complaint.findByIdAndUpdate(
    id,
    {
      $set: {
        status,
        resolutionNote,
        handledBy: adminId,
        resolvedAt: new Date(),
      },
    },
    { new: true },
  )
    .populate("raisedBy", "name email")
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Complaint ${status.toLowerCase()} successfully`,
        updatedComplaint,
      ),
    );
});

export const cancelComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const complaint = await Complaint.findOneAndUpdate(
    {
      _id: id,
      raisedBy: userId,
      status: "Open",
    },
    {
      $set: { status: "Closed" },
    },
    { new: true },
  )
    .select("status updatedAt")
    .lean();

  if (!complaint) {
    const existing = await Complaint.findById(id).lean();

    if (!existing) {
      throw new ApiError(404, "Complaint not found");
    }

    if (existing.raisedBy.toString() !== userId.toString()) {
      throw new ApiError(403, "You can only cancel your own complaints");
    }

    throw new ApiError(
      400,
      `Cannot cancel complaint in '${existing.status}' status. Only 'Open' complaints can be cancelled`,
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Complaint cancelled successfully", complaint));
});
