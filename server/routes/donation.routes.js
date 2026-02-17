import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  cancelDonationSchema,
  createDonationSchema,
  getMyDonationSchema,
} from "../validations/donation.validation.js";
import {
  cancelDonation,
  createDonation,
  getMyDonations,
} from "../controllers/donation.controller.js";

const router = express.Router();

router.post(
  "/",
  verifyJWT,
  authorizeRoles("donor"),
  validate(createDonationSchema),
  createDonation,
);

router.get(
  "/my",
  verifyJWT,
  authorizeRoles("donor"),
  validate(getMyDonationSchema),
  getMyDonations,
);

router.patch(
  "/:id/cancel",
  verifyJWT,
  authorizeRoles("donor"),
  validate(cancelDonationSchema),
  cancelDonation,
);

export default router;
