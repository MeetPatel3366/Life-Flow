import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  approveHospitalParamsSchema,
  hospitalRegistrationSchema,
  pendingHospitalsQuerySchema,
  rejectHospitalSchema,
} from "../validations/hospital.validation.js";
import {
  approveHospital,
  getPendingHospitals,
  registerHospital,
  rejectHospital,
} from "../controllers/hospital.controller.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post(
  "/register",
  verifyJWT,
  authorizeRoles("hospital"),
  upload.single("licenseDocument"),
  validate({ body: hospitalRegistrationSchema }),
  registerHospital,
);

router.get(
  "/pending",
  verifyJWT,
  authorizeRoles("admin"),
  validate({ query: pendingHospitalsQuerySchema }),
  getPendingHospitals,
);

router.patch(
  "/:id/approve",
  verifyJWT,
  authorizeRoles("admin"),
  validate({ params: approveHospitalParamsSchema }),
  approveHospital,
);

router.patch(
  "/:id/reject",
  verifyJWT,
  authorizeRoles("admin"),
  validate({
    params: rejectHospitalSchema.shape.params,
    body: rejectHospitalSchema.shape.body,
  }),
  rejectHospital,
);

export default router;
