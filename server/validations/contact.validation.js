import { z } from "zod";
import mongoose from "mongoose";

const createContactSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z.email("Invalid email format"),
    message: z
      .string()
      .trim()
      .min(10, "Message must be at least 10 characters")
      .max(2000, "Message cannot exceed 2000 characters"),
  }),
};

const getAllContactsSchema = {
  query: z.object({
    status: z.enum(["Unread", "Read", "Replied"]).optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.enum(["createdAt", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

const getContactByIdSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid contact ObjectId",
      ),
  }),
};

const replyContactSchema = {
  params: z.object({
    id: z
      .string()
      .refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        "Invalid contact ObjectId",
      ),
  }),
  body: z.object({
    reply: z
      .string()
      .trim()
      .min(10, "Reply must be at least 10 characters")
      .max(2000, "Reply cannot exceed 2000 characters"),
  }),
};

export {
  createContactSchema,
  getAllContactsSchema,
  getContactByIdSchema,
  replyContactSchema,
};
