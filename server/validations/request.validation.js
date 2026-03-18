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

export { createRequestSchema };
