import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Hospital from "../models/hospital.model.js";
import Request from "../models/request.model.js";
import BloodStock from "../models/bloodStock.model.js";
import Transfer from "../models/transfer.model.js";
import {
  notifyPatient,
  notifyHospital,
  notifyDonors,
  notifyAdmin,
  emitEmergencyAlert,
  notifyEscalation,
} from "../utils/notification.service.js";
import mongoose from "mongoose";

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

  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const inputDate = new Date(requiredDate);
  inputDate.setHours(0, 0, 0, 0);

  if (requiredDate && inputDate < today) {
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

  if (urgency === "Emergency") {
    emitEmergencyAlert("emergency_request_created", {
      requestId: newRequest._id,
      bloodGroup,
      units: unitsRequired,
      hospital: hospitalId,
      urgency: "Emergency"
    });

    await handleStockAllocation(newRequest, patientId, hospitalId);
  }

  notifyPatient(
    patientId,
    "request_created",
    "Blood Request Submitted",
    `Your request for ${unitsRequired} unit(s) of ${bloodGroup} ${componentType} is now Pending.`,
    "Request",
    newRequest._id
  );

  notifyHospital(
    hospitalId,
    "request_created",
    "New Blood Request",
    `A new blood request for ${unitsRequired} unit(s) of ${bloodGroup} ${componentType} has been submitted.`,
    "Request",
    newRequest._id
  );

  notifyAdmin(
    "request_created",
    "New Blood Request",
    `A new blood request for ${unitsRequired} unit(s) of ${bloodGroup} ${componentType} has been submitted to hospital.`,
    "Request",
    newRequest._id
  );

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

  const aggregatePipeline = [
    { $match: filter },
    {
      $addFields: {
        sortPriority: {
          $cond: {
            if: { $eq: ["$status", "Pending"] },
            then: {
              $cond: { if: { $eq: ["$urgency", "Emergency"] }, then: 1, else: 2 },
            },
            else: {
              $cond: { if: { $eq: ["$urgency", "Emergency"] }, then: 3, else: 4 },
            },
          },
        },
      },
    },
    { $sort: { sortPriority: 1, createdAt: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
  ];

  const [requests, totalCount] = await Promise.all([
    Request.aggregate(aggregatePipeline),
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

export const getHospitalRequests = asyncHandler(async (req, res) => {
  const hospitalId = req.user.hospitalId;

  if (!hospitalId) {
    throw new ApiError(400, "Hospital profile not linked to user");
  }

  const hospital = await Hospital.findById(hospitalId).select("_id").lean();

  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  const { status, urgency, bloodGroup, search, page, limit, sortBy, sortOrder } =
    req.query;

  const skip = (page - 1) * limit;

  const filter = {
    hospital: hospital._id,
  };

  if (status) {
    filter.status = status;
  }

  if (urgency) {
    filter.urgency = urgency;
  }

  if (bloodGroup) {
    filter.bloodGroup = bloodGroup;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patientIds = await mongoose.model("User").find({
      name: { $regex: escapedSearch, $options: "i" },
      role: "patient"
    }).distinct("_id");
    filter.patient = { $in: patientIds };
  }

  const aggregatePipeline = [
    { $match: filter },
    {
      $addFields: {
        sortPriority: {
          $cond: {
            if: { $eq: ["$status", "Pending"] },
            then: {
              $cond: { if: { $eq: ["$urgency", "Emergency"] }, then: 1, else: 2 },
            },
            else: {
              $cond: { if: { $eq: ["$urgency", "Emergency"] }, then: 3, else: 4 },
            },
          },
        },
      },
    },
    { $sort: { sortPriority: 1, createdAt: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
  ];

  const [requests, totalCount] = await Promise.all([
    Request.aggregate(aggregatePipeline).then((results) =>
      Request.populate(results, { path: "patient", select: "name email phone" }),
    ),
    Request.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "Hospital requests fetched successfully", {
      requests,
      pagination: {
        totalCount,
        totalPages,
        limit,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }),
  );
});

export const getRequestByIdForHospital = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hospitalId = req.user.hospitalId;

  const filter = { _id: id };
  if (req.user.role !== "admin") {
    filter.hospital = req.user.hospitalId;
  }

  const request = await Request.findOne(filter)
    .populate({
      path: "patient",
      select: "name email phone",
    })
    .populate({
      path: "bloodUnits",
      select: "bloodGroup componentType status expiryDate",
    })
    .populate({
      path: "transfer",
      populate: [
        { path: "fromHospital", select: "name phone" },
        { path: "toHospital", select: "name phone" }
      ]
    })
    .populate("hospital", "name")
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

export const approveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hospitalId = req.user.hospitalId;
  const userId = req.user._id;

  const request = await Request.findOne({
    _id: id,
    hospital: hospitalId,
  }).populate("hospital", "name");

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (!["Pending", "Awaiting Donor"].includes(request.status)) {
    throw new ApiError(
      400,
      `Request cannot be approved when status is '${request.status}'`,
    );
  }

  const result = await handleStockAllocation(request, userId, hospitalId);

  return res.status(200).json(new ApiResponse(200, result.message, request));
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const hospitalId = req.user.hospitalId;
  const userId = req.user._id;

  const request = await Request.findOne({
    _id: id,
    hospital: hospitalId,
  });

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (!["Pending", "Awaiting Donor"].includes(request.status)) {
    throw new ApiError(
      400,
      `Request cannot be rejected when status is '${request.status}'`,
    );
  }

  request.status = "Rejected";
  request.rejectionReason = reason;
  request.rejectedBy = userId;
  request.rejectedAt = new Date();

  await request.save();

  notifyPatient(
    request.patient,
    "request_rejected",
    "Blood Request Rejected",
    `Your blood request has been rejected. Reason: ${reason}`,
    "Request",
    request._id,
  );

  notifyAdmin(
    "request_rejected",
    "Blood Request Rejected",
    `A blood request for ${request.unitsRequired} unit(s) of ${request.bloodGroup} ${request.componentType} has been rejected by hospital. Reason: ${reason}`,
    "Request",
    request._id
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Request rejected successfully", request));
});

export const markRequestReady = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hospitalId = req.user.hospitalId;
  const userId = req.user._id;

  const request = await Request.findOne({
    _id: id,
    hospital: hospitalId,
  }).select("status bloodUnits");

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "Approved") {
    throw new ApiError(
      400,
      `Request cannnot be marked ready when status is '${request.status}'`,
    );
  }

  if (!request.bloodUnits || request.bloodUnits.length == 0) {
    throw new ApiError(400, "No blood units reserved for this request");
  }

  request.status = "Ready for Issue";
  request.readyBy = userId;
  request.readyAt = new Date();

  await request.save();

  notifyPatient(
    request.patient,
    "request_ready",
    "Blood Ready for Pickup",
    `Your blood units are prepared and ready for issue. Please visit the hospital.`,
    "Request",
    request._id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Blood units prepared and ready for issue", request),
    );
});

export const completeRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hospitalId = req.user.hospitalId;
  const userId = req.user._id;

  const request = await Request.findOne({
    _id: id,
    hospital: hospitalId,
  })
    .select("status bloodUnits")
    .lean();

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "Ready for Issue") {
    throw new ApiError(
      400,
      `Request cannot be completed when status is '${request.status}'`,
    );
  }

  if (!request.bloodUnits || request.bloodUnits.length == 0) {
    throw new ApiError(400, `No blood units linked to this requests`);
  }

  await BloodStock.updateMany(
    {
      _id: { $in: request.bloodUnits },
      hospital: hospitalId,
      status: { $in: ["Reserved", "Available"] },
    },
    {
      $set: {
        status: "Issued",
      },
    },
  );

  const updatedRequest = await Request.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "Completed",
        completedBy: userId,
        completedAt: new Date(),
      },
    },
    { new: true },
  );

  notifyPatient(
    request.patient,
    "request_completed",
    "Blood Issued Successfully",
    `Your blood request has been completed. Blood units have been issued.`,
    "Request",
    request._id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Blood issued successfully and request completed",
        updatedRequest,
      ),
    );
});

export const getActiveRequest = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  const activeStatuses = [
    "Pending",
    "Approved",
    "Transfer Required",
    "Awaiting Donor",
    "Ready for Issue",
  ];

  const activeRequest = await Request.findOne(
    {
      patient: patientId,
      status: { $in: activeStatuses },
    },
    "bloodGroup componentType unitsRequired urgency status hospital requiredDate createdAt",
  )
    .populate({
      path: "hospital",
      select: "name address.city address.state",
    })
    .lean();

  if (!activeRequest) {
    return res
      .status(200)
      .json(new ApiResponse(200, "No active request found", null));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Active request found", activeRequest));
});

export const getAllRequests = asyncHandler(async (req, res) => {
  const {
    status,
    urgency,
    bloodGroup,
    hospital,
    search,
    page = 1,
    limit = 10,
    sortBy,
    sortOrder,
  } = req.query;

  const filter = {};

  if (status) filter.status = status;
  if (urgency) filter.urgency = urgency;
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (hospital) filter.hospital = hospital;

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const [patientIds, hospitalIds] = await Promise.all([
      mongoose.model("User").find({ name: { $regex: escapedSearch, $options: "i" } }).distinct("_id"),
      mongoose.model("Hospital").find({ name: { $regex: escapedSearch, $options: "i" } }).distinct("_id")
    ]);
    filter.$or = [
      { patient: { $in: patientIds } },
      { hospital: { $in: hospitalIds } }
    ];
  }

  const skip = (page - 1) * limit;

  const aggregatePipeline = [
    { $match: filter },
    {
      $addFields: {
        sortPriority: {
          $cond: {
            if: { $eq: ["$status", "Pending"] },
            then: {
              $cond: { if: { $eq: ["$urgency", "Emergency"] }, then: 1, else: 2 },
            },
            else: {
              $cond: { if: { $eq: ["$urgency", "Emergency"] }, then: 3, else: 4 },
            },
          },
        },
      },
    },
    { $sort: { sortPriority: 1, createdAt: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
  ];

  const [requests, total] = await Promise.all([
    Request.aggregate(aggregatePipeline).then((results) =>
      Request.populate(results, [
        { path: "patient", select: "name email phone" },
        { path: "hospital", select: "name address.city address.state" },
      ]),
    ),
    Request.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Requests fetched successfully", {
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }),
  );
});

export const foreceApproveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;

  const request = await Request.findById(id).populate("hospital", "name");

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (!["Pending", "Awaiting Donor"].includes(request.status)) {
    throw new ApiError(
      400,
      `Request cannot be approved when status is '${request.status}'`,
    );
  }

  const result = await handleStockAllocation(request, adminId, request.hospital._id);

  return res.status(200).json(new ApiResponse(200, result.message, request));
});

export const getRequestStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const matchStage = {};
  if (req.user.role === "hospital") {
    matchStage.hospital = new mongoose.Types.ObjectId(req.user.hospitalId);
  }

  const stats = await Request.aggregate([
    { $match: matchStage },
    {
      $facet: {
        totalRequests: [{ $count: "count" }],

        statusStats: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],

        urgencyStats: [
          {
            $group: {
              _id: "$urgency",
              count: { $sum: 1 },
            },
          },
        ],

        todayRequests: [
          {
            $match: { createdAt: { $gte: startOfToday } },
          },
          { $count: "count" },
        ],

        monthlyRequests: [
          {
            $match: { createdAt: { $gte: startOfMonth } },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  const result = stats[0];

  const response = {
    totalRequests: result.totalRequests[0]?.count || 0,
    todayRequests: result.todayRequests[0]?.count || 0,
    monthlyRequests: result.monthlyRequests[0]?.count || 0,
    statusStats: result.statusStats,
    urgencyStats: result.urgencyStats,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, "Request stats fetched successfully", response));
});

export const handleStockAllocation = async (request, userId, hospitalId) => {
  const now = new Date();
  const reservedIds = [];

  try {
    const localStock = await BloodStock.find({
      hospital: hospitalId,
      bloodGroup: request.bloodGroup,
      componentType: request.componentType,
      status: "Available",
      expiryDate: { $gt: now },
    })
      .sort({ expiryDate: 1 })
      .limit(request.unitsRequired)
      .select("_id")
      .lean();

    if (localStock.length >= request.unitsRequired) {
      for (const stockUnit of localStock) {
        const reserved = await BloodStock.findOneAndUpdate(
          {
            _id: stockUnit._id,
            status: "Available",
            expiryDate: { $gt: now },
          },
          {
            $set: {
              status: "Reserved",
              request: request._id,
            },
          },
          { new: true }
        );
        if (reserved) {
          reservedIds.push(reserved._id);
        }
      }

      if (reservedIds.length === request.unitsRequired) {
        request.status = "Approved";
        request.bloodUnits = reservedIds;
        request.approvedBy = userId;
        request.approvalDate = now;
        await request.save();

        notifyPatient(
          request.patient,
          "request_approved",
          "Blood Request Approved",
          `Your blood request for ${request.unitsRequired} unit(s) of ${request.bloodGroup} ${request.componentType} has been approved and reserved.`,
          "Request",
          request._id
        );

        notifyAdmin(
          "request_approved",
          "Blood Request Approved",
          `A blood request for ${request.unitsRequired} unit(s) of ${request.bloodGroup} ${request.componentType} has been approved and reserved by hospital.`,
          "Request",
          request._id
        );

        return { success: true, message: "Request approved and blood reserved", status: "Approved" };
      } else {
        if (reservedIds.length > 0) {
          await BloodStock.updateMany(
            { _id: { $in: reservedIds } },
            { $set: { status: "Available" }, $unset: { request: "" } }
          );
          reservedIds.length = 0;
        }
      }
    }

    const otherStock = await BloodStock.find({
      hospital: { $ne: hospitalId },
      bloodGroup: request.bloodGroup,
      componentType: request.componentType,
      status: "Available",
      expiryDate: { $gt: now },
    })
      .sort({ expiryDate: 1 })
      .limit(request.unitsRequired)
      .select("_id hospital")
      .lean();

    if (otherStock.length >= request.unitsRequired) {
      const sourceHospitalId = otherStock[0].hospital;
      const filteredOtherStock = otherStock.filter(s => String(s.hospital) === String(sourceHospitalId));

      if (filteredOtherStock.length >= request.unitsRequired) {
        for (const stockUnit of filteredOtherStock) {
          const reserved = await BloodStock.findOneAndUpdate(
            {
              _id: stockUnit._id,
              status: "Available",
              expiryDate: { $gt: now },
            },
            {
              $set: {
                status: "Reserved",
                request: request._id,
              },
            },
            { new: true }
          );
          if (reserved) {
            reservedIds.push(reserved._id);
          }
          if (reservedIds.length === request.unitsRequired) break;
        }

        if (reservedIds.length === request.unitsRequired) {
          const isEmergency = request.urgency === "Emergency";

          const transfer = await Transfer.create({
            fromHospital: sourceHospitalId,
            toHospital: hospitalId,
            bloodUnits: reservedIds,
            request: request._id,
            status: isEmergency ? "Approved" : "Pending Approval",
            priority: isEmergency ? "Emergency" : "Normal"
          });

          request.status = "Transfer Required";
          request.transfer = transfer._id;
          request.approvedBy = userId;
          request.approvalDate = now;
          await request.save();

          if (isEmergency) {
            emitEmergencyAlert("emergency_transfer_created", {
              transferId: transfer._id,
              fromHospital: sourceHospitalId,
              toHospital: hospitalId,
              bloodGroup: request.bloodGroup,
              units: request.unitsRequired,
              urgency: "Emergency"
            });
          }

          notifyPatient(
            request.patient,
            "transfer_created",
            "Transfer Initiated",
            `Your blood request requires a transfer from another hospital. We are working on it.`,
            "Request",
            request._id
          );

          notifyAdmin(
            "transfer_created",
            "Blood Transfer Required",
            `A blood request for ${request.unitsRequired} unit(s) of ${request.bloodGroup} ${request.componentType} requires a transfer from another hospital.`,
            "Request",
            request._id
          );

          notifyHospital(
            sourceHospitalId,
            "transfer_created",
            "Transfer Request Received",
            `A transfer request for ${request.unitsRequired} unit(s) of ${request.bloodGroup} ${request.componentType} has been received.`,
            "Transfer",
            transfer._id
          ).catch(() => { });

          return { success: true, message: "Transfer request created", status: "Transfer Required", transferId: transfer._id };
        } else {
          if (reservedIds.length > 0) {
            await BloodStock.updateMany(
              { _id: { $in: reservedIds } },
              { $set: { status: "Available" }, $unset: { request: "" } }
            );
            reservedIds.length = 0;
          }
        }
      }
    }

    request.status = "Awaiting Donor";
    request.approvedBy = userId;
    request.approvalDate = now;
    await request.save();

    if (request.urgency === "Emergency") {
      emitEmergencyAlert("emergency_donor_alert", {
        requestId: request._id,
        bloodGroup: request.bloodGroup,
        units: request.unitsRequired,
        hospital: hospitalId
      });
    }

    const matchedDonorCount = await notifyDonors(
      request.bloodGroup,
      "donor_alert",
      "Urgent Blood Needed",
      `A patient urgently needs ${request.unitsRequired} unit(s) of ${request.bloodGroup} ${request.componentType}. Please consider donating.`,
      "Request",
      request._id
    );

    if (matchedDonorCount === 0) {
      request.donorSearchFailed = true;
      request.emergencyEscalatedAt = now;
      await request.save();

      await notifyEscalation(request, hospitalId);

      return {
        success: true,
        message: `No eligible ${request.bloodGroup} donors exist for request #${request._id.toString().slice(-6).toUpperCase()}`,
        status: "Awaiting Donor",
        donorSearchFailed: true
      };
    } else {
      notifyPatient(
        request.patient,
        "request_awaiting_donor",
        "Awaiting Donor",
        `No stock is currently available for your request. Eligible donors have been alerted.`,
        "Request",
        request._id
      );
    }

    return { success: true, message: "No stock available. Request moved to donor alert stage", status: "Awaiting Donor" };

  } catch (error) {
    if (reservedIds.length > 0) {
      await BloodStock.updateMany(
        { _id: { $in: reservedIds } },
        { $set: { status: "Available" }, $unset: { request: "" } }
      );
    }
    throw error;
  }
};
