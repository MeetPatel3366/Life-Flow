import express from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  resendOtpSchema,
  verifyOtpSchema,
} from "../validations/user.validation.js";
import {
  register,
  resendOtp,
  verifyOtp,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", validate({ body: registerSchema }), register);

router.post("/verify-otp", validate({ body: verifyOtpSchema }), verifyOtp);

router.post("/resend-otp", validate({ body: resendOtpSchema }), resendOtp);

export default router;
