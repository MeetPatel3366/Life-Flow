import { z } from "zod";
import mongoose from "mongoose";

const hospitalRegistrationSchema = z.object({
  name: z.string().trim().min(3, "Hospital name nust be at least 3 characters"),
  type: z.enum(["Hospital", "Blood Bank"], {
    error: "Hospital type is required",
  }),
  licenseNumber: z
    .string()
    .trim()
    .min(5, "License number must be at least 5 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone must be 10 digits")
    .optional(),
  address: z.object({
    street: z.string().trim().min(3).optional(),
    city: z.string().trim().min(2, "City must be at least 2 characters"),
    state: z.string().trim().min(2, "State must be at least 2 characters"),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Invalid pincode"),
    country: z.string().trim().default("India"),
  }),
  contactPerson: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Contact person name must be at least 3 characters"),
    designation: z.string().trim().min(2, "Designation required"),
  }),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z
      .array(z.coerce.number())
      .length(2, "Coordinates must contain [longitude, latitude]")
      .refine(
        (coords) =>
          coords[0] >= -180 &&
          coords[0] <= 180 &&
          coords[1] >= -90 &&
          coords[1] <= 90,
        "Invalid longitude or latitude",
      ),
  }),
  storageCapacity: z.coerce
    .number()
    .min(0, "Storage capacity cannot be negative")
    .optional(),
  hasComponentSeparation: z.coerce.boolean().optional(),
});

const pendingHospitalsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .optional()
    .default(10),
});

const approveHospitalParamsSchema = z.object({
  id: z
    .string()
    .refine(
      (val) => mongoose.Types.ObjectId.isValid(val),
      "Invalid hospital id",
    ),
});

const rejectHospitalSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid hospital id",
      ),
  }),

  body: z.object({
    rejectionReason: z
      .string()
      .trim()
      .min(10, "Rejection reason must be at least 10 characters")
      .max(500, "Rejection reason cannot exceed 500 characters"),
  }),
});

const getHospitalsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, "Page must be a number")
      .transform(Number)
      .default(1)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a number")
      .transform(Number)
      .refine((val) => val <= 50, "Limit cannot exceed 50")
      .default(10)
      .optional(),
    status: z.enum([["Pending", "Approved", "Rejected"]]).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    sortBy: z
      .enum([["createdAt", "updatedAt", "name"]])
      .default("")
      .optional(),
    order: z.enum(["asc", "desc"]).default("desc").optional(),
  }),
});

const getHospitalByIdSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid hospital id format",
    }),
  }),
});

const updateMyHospitalSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Hospital name nust be at least 3 characters")
      .optional(),
    type: z.enum(["Hospital", "Blood Bank"]).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, "Phone must be 10 digits")
      .optional(),
    address: z
      .object({
        street: z.string().trim().min(3).optional(),
        city: z
          .string()
          .trim()
          .min(2, "City must be at least 2 characters")
          .optional(),
        state: z
          .string()
          .trim()
          .min(2, "State must be at least 2 characters")
          .optional(),
        pincode: z
          .string()
          .trim()
          .regex(/^\d{6}$/, "Invalid pincode")
          .optional(),
        country: z.string().trim().optional(),
      })
      .partial()
      .optional(),
    contactPerson: z
      .object({
        name: z
          .string()
          .trim()
          .min(3, "Contact person name must be at least 3 characters")
          .optional(),
        designation: z
          .string()
          .trim()
          .min(2, "Designation at least 2 characters")
          .optional(),
      })
      .partial()
      .optional(),
    location: z
      .object({
        type: z.literal("Point"),
        coordinates: z
          .array(z.coerce.number())
          .length(2, "Coordinates must contain [longitude, latitude]")
          .refine(
            (coords) =>
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90,
            "Invalid longitude or latitude",
          ),
      })
      .optional(),
    storageCapacity: z.coerce
      .number()
      .min(0, "Storage capacity cannot be negative")
      .optional(),
    hasComponentSeparation: z.coerce.boolean().optional(),
  }),
};

export {
  hospitalRegistrationSchema,
  pendingHospitalsQuerySchema,
  approveHospitalParamsSchema,
  rejectHospitalSchema,
  getHospitalsSchema,
  getHospitalByIdSchema,
  updateMyHospitalSchema,
};
