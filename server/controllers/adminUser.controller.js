import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import Hospital from "../models/hospital.model.js";
import Donation from "../models/donation.model.js";
import Request from "../models/request.model.js";
import { ApiError } from "../utils/ApiError.js";

export const getAllUsersAnalyzed = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 10, search, bloodGroup, eligibilityStatus, verificationStatus } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  const matchStage = { role };
  if (search) {
    matchStage.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (bloodGroup && (role === "donor" || role === "patient")) {
    matchStage.bloodGroup = bloodGroup;
  }

  if (eligibilityStatus && role === "donor") {
    matchStage.eligibilityStatus = eligibilityStatus;
  }

  let pipeline = [{ $match: matchStage }];

  if (role === "hospital") {
    pipeline.push(
      {
        $lookup: {
          from: "hospitals",
          localField: "hospitalId",
          foreignField: "_id",
          as: "hospitalDetails",
        },
      },
      {
        $unwind: {
          path: "$hospitalDetails",
          preserveNullAndEmptyArrays: true,
        },
      }
    );

    if (verificationStatus) {
      pipeline.push({
        $match: { "hospitalDetails.verificationStatus": verificationStatus },
      });
    }
  }

  if (role === "donor") {
    pipeline.push(
      {
        $lookup: {
          from: "donations",
          let: { donorId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$donor", "$$donorId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "hospitals",
                localField: "hospital",
                foreignField: "_id",
                as: "hospitalInfo",
              },
            },
            { $unwind: { path: "$hospitalInfo", preserveNullAndEmptyArrays: true } },
          ],
          as: "latestDonation",
        },
      },
      {
        $addFields: {
          lastDonationRecord: { $arrayElemAt: ["$latestDonation", 0] },
        },
      },
      {
        $project: {
          latestDonation: 0,
        },
      }
    );
  }

  if (role === "patient") {
    pipeline.push(
      {
        $lookup: {
          from: "requests",
          let: { patientId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$patient", "$$patientId"] } } },
            {
              $lookup: {
                from: "hospitals",
                localField: "hospital",
                foreignField: "_id",
                as: "hospitalInfo",
              },
            },
            { $unwind: { path: "$hospitalInfo", preserveNullAndEmptyArrays: true } },
          ],
          as: "patientRequests",
        },
      },
      {
        $addFields: {
          totalUnitsRequired: { $sum: "$patientRequests.unitsRequired" },
          requestedHospitals: {
            $reduce: {
              input: "$patientRequests.hospitalInfo.name",
              initialValue: [],
              in: {
                $cond: [
                  { $in: ["$$this", "$$value"] },
                  "$$value",
                  { $concatArrays: ["$$value", ["$$this"]] },
                ],
              },
            },
          },
          requestStatuses: {
            $reduce: {
              input: "$patientRequests.status",
              initialValue: [],
              in: {
                $concatArrays: ["$$value", ["$$this"]],
              },
            },
          },
        },
      },
      {
        $project: {
          patientRequests: 0, 
        },
      }
    );
  }

  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limitInt }],
    },
  });

  const results = await User.aggregate(pipeline);

  const totalCount = results[0].metadata[0]?.total || 0;
  const users = results[0].data;
  const totalPages = Math.ceil(totalCount / limitInt);

  return res.status(200).json(
    new ApiResponse(200, "Users fetched successfully", {
      users,
      pagination: {
        totalCount,
        totalPages,
        currentPage: parseInt(page),
        limit: limitInt,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    })
  );
});

export const getUserAnalyzedById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password -refreshToken").lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const responseData = { ...user };

  if (user.role === "hospital" && user.hospitalId) {
    responseData.hospitalDetails = await Hospital.findById(user.hospitalId).lean();
  } else if (user.role === "donor") {
    responseData.donations = await Donation.find({ donor: id })
      .populate("hospital", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
  } else if (user.role === "patient") {
    responseData.requests = await Request.find({ patient: id })
      .populate("hospital", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
  }

  return res.status(200).json(
    new ApiResponse(200, "User details fetched successfully", responseData)
  );
});