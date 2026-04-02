import { z } from "zod";
import mongoose from "mongoose";

const createRequestSchema = {
  body: z.object({
    hospital: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid hospital id",
      ),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),

    componentType: z.enum(["Whole Blood", "RBC", "Plasma", "Platelets"]),

    unitsRequired: z.coerce.number().min(1, "Minimum 1 unit required"),

    urgency: z
      .enum([
        "Normal", //Planned need
        "Urgent", //Needed soon
        "Emergency", //Accident, ICU bleeding
      ])
      .default("Normal"),

    requiredDate: z.iso.datetime().optional(),

    diagnosis: z.string().trim().optional(),

    notes: z.string().trim().optional(),
  }),
};

const getMyRequestsSchema = {
  query: z.object({
    status: z
      .enum([
        "Pending", // waiting admin review
        "Approved", // approved, stock reserved
        "Rejected", // denied
        "Awaiting Donor", // no stock, donor alert sent
        "Transfer Required", // stock in other center
        "Ready for Issue", // blood prepared
        "Completed", // blood issued
        "Cancelled",
      ])
      .optional(),

    page: z.coerce.number().min(1).default(1),

    limit: z.coerce.number().min(1).max(50).default(10),

    sortBy: z
      .enum(["createdAt", "requiredDate", "urgency"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const getRequestByIdSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid request ObjectId",
      ),
  }),
};

const cancelRequestSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid request ObjectId",
      ),
  }),
};

const getHospitalRequestsSchema = {
  query: z.object({
    status: z
      .enum([
        "Pending", // waiting admin review
        "Approved", // approved, stock reserved
        "Rejected", // denied
        "Awaiting Donor", // no stock, donor alert sent
        "Transfer Required", // stock in other center
        "Ready for Issue", // blood prepared
        "Completed", // blood issued
        "Cancelled",
      ])
      .optional(),

    urgency: z.enum(["Normal", "Urgent", "Emergency"]).optional(),

    bloodGroup: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .optional(),

    page: z.coerce.number().min(1).default(1),

    limit: z.coerce.number().min(1).max(50).default(10),

    sortBy: z
      .enum(["createdAt", "requiredDate", "urgency"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const getHospitalRequestByIdSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid request ObjectId",
      ),
  }),
};

const approveRequestSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid request ID",
      ),
  }),
};

const rejectRequestSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid request id",
      ),
  }),

  body: z.object({
    reason: z
      .string()
      .trim()
      .min(5, "Rejection reason must be at least 5 characters")
      .max(300),
  }),
};

const markRequestReadySchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid request ID",
      ),
  }),
};

const completeRequestSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid request id",
      ),
  }),
};

const getAllRequestsSchema = {
  query: z.object({
    status: z
      .enum([
        "Pending",
        "Approved",
        "Rejected",
        "Awaiting Donor",
        "Transfer Required",
        "Ready for Issue",
        "Completed",
        "Cancelled",
      ])
      .optional(),

    urgency: z.enum(["Normal", "Urgent", "Emergency"]).optional(),

    bloodGroup: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .optional(),

    hospital: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid hospital id",
      )
      .optional(),

    page: z.coerce.number().min(1).default(1),

    limit: z.coerce.number().min(1).max(100).default(20),

    sortBy: z
      .enum(["createdAt", "requiredDate", "urgency"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const forceApproveRequestSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid request ID",
      ),
  }),
};

export {
  createRequestSchema,
  getMyRequestsSchema,
  getRequestByIdSchema,
  cancelRequestSchema,
  getHospitalRequestsSchema,
  getHospitalRequestByIdSchema,
  approveRequestSchema,
  rejectRequestSchema,
  markRequestReadySchema,
  completeRequestSchema,
  getAllRequestsSchema,
  forceApproveRequestSchema,
};
