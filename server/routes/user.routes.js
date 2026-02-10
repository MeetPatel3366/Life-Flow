import express from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  registerSchema,
  resendOtpSchema,
  verifyOtpSchema,
} from "../validations/user.validation.js";
import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
  resendOtp,
  verifyOtp,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", validate({ body: registerSchema }), register);

router.post("/verify-otp", validate({ body: verifyOtpSchema }), verifyOtp);

router.post("/resend-otp", validate({ body: resendOtpSchema }), resendOtp);

router.post("/login", validate({ body: loginSchema }), login);

router.post("/logout", verifyJWT, logout);

router.post("/refresh-token", refreshAccessToken);

router.get("/me", verifyJWT, getCurrentUser);

export default router;
