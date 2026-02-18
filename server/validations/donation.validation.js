import { z } from "zod";
import mongoose from "mongoose";

const createDonationSchema = {
  body: z.object({
    hospitalId: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid hospital id",
      ),

    scheduledDate: z.coerce
      .date()
      .min(new Date(), "Scheduled date must be in the future"),
  }),
};

const getMyDonationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50, "Limit cannot exceed 50")
      .default(10),
    status: z
      .enum(["Scheduled", "Screening", "Completed", "Deferred", "Cancelled"])
      .optional(),
  }),
});

const cancelDonationSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid donation id",
      ),
  }),
});

const hospitalDonationQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(["Scheduled", "Screening", "Completed", "Deferred", "Cancelled"])
      .optional(),
    fromDate: z.iso.datetime({ message: "Invalid ISO datetime" }).optional(),
    toDate: z.iso.datetime({ message: "Invalid ISO datetime" }).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50, "Limit cannot exceed 50")
      .default(10),
  }),
});

const getDonationByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid donation id",
      ),
  }),
});

export {
  createDonationSchema,
  getMyDonationSchema,
  cancelDonationSchema,
  hospitalDonationQuerySchema,
  getDonationByIdSchema,
};
