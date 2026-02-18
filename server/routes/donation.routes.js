import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  cancelDonationSchema,
  createDonationSchema,
  getDonationByIdSchema,
  getMyDonationSchema,
  hospitalDonationQuerySchema,
} from "../validations/donation.validation.js";
import {
  cancelDonation,
  createDonation,
  getDonationById,
  getHospitalDonations,
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

export default router;
