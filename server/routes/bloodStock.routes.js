import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBloodStockSchema,
  getAvailableBloodStockSchema,
  getBloodStockByIdSchema,
  getBloodStockSchema,
  getHospitalBloodStockSchema,
  separateComponentsSchema,
  updateBloodStockStatusSchema,
} from "../validations/bloodStock.validation.js";
import {
  createBloodStock,
  getAvailableBloodStock,
  getBloodStock,
  getBloodStockById,
  getHospitalBloodStock,
  separateComponents,
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
  "/available",
  verifyJWT,
  authorizeRoles("hospital", "patient"),
  validate(getAvailableBloodStockSchema),
  getAvailableBloodStock,
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

router.post(
  "/:id/separate-components",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(separateComponentsSchema),
  separateComponents,
);

export default router;
