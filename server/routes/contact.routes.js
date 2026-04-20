import express from "express";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createContactSchema,
  getAllContactsSchema,
  getContactByIdSchema,
  replyContactSchema,
} from "../validations/contact.validation.js";
import {
  createContact,
  getAllContacts,
  getContactById,
  replyToContact,
} from "../controllers/contact.controller.js";

const router = express.Router();

// Public — submit a contact message
router.post("/", validate(createContactSchema), createContact);

// Admin — get all contact messages
router.get(
  "/all",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getAllContactsSchema),
  getAllContacts,
);

// Admin — get single contact message
router.get(
  "/:id",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getContactByIdSchema),
  getContactById,
);

// Admin — reply to a contact message
router.post(
  "/:id/reply",
  verifyJWT,
  authorizeRoles("admin"),
  validate(replyContactSchema),
  replyToContact,
);

export default router;
