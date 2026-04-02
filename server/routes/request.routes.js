import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  approveRequestSchema,
  cancelRequestSchema,
  completeRequestSchema,
  createRequestSchema,
  forceApproveRequestSchema,
  getAllRequestsSchema,
  getHospitalRequestsSchema,
  getMyRequestsSchema,
  getRequestByIdSchema,
  markRequestReadySchema,
  rejectRequestSchema,
} from "../validations/request.validation.js";
import {
  approveRequest,
  cancelRequest,
  completeRequest,
  createRequest,
  foreceApproveRequest,
  getActiveRequest,
  getAllRequests,
  getHospitalRequests,
  getMyRequestById,
  getMyRequests,
  getRequestByIdForHospital,
  getRequestStats,
  markRequestReady,
  rejectRequest,
} from "../controllers/request.controller.js";

const router = express.Router();

router.post(
  "/",
  verifyJWT,
  authorizeRoles("patient"),
  validate(createRequestSchema),
  createRequest,
);

router.get(
  "/",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(getHospitalRequestsSchema),
  getHospitalRequests,
);

router.get(
  "/my",
  verifyJWT,
  authorizeRoles("patient"),
  validate(getMyRequestsSchema),
  getMyRequests,
);

router.get("/active", verifyJWT, authorizeRoles("patient"), getActiveRequest);

router.get(
  "/all",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getAllRequestsSchema),
  getAllRequests,
);

router.get("/stats", verifyJWT, authorizeRoles("admin"), getRequestStats);

router.get(
  "/:id/my",
  verifyJWT,
  authorizeRoles("patient"),
  validate(getRequestByIdSchema),
  getMyRequestById,
);

router.get(
  "/:id",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(getRequestByIdSchema),
  getRequestByIdForHospital,
);

router.patch(
  "/:id/cancel",
  verifyJWT,
  authorizeRoles("patient"),
  validate(cancelRequestSchema),
  cancelRequest,
);

router.patch(
  "/:id/approve",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(approveRequestSchema),
  approveRequest,
);

router.patch(
  "/:id/reject",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(rejectRequestSchema),
  rejectRequest,
);

router.patch(
  "/:id/ready",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(markRequestReadySchema),
  markRequestReady,
);

router.patch(
  "/:id/complete",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(completeRequestSchema),
  completeRequest,
);

router.patch(
  "/:id/force-approve",
  verifyJWT,
  authorizeRoles("admin"),
  validate(forceApproveRequestSchema),
  foreceApproveRequest,
);

export default router;
