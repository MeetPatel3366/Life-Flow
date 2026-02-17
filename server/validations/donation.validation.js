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

export {
  createDonationSchema,
};
