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

export { createBloodStockSchema };
