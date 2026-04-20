import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  approveTransferSchema,
  completeTransferSchema,
  createTransferSchema,
  dispatchTransferSchema,
  getAllTransfersSchema,
  getTransferByIdSchema,
  getTransferByRequestSchema,
  getTransfersSchema,
  getTransferStatsSchema,
  markDeliveredSchema,
} from "../validations/transfer.validation.js";
import {
  approveTransfer,
  completeTransfer,
  createTransfer,
  dispatchTransfer,
  getAllTransfers,
  getTransferById,
  getTransferByRequest,
  getTransfers,
  getTransferStats,
  markDelivered,
} from "../controllers/transfer.controller.js";

const router = express.Router();

router.post(
  "/",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(createTransferSchema),
  createTransfer,
);

router.get(
  "/",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(getTransfersSchema),
  getTransfers,
);

router.get(
  "/all",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getAllTransfersSchema),
  getAllTransfers,
);

router.get(
  "/stats",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getTransferStatsSchema),
  getTransferStats,
);

router.get(
  "/:id",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(getTransferByIdSchema),
  getTransferById,
);

router.get(
  "/request/:requestId",
  verifyJWT,
  authorizeRoles("patient"),
  validate(getTransferByRequestSchema),
  getTransferByRequest,
);

router.patch(
  "/:id/approve",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(approveTransferSchema),
  approveTransfer,
);

router.patch(
  "/:id/dispatch",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(dispatchTransferSchema),
  dispatchTransfer,
);

router.patch(
  "/:id/delivered",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(markDeliveredSchema),
  markDelivered,
);

router.patch(
  "/:id/complete",
  verifyJWT,
  authorizeRoles("hospital"),
  validate(completeTransferSchema),
  completeTransfer,
);
export default router;
