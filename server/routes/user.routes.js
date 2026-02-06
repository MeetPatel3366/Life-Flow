import express from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  verifyOtpSchema,
} from "../validations/user.validation.js";
import { register, verifyOtp } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", validate({ body: registerSchema }), register);

router.post("/verify-otp", validate({ body: verifyOtpSchema }), verifyOtp);

export default router;
