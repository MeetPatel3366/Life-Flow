import { z } from "zod";
import mongoose from "mongoose";

const getNotificationsSchema = {
  query: z.object({
    type: z
      .enum([
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
      ])
      .optional(),
    isRead: z
      .enum(["true", "false"])
      .transform((val) => val === "true")
      .optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const markAsReadSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid notification ObjectId",
      ),
  }),
};

export { getNotificationsSchema, markAsReadSchema };
