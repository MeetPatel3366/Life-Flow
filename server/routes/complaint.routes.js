import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
  createComplaintSchema,
  getMyComplaintsSchema,
  getComplaintByIdSchema,
  getHospitalComplaintsSchema,
  getAllComplaintsSchema,
  updateComplaintStatusSchema,
  resolveComplaintSchema,
  cancelComplaintSchema,
} from "../validations/complaint.validation.js";
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getHospitalComplaints,
  getAllComplaints,
  updateComplaintStatus,
  resolveComplaint,
  cancelComplaint,
} from "../controllers/complaint.controller.js";

const router = express.Router();

router.post(
  "/",
  verifyJWT,
  authorizeRoles("patient", "donor", "hospital"),
  upload.single("attachment"),
  validate(createComplaintSchema),
  createComplaint,
);

router.get(
  "/my",
  verifyJWT,
  authorizeRoles("patient", "donor", "hospital"),
  validate(getMyComplaintsSchema),
  getMyComplaints,
);

router.get(
  "/all",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getAllComplaintsSchema),
  getAllComplaints,
);

router.get(
  "/hospital",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(getHospitalComplaintsSchema),
  getHospitalComplaints,
);

router.get(
  "/:id",
  verifyJWT,
  authorizeRoles("patient", "donor", "hospital", "admin"),
  validate(getComplaintByIdSchema),
  getComplaintById,
);

router.patch(
  "/:id/status",
  verifyJWT,
  authorizeRoles("admin"),
  validate(updateComplaintStatusSchema),
  updateComplaintStatus,
);

router.patch(
  "/:id/resolve",
  verifyJWT,
  authorizeRoles("admin"),
  validate(resolveComplaintSchema),
  resolveComplaint,
);

router.patch(
  "/:id/cancel",
  verifyJWT,
  authorizeRoles("patient", "donor", "hospital"),
  validate(cancelComplaintSchema),
  cancelComplaint,
);

export default router;
