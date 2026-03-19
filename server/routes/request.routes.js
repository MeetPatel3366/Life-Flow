import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createRequestSchema,
  getMyRequestsSchema,
  getRequestByIdSchema,
} from "../validations/request.validation.js";
import {
  createRequest,
  getMyRequestById,
  getMyRequests,
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
  "/my",
  verifyJWT,
  authorizeRoles("patient"),
  validate(getMyRequestsSchema),
  getMyRequests,
);

router.get(
  "/:id/my",
  verifyJWT,
  authorizeRoles("patient"),
  validate(getRequestByIdSchema),
  getMyRequestById,
);

export default router;
