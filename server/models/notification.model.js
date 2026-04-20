import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "request_approved",
        "request_rejected",
        "request_ready",
        "request_completed",
        "request_awaiting_donor",
        "transfer_created",
        "transfer_update",
        "donor_alert",
        "complaint_update",
        "general",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedModel: {
      type: String,
      enum: ["Request", "Transfer", "Complaint", "Donation"],
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
