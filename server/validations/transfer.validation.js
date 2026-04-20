import { z } from "zod";
import mongoose from "mongoose";
import { tr } from "zod/v4/locales";

const createTransferSchema = z.object({
  body: z.object({
    request: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      error: "Invalid from hospital ObjectId",
    }),

    notes: z.string().trim().max(500).optional(),
  }),
});

const getTransfersSchema = {
  query: z.object({
    type: z.enum(["incoming", "outgoing", "all"]).default("all"),
    status: z
      .enum([
        "Pending Approval",
        "Approved",
        "Dispatched",
        "In Transit",
        "Delivered",
        "Completed",
        "Cancelled",
      ])
      .optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    sortBy: z.enum(["createdAt", "dispatchDate"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const getTransferByIdSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      error: "Invalid transfer ObjectId",
    }),
  }),
});

const approveTransferSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      error: "Invalid transfer ObjectId",
    }),
  }),
});

const dispatchTransferSchema = {
  params: z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      error: "Invalid transfer ObjectId",
    }),
  }),
  body: z.object({
    transportMode: z.enum(["Ambulance", "Courier", "Cold Chain Vehicle"]),
    trackingNumber: z.string().trim().max(100).optional(),
  }),
};

const markDeliveredSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      error: "Invalid transfer ObjectId",
    }),
  }),
});

const completeTransferSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      error: "Invalid transfer ObjectId",
    }),
  }),
});

const cancelTransferSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      error: "Invalid transfer ObjectId",
    }),
  }),
});

const getAllTransfersSchema = {
  query: z.object({
    status: z
      .enum([
        "Pending Approval",
        "Approved",
        "Dispatched",
        "In Transit",
        "Delivered",
        "Completed",
        "Cancelled",
      ])
      .optional(),

    fromHospital: z.string().optional(),
    toHospital: z.string().optional(),

    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),

    sortBy: z
      .enum(["createdAt", "dispatchDate", "deliveryDate"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const getTransferStatsSchema = {
  query: z.object({
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  }),
};

const getTransferByRequestSchema = {
  params: z.object({
    requestId: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid Request ObjectId"
      ),
  }),
};

export {
  createTransferSchema,
  approveTransferSchema,
  getTransfersSchema,
  getTransferByIdSchema,
  dispatchTransferSchema,
  markDeliveredSchema,
  completeTransferSchema,
  cancelTransferSchema,
  getAllTransfersSchema,
  getTransferStatsSchema,
  getTransferByRequestSchema
};
