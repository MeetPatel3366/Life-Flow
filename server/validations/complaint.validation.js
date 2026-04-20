import { z } from "zod";
import mongoose from "mongoose";

const createComplaintSchema = {
  body: z.object({
    hospital: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid hospital id",
      )
      .optional(),
    category: z.enum([
      "Blood Request Issue",
      "Donation Issue",
      "Hospital Staff Behavior",
      "Delay in Service",
      "System Error",
      "Other",
    ]),
    subject: z
      .string()
      .trim()
      .min(5, "Subject must be at least 5 characters")
      .max(200, "Subject cannot exceed 200 characters"),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description cannot exceed 2000 characters"),
  }),
};

const getMyComplaintsSchema = {
  query: z.object({
    status: z
      .enum(["Open", "In Review", "Resolved", "Rejected", "Closed"])
      .optional(),
    category: z
      .enum([
        "Blood Request Issue",
        "Donation Issue",
        "Hospital Staff Behavior",
        "Delay in Service",
        "System Error",
        "Other",
      ])
      .optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    sortBy: z.enum(["createdAt", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const getComplaintByIdSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid complaint ObjectId",
      ),
  }),
};

const getHospitalComplaintsSchema = {
  query: z.object({
    status: z
      .enum(["Open", "In Review", "Resolved", "Rejected", "Closed"])
      .optional(),
    category: z
      .enum([
        "Blood Request Issue",
        "Donation Issue",
        "Hospital Staff Behavior",
        "Delay in Service",
        "System Error",
        "Other",
      ])
      .optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    sortBy: z.enum(["createdAt", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const getAllComplaintsSchema = {
  query: z.object({
    status: z
      .enum(["Open", "In Review", "Resolved", "Rejected", "Closed"])
      .optional(),
    category: z
      .enum([
        "Blood Request Issue",
        "Donation Issue",
        "Hospital Staff Behavior",
        "Delay in Service",
        "System Error",
        "Other",
      ])
      .optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.enum(["createdAt", "status", "category"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const updateComplaintStatusSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid complaint ObjectId",
      ),
  }),
  body: z.object({
    status: z.enum(["In Review"]),
  }),
};

const resolveComplaintSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid complaint ObjectId",
      ),
  }),
  body: z.object({
    status: z.enum(["Resolved", "Rejected", "Closed"]),
    resolutionNote: z
      .string()
      .trim()
      .min(5, "Resolution note must be at least 5 characters")
      .max(1000, "Resolution note cannot exceed 1000 characters"),
  }),
};

const cancelComplaintSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid complaint ObjectId",
      ),
  }),
};

export {
  createComplaintSchema,
  getMyComplaintsSchema,
  getComplaintByIdSchema,
  getHospitalComplaintsSchema,
  getAllComplaintsSchema,
  updateComplaintStatusSchema,
  resolveComplaintSchema,
  cancelComplaintSchema,
};
