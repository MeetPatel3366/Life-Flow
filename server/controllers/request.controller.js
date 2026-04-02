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

  const { status, urgency, bloodGroup, page, limit, sortBy, sortOrder } =
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

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [requests, totalCount] = await Promise.all([
    Request.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("patient", "name email phone")
      .lean(),

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

  const request = await Request.findOne({
    _id: id,
    hospital: hospitalId,
  })
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
      select: "status fromHospital toHospital dispatchDate deliveryDate",
    })
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
  });

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "Pending") {
    throw new ApiError(
      400,
      `Request cannot be approved when status is '${request.status}'`,
    );
  }

  const now = new Date();

  //case 1: check stock in same hospital

  const localStock = await BloodStock.find({
    hospital: hospitalId,
    bloodGroup: request.bloodGroup,
    componentType: request.componentType,
    status: "Available",
    expiryDate: { $gt: now },
  })
    .sort({ expiryDate: 1 })
    .limit(request.unitsRequired)
    .lean();

  if (localStock.length >= request.unitsRequired) {
    const stockIds = localStock.map((s) => s._id);

    await BloodStock.updateMany(
      { _id: { $in: stockIds } },
      {
        $set: {
          status: "Reserved",
          request: request._id,
        },
      },
    );

    request.status = "Approved";
    request.bloodUnits = stockIds;
    request.approvedBy = userId;
    request.approvalDate = now;

    await request.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Request approved and blood reserved", request),
      );
  }

  //case 2 : check stock in other hospitals

  const otherStock = await BloodStock.find({
    hospital: { $ne: hospitalId },
    bloodGroup: request.bloodGroup,
    componentType: request.componentType,
    status: "Available",
    expiryDate: { $gt: now },
  })
    .limit(request.unitsRequired)
    .lean();

  if (otherStock.length >= request.unitsRequired) {
    const stockIds = otherStock
      .slice(0, request.unitsRequired)
      .map((s) => s._id);

    const transfer = await Transfer.create({
      fromHospital: otherStock[0].hospital,
      toHospital: hospitalId,
      bloodUnits: stockIds,
      request: request._id,
      status: "Pending Approval",
    });

    request.status = "Transfer Required";
    request.transfer = transfer._id;
    request.approvedBy = userId;
    request.approvalDate = now;

    await request.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Stock unavailable locally. Transfer request created",
        ),
      );
  }

  //case 3: no stock anywhere
  request.status = "Awaiting Donor";
  request.approvedBy = userId;
  request.approvalDate = now;

  await request.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "No stock avavilable. Request moved to donor aleret stage",
      ),
    );
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

  if (request.status !== "Pending") {
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
      status: "Reserved",
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

  const skip = (page - 1) * limit;

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [requests, total] = await Promise.all([
    Request.find(
      filter,
      "patient hospital bloodGroup componentType unitsRequired urgency status requiredDate createdAt",
    )
      .populate({
        path: "patient",
        select: "name email phone",
      })
      .populate({
        path: "hospital",
        select: "name address.city address.state",
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

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

  const request = await Request.findById(
    id,
    "hospital bloodGroup componentType unitsRequired status",
  );

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "Pending") {
    throw new ApiError(
      400,
      `Request cannot be approved when status is '${request.status}'`,
    );
  }

  const now = new Date();

  const hospitalId = request.hospital;

  //case 1: same hospital stock
  const localStock = await BloodStock.find(
    {
      hospital: hospitalId,
      bloodGroup: request.bloodGroup,
      componentType: request.componentType,
      status: "Available",
      expiryDate: { $gt: now },
    },
    "_id",
  )
    .sort({ expiryDate: 1 })
    .limit(request.unitsRequired)
    .lean();

  if (localStock.length >= request.unitsRequired) {
    const stockIds = localStock.map((s) => s._id);

    await BloodStock.updateMany(
      { _id: { $in: stockIds } },
      {
        $set: {
          status: "Reserved",
          request: request._id,
        },
      },
    );

    request.status = "Approved";
    request.bloodUnits = stockIds;
    request.approvedBy = adminId;
    request.approvalDate = now;

    await request.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Request force-approved using hospital stock"),
      );
  }

  //case 2: stock in other hospitals

  const otherStock = await BloodStock.find(
    {
      hospital: hospitalId,
      bloodGroup: request.bloodGroup,
      componentType: request.componentType,
      status: "Available",
      expiryDate: { $gt: now },
    },
    "_id hospital",
  )
    .limit(request.unitsRequired)
    .lean();

  if (otherStock.length >= request.unitsRequired) {
    const stockIds = otherStock
      .slice(0, request.unitsRequired)
      .map((s) => s._id);

    const transfer = await Transfer.create({
      fromHospital: otherStock[0].hospital,
      toHospital: hospitalId,
      bloodUnits: stockIds,
      request: request._id,
      status: "Pending Approval",
    });

    request.status = "Transfer Required";
    request.transfer = transfer._id;
    request.approvedBy = adminId;
    request.approvalDate = now;

    await request.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Request force-approved. Transfer created"));
  }

  //case 3: No stock anywhere
  request.status = "Awaiting Donor";
  request.approvedBy = adminId;
  request.approvalDate = now;

  await request.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "No stock available. Donor alert required"));
});

export const getRequestStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = await Request.aggregate([
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
