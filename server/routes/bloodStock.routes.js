import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBloodStockSchema,
  getBloodStockSchema,
} from "../validations/bloodStock.validation.js";
import {
  createBloodStock,
  getBloodStock,
} from "../controllers/bloodStock.controller.js";

const router = express.Router();

router.post(
  "/",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(createBloodStockSchema),
  createBloodStock,
);

router.get(
  "/",
  verifyJWT,
  authorizeRoles("hospital", "admin"),
  validate(getBloodStockSchema),
  getBloodStock,
);

export default router;
