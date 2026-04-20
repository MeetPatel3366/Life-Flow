import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getNotificationsSchema,
  markAsReadSchema,
} from "../validations/notification.validation.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get(
  "/",
  verifyJWT,
  validate(getNotificationsSchema),
  getNotifications,
);

router.patch(
  "/read-all",
  verifyJWT,
  markAllAsRead,
);

router.patch(
  "/:id/read",
  verifyJWT,
  validate(markAsReadSchema),
  markAsRead,
);

export default router;
