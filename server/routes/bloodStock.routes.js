import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBloodStockSchema,
  getBloodStockByIdSchema,
  getBloodStockSchema,
  getHospitalBloodStockSchema,
  updateBloodStockStatusSchema,
} from "../validations/bloodStock.validation.js";
import {
  createBloodStock,
  getBloodStock,
  getBloodStockById,
  getHospitalBloodStock,
  updateBloodStockStatus,
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

router.get(
  "/:id",
  verifyJWT,
  authorizeRoles("hospital", "admin"),
  validate(getBloodStockByIdSchema),
  getBloodStockById,
);

router.get(
  "/hospital/:hospitalId",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getHospitalBloodStockSchema),
  getHospitalBloodStock,
);

router.patch(
  "/:id/status",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(updateBloodStockStatusSchema),
  updateBloodStockStatus,
);

export default router;
