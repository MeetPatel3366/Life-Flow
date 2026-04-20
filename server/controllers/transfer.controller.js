import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Transfer from "../models/transfer.model.js";
import BloodStock from "../models/bloodStock.model.js";
import Request from "../models/request.model.js";

export const createTransfer = asyncHandler(async (req, res) => {
  const { request: requestId, notes } = req.body;

  const toHospital = req.user.hospitalId;

  if (!toHospital) {
    throw new ApiError(400, "Hospital not linked to user");
  }

  const request = await Request.findById(requestId)
    .select("bloodGroup componentType unitsRequired hospital status")
    .lean();

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  //   if (request.status !== "Transfer Required") {
  //     throw new ApiError(400, "Request is not eligible for transfer");
  //   }

  const now = new Date();

  const stocks = await BloodStock.find({
    hospital: { $ne: toHospital },
    bloodGroup: request.bloodGroup,
    componentType: request.componentType,
    status: "Available",
    expiryDate: { $gt: now },
  })
    .sort({ expiryDate: 1 })
    .limit(request.unitsRequired)
    .select("_id hospital expiryDate")
    .lean();

  if (stocks.length < request.unitsRequired) {
    throw new ApiError(400, "Unsufficient stock in other hospital");
  }

  const fromHospital = stocks[0].hospital;

  const bloodUnits = stocks.slice(0, request.unitsRequired).map((s) => s._id);

  const transfer = await Transfer.create({
    fromHospital,
    toHospital,
    bloodUnits,
    request: requestId,
    notes,
    status: "Pending Approval",
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Transfer request created and sent to source hospital",
        transfer,
      ),
    );
});

export const getTransfers = asyncHandler(async (req, res) => {
  const hospitalId = req.user.hospitalId;

  const { type, status, page, limit, sortBy, sortOrder } = req.query;

  const query = {};

  if (type === "incoming") {
    query.toHospital = hospitalId;
  } else if (type == "outgoing") {
    query.fromHospital = hospitalId;
  } else {
    query.$or = [{ fromHospital: hospitalId }, { toHospital: hospitalId }];
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [transfers, total] = await Promise.all([
    await Transfer.find(query)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "fromHospital toHospital status dispatchDate deliveryDate createdAt",
      )
      .populate("fromHospital", "name")
      .populate("toHospital", "name")
      .lean(),

    Transfer.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Transfer fetched successfully", {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      transfers,
    }),
  );
});

export const getTransferById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hospitalId = req.user.hospitalId;

  if (!hospitalId) {
    throw new ApiError(400, "Hospital not linked to user");
  }

  const transfer = await Transfer.findById(id)
    .populate(
      "fromHospital toHospital request bloodUnits approvedBy",
      "name bloodGroup componentType unitsRequired status name",
    )
    .lean();

  if (!transfer) {
    throw new ApiError(404, "Transfer not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Transfer fetched successfully", transfer));
});

export const approveTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userHospitalId = req.user.hospitalId;
  const userId = req.user._id;

  if (!userHospitalId) {
    throw new ApiError(400, "hospital not linked to user");
  }

  const transfer = await Transfer.findById(id)
    .select("fromHospital toHospital bloodUnits request status")
    .lean();

  if (!transfer) {
    throw new ApiError(404, "Transfer request not found");
  }

  if (String(transfer.fromHospital) !== String(userHospitalId)) {
    throw new ApiError(403, "Only source hospital can approve transfer");
  }

  if (transfer.status !== "Pending Approval") {
    throw new ApiError(
      400,
      "Cannot approve transfer with status '${transfer.status}'",
    );
  }

  const now = new Date();

  const stocks = await BloodStock.find({
    _id: { $in: transfer.bloodUnits },
    hospital: transfer.fromHospital,
    status: "Available",
    expiryDate: { $gt: now },
  })
    .select("_id")
    .lean();

  if (stocks.length !== transfer.bloodUnits.length) {
    throw new ApiError(
      400,
      "Some blood units are no longer available for transfer",
    );
  }

  const updatedTransfer = await Transfer.findOneAndUpdate(
    {
      _id: id,
      status: "Pending Approval",
    },
    {
      $set: {
        status: "Approved",
        approvedBy: userId,
      },
    },
    { new: true },
  ).lean();

  if (!updatedTransfer) {
    throw new ApiError(400, "Transfer approval failed");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Transfer approved successfully", updatedTransfer),
    );
});

export const dispatchTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { transportMode, trackingNumber } = req.body;

  const hospitalId = req.user.hospitalId;

  if (!hospitalId) {
    throw new ApiError(400, "Hospital not linked to user");
  }

  const transfer = await Transfer.findById(id)
    .select("fromHospital toHospital bloodUnits status")
    .lean();

  if (!transfer) {
    throw new ApiError(404, "Transfer request not found");
  }

  if (String(transfer.fromHospital) !== String(hospitalId)) {
    throw new ApiError(403, "Only source hospital can dispatch transfer");
  }

  if (transfer.status !== "Approved") {
    throw new ApiError(
      400,
      `Cannot dispatch transfer with status '${transfer.status}'`,
    );
  }

  const now = new Date();

  const updatedStock = await BloodStock.updateMany(
    {
      _id: { $in: transfer.bloodUnits },
      hospital: transfer.fromHospital,
      status: "Available",
      expiryDate: { $gt: now },
    },
    {
      $set: {
        status: "In Transit",
        transfer: transfer._id,
      },
    },
  );

  if (updatedStock.modifiedCount !== transfer.bloodUnits.length) {
    throw new ApiError(
      400,
      "Some blood units are no longer available for dispatch",
    );
  }

  const updatedTransfer = await Transfer.findOneAndUpdate(
    {
      _id: id,
      status: "Approved",
    },
    {
      $set: {
        status: "Dispatched",
        transportMode,
        trackingNumber,
        dispatchDate: now,
      },
    },
    { new: true },
  ).lean();

  if (!updatedTransfer) {
    throw new ApiError(400, "Transfer dispatch failed");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Transfer dispatched successfully", updatedTransfer),
    );
});

export const markDelivered = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hospitalId = req.user.hospitalId;

  if (!hospitalId) {
    throw new ApiError(400, "Hospital not linked to user");
  }

  const transfer = await Transfer.findById(id)
    .select("fromHospital toHospital bloodUnits status")
    .lean();

  if (!transfer) {
    throw new ApiError(404, "Transfer request not found");
  }

  if (String(transfer.toHospital) !== String(hospitalId)) {
    throw new ApiError(
      403,
      "Only destination hospital can mark transfer as delivered",
    );
  }

  if (transfer.status !== "Dispatched") {
    throw new ApiError(
      400,
      `cannot mark transfer as delivered with status '${transfer.status}'`,
    );
  }

  const now = new Date();

  const updatedTransfer = await Transfer.findOneAndUpdate(
    { _id: id, status: "Dispatched" },
    {
      $set: {
        status: "Delivered",
        deliveryDate: now,
      },
    },
    { new: true },
  )
    .select("fromHospital toHospital bloodUnits status deliveryDate")
    .populate("fromHospital toHospital", "name")
    .lean();

  if (!updatedTransfer) {
    throw new ApiError(400, "Failed to mark transfer as delivered");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Transfer marked as delivered", updatedTransfer),
    );
});

export const completeTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hospitalId = req.user.hospitalId;

  if (!hospitalId) {
    throw new ApiError(400, "Hospital not linked to user");
  }

  const transfer = await Transfer.findById(id)
    .select("fromHospital toHospital bloodUnits status request")
    .lean();

  if (!transfer) {
    throw new ApiError(404, "Transfer request not found");
  }

  if (transfer.status !== "Delivered") {
    throw new ApiError(
      400,
      `Cannot complete transfer with status '${transfer.status}'`,
    );
  }

  const updateStock = await BloodStock.updateMany(
    {
      _id: { $in: transfer.bloodUnits },
      status: "In Transit",
    },
    {
      $set: {
        hospital: hospitalId,
        status: "Available",
        transfer: transfer._id,
      },
    },
  );

  if (updateStock.modifiedCount !== transfer.bloodUnits.length) {
    throw new ApiError(400, "Some blood units are no longer in transit");
  }

  const updateTransfer = await Transfer.findOneAndUpdate(
    {
      _id: id,
      status: "Delivered",
    },
    {
      $set: {
        status: "Completed",
      },
    },
    { new: true },
  ).lean();

  if (!updateTransfer) {
    throw new ApiError(400, "Transfer completion failed");
  }

  if (transfer.request) {
    await Request.findByIdAndUpdate(transfer.request, {
      $set: {
        status: "Ready for Issue",
        bloodUnits: transfer.bloodUnits,
      },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Transfer marked as completed", updateTransfer));
});

export const cancelTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hospitalId = req.user.hospitalId;

  if (!hospitalId) {
    throw new ApiError(400, "Hospital not linked to user");
  }

  const transfer = await Transfer.findById(id)
    .select("fromHospital toHospital request bloodUnits status")
    .lean();

  if (!transfer) {
    throw new ApiError(404, "Transfer request not found");
  }

  const isFrom = String(transfer.fromHospital) === String(hospitalId);
  const isTo = String(transfer.toHospital) === String(hospitalId);

  if (!isFrom && !isTo) {
    throw new ApiError(403, "Not authorized to cancel this transfer");
  }

  const cancellableStatuses = ["Pending Approval", "Approved"];

  if (!cancellableStatuses.includes(transfer.status)) {
    throw new ApiError(
      400,
      `Cannot cancel transfer with status '${transfer.status}'`,
    );
  }

  if (transfer.bloodUnits?.length) {
    await BloodStock.updateMany(
      {
        _id: { $in: transfer.bloodUnits },
        status: "Reserved",
      },
      {
        $set: {
          status: "Available",
          request: null,
          transfer: null,
        },
      },
    );
  }

  const updatedTransfer = await Transfer.findOneAndUpdate(
    {
      _id: id,
      status: { $in: cancellableStatuses },
    },
    {
      $set: {
        status: "Cancelled",
      },
    },
    {
      new: true,
    },
  ).lean();

  if (!updatedTransfer) {
    throw new ApiError(400, "Transfer cancellation failed");
  }

  if (transfer.request) {
    await Request.findByIdAndUpdate(transfer.request, {
      $set: {
        status: "Pending",
        transfer: null,
        bloodUnits: [],
      },
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Transfer cancelled successfully", updatedTransfer),
    );
});

export const getAllTransfers = asyncHandler(async (req, res) => {
  const { status, fromHospital, toHospital, page, limit, sortBy, sortOrder } =
    req.query;

  const filter = {};

  if (status) filter.status = status;
  if (fromHospital) filter.fromHospital = fromHospital;
  if (toHospital) filter.toHospital = toHospital;

  const skip = (page - 1) * limit;

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [transfers, total] = await Promise.all([
    Transfer.find(filter)
      .select(
        "fromHospital toHospital status transportMode trackingNumber dispatchDate deliveryDate createdAt",
      )
      .populate("fromHospital", "name")
      .populate("toHospital", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Transfer.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Transfers fetched successfully", {
      transfers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }),
  );
});

export const getTransferStats = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;

  const matchStage = {};

  if (fromDate || toDate) {
    matchStage.createdAt = {};
    if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
    if (toDate) matchStage.createdAt.$lte = new Date(toDate);
  }

  const stats = await Transfer.aggregate([
    { $match: matchStage },

    {
      $facet: {
        totalTransfers: [{ $count: "count" }],

        statusCounts: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],

        todayTransfers: [
          {
            $match: {
              createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          },
          { $count: "count" },
        ],

        avgDeliveryTime: [
          {
            $match: {
              status: "Completed",
              dispatchDate: { $ne: null },
              deliveryDate: { $ne: null },
            },
          },
          {
            $project: {
              deliveryTime: {
                $subtract: ["$deliveryDate", "$dispatchDate"],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgTime: { $avg: "$deliveryTime" },
            },
          },
        ],

        delayedTransfers: [
          {
            $match: {
              status: { $in: ["Dispatched", "In Transit"] },
              dispatchDate: {
                $lte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  const result = stats[0];

  return res.status(200).json(
    new ApiResponse(200, "Transfer stats fetched successfully", {
      totalTransfers: result.totalTransfers[0]?.count || 0,
      statusCounts: result.statusCounts,
      todayTransfers: result.todayTransfers[0]?.count || 0,
      avgDeliveryTime: result.avgDeliveryTime[0]?.avgTime || 0,
      delayedTransfers: result.delayedTransfers[0]?.count || 0,
    }),
  );
});

export const getTransferByRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const patientId = req.user._id;

  const request = await Request.findOne(
    { _id: requestId, patient: patientId },
    "_id transfer status",
  ).lean();

  if (!request) {
    throw new ApiError(404, "Request not found or unauthorized");
  }

  if (!request.transfer) {
    return res.status(200).json(
      new ApiResponse(200, "No transfer associated with this request", {
        requestStatus: request.status,
        transfer: null,
      }),
    );
  }

  const transfer = await Transfer.findById(
    request.transfer,
    "fromHospital toHospital status transportMode dispatchDate deliveryDate trackingNumber",
  )
    .populate({
      path: "fromHospital",
      select: "name address.city address.state",
    })
    .populate({
      path: "toHospital",
      select: "name address.city address.state",
    })
    .lean();

  if (!transfer) {
    throw new ApiError(404, "Transfer not found");
  }

  return res.status(200).json(
    new ApiResponse(200, "Transfer details fetched successfully", {
      requestStatus: request.status,
      transfer,
    }),
  );
});
