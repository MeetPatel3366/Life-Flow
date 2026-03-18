import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createRequestSchema } from "../validations/request.validation.js";
import { createRequest } from "../controllers/request.controller.js";

const router = express.Router();

router.post(
  "/",
  verifyJWT,
  authorizeRoles("patient"),
  validate(createRequestSchema),
  createRequest,
);

export default router;
