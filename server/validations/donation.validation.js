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

const screeningDonationSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid donation id",
      ),
  }),
  body: z
    .object({
      hemoglobin: z.number().min(12, "Min 12").max(20, "Max 20"),
      bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Invalid format (e.g., 120/80)"),
      weight: z.number().min(50, "Min 50kg"),
      temperature: z.number().min(36, "Min 36°C").max(38, "Max 38°C"),
      pulse: z.number().min(60, "Min 60 bpm").max(120, "Max 120 bpm"),
      passed: z.boolean(),
      remarks: z.string().trim().optional(),
      deferralReason: z.string().trim().optional(),
    })
    .refine(
      (data) => {
        if (!data.passed && !data.deferralReason) {
          return false;
        }
        return true;
      },
      {
        message: "Deferral reason is required if screening failed",
        path: ["deferralReason"],
      },
    ),
});

const completeDonationSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid donation id",
      ),
  }),
});

const updateLabTestsSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid donation id",
      ),
  }),

  body: z.object({
    hiv: z.enum(["Negative", "Positive"]),
    hepatitisB: z.enum(["Negative", "Positive"]),
    hepatitisC: z.enum(["Negative", "Positive"]),
    malaria: z.enum(["Negative", "Positive"]),
    syphilis: z.enum(["Negative", "Positive"]),
  }),
};

const getHospitalDonationsSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid hospital id",
      ),
  }),

  query: z.object({
    status: z
      .enum(["Scheduled", "Screening", "Completed", "Deferred", "Cancelled"])
      .optional(),

    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),

    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
};

const rescheduleDonationSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid donation id",
      ),
  }),

  body: z.object({
    scheduledDate: z.iso
      .datetime({ error: "Invalid date format" })
      .refine((date) => new Date(date) > new Date(), {
        error: "Scheduled date must be in the future",
      }),
  }),
};

export {
  createDonationSchema,
  getMyDonationSchema,
  cancelDonationSchema,
  hospitalDonationQuerySchema,
  getDonationByIdSchema,
  screeningDonationSchema,
  completeDonationSchema,
  updateLabTestsSchema,
  getHospitalDonationsSchema,
  rescheduleDonationSchema,
};