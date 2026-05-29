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

router.post("/", validate(createContactSchema), createContact);

router.get(
  "/all",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getAllContactsSchema),
  getAllContacts,
);

router.get(
  "/:id",
  verifyJWT,
  authorizeRoles("admin"),
  validate(getContactByIdSchema),
  getContactById,
);

router.post(
  "/:id/reply",
  verifyJWT,
  authorizeRoles("admin"),
  validate(replyContactSchema),
  replyToContact,
);

export default router;
