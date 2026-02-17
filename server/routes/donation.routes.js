import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createDonationSchema } from "../validations/donation.validation.js";
import { createDonation } from "../controllers/donation.controller.js";

const router = express.Router();

router.post(
  "/",
  verifyJWT,
  authorizeRoles("donor"),
  validate(createDonationSchema),
  createDonation,
);

export default router;
