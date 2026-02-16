import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  approveHospitalParamsSchema,
  getHospitalByIdSchema,
  getHospitalsSchema,
  hospitalRegistrationSchema,
  pendingHospitalsQuerySchema,
  rejectHospitalSchema,
} from "../validations/hospital.validation.js";
import {
  approveHospital,
  getHospitalById,
  getHospitals,
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

router.get(
  "/",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getHospitalsSchema),
  getHospitals,
);

router.get(
  "/:id",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getHospitalByIdSchema),
  getHospitalById,
);

export default router;
