import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createRequestSchema,
  getMyRequestsSchema,
} from "../validations/request.validation.js";
import {
  createRequest,
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

export default router;
