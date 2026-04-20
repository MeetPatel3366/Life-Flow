import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Notification from "../models/notification.model.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit, type, isRead, sortOrder } = req.query;

  const skip = (page - 1) * limit;

  const filter = { recipient: userId };

  if (type) filter.type = type;
  if (isRead !== undefined) filter.isRead = isRead;

  const [notifications, totalCount, unreadCount] = await Promise.all([
    Notification.find(filter)
      .select("type title message relatedModel relatedId isRead createdAt")
      .sort({ createdAt: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "Notifications fetched successfully", {
      notifications,
      unreadCount,
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

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndUpdate(
    {
      _id: id,
      recipient: userId,
    },
    { $set: { isRead: true } },
    { new: true },
  )
    .select("isRead")
    .lean();

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Notification marked as read", notification),
    );
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "All notifications marked as read", {
        modifiedCount: result.modifiedCount,
      }),
    );
});
