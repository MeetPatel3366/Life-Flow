import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  cancelDonationSchema,
  completeDonationSchema,
  createDonationSchema,
  getDonationByIdSchema,
  getMyDonationSchema,
  hospitalDonationQuerySchema,
  screeningDonationSchema,
} from "../validations/donation.validation.js";
import {
  cancelDonation,
  completeDonation,
  createDonation,
  getDonationById,
  getHospitalDonations,
  getMyDonations,
  updateScreening,
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
  "/",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(hospitalDonationQuerySchema),
  getHospitalDonations,
);

router.get(
  "/my",
  verifyJWT,
  authorizeRoles("donor"),
  validate(getMyDonationSchema),
  getMyDonations,
);

router.get(
  "/:id",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(getDonationByIdSchema),
  getDonationById,
);

router.patch(
  "/:id/cancel",
  verifyJWT,
  authorizeRoles("donor"),
  validate(cancelDonationSchema),
  cancelDonation,
);

router.patch(
  "/:id/screening",
  verifyJWT,
  validate(screeningDonationSchema),
  updateScreening,
);

router.patch(
  "/:id/complete",
  verifyJWT,
  validate(completeDonationSchema),
  completeDonation,
);

export default router;
