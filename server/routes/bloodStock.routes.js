import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createBloodStockSchema } from "../validations/bloodStock.validation.js";
import { createBloodStock } from "../controllers/bloodStock.controller.js";

const router = express.Router();

router.post(
  "/",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(createBloodStockSchema),
  createBloodStock,
);

export default router;
