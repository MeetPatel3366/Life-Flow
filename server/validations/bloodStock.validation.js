import { z } from "zod";
import mongoose from "mongoose";

const createBloodStockSchema = {
  body: z.object({
    donationId: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid Donation ObjectId",
      ),
    componentType: z
      .enum(["Whole Blood", "RBC", "Plasma", "Platelets"])
      .default("Whole Blood"),
    quantity: z.coerce.number().min(1).default(1),
    expiryDate: z.coerce.date().optional(),
    notes: z.string().trim().max(500).optional(),
  }),
};

const getBloodStockSchema = {
  query: z.object({
    bloodGroup: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .optional(),
    componentType: z
      .enum(["Whole Blood", "RBC", "Plasma", "Platelets"])
      .optional(),
    status: z
      .enum([
        "Available",
        "Reserved",
        "In Transit",
        "Issued",
        "Expired",
        "Discarded",
        "Processed",
      ])
      .optional(),
    hospitalId: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid Donation ObjectId",
      )
      .optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    sortBy: z.enum(["expiryDate", "createdAt"]).default("expiryDate"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
};

const getBloodStockByIdSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid Blood Stock ObjectId",
      ),
  }),
};

const getHospitalBloodStockSchema = z.object({
  params: z.object({
    hospitalId: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid Hospital ObjectId",
      ),
  }),

  query: z.object({
    bloodGroup: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .optional(),

    componentType: z
      .enum(["Whole Blood", "RBC", "Plasma", "Platelets"])
      .optional(),

    status: z
      .enum([
        "Available",
        "Reserved",
        "In Transit",
        "Issued",
        "Expired",
        "Discarded",
        "Processed",
      ])
      .optional(),

    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),

    sortBy: z.enum(["expiryDate", "createdAt"]).default("expiryDate"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

const updateBloodStockStatusSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid blood stock ObjectId",
      ),
  }),

  body: z.object({
    status: z.enum([
      "Available",
      "Reserved",
      "In Transit",
      "Issued",
      "Expired",
      "Discarded",
      "Processed",
    ]),
    notes: z.string().trim().max(500).optional(),
  }),
};

export {
  createBloodStockSchema,
  getBloodStockSchema,
  getBloodStockByIdSchema,
  getHospitalBloodStockSchema,
  updateBloodStockStatusSchema,
};
