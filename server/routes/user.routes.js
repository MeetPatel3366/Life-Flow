import express from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resendOtpSchema,
  updateProfileDetailsSchema,
  verifyOtpSchema,
} from "../validations/user.validation.js";
import {
  changeCurrentPassword,
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
  resendOtp,
  updateProfileDetails,
  updateProfileImage,
  verifyOtp,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/register", validate({ body: registerSchema }), register);

router.post("/verify-otp", validate({ body: verifyOtpSchema }), verifyOtp);

router.post("/resend-otp", validate({ body: resendOtpSchema }), resendOtp);

router.post("/login", validate({ body: loginSchema }), login);

router.post("/logout", verifyJWT, logout);

router.post("/refresh-token", refreshAccessToken);

router.get("/me", verifyJWT, getCurrentUser);

router.patch(
  "/profile",
  verifyJWT,
  validate({ body: updateProfileDetailsSchema }),
  updateProfileDetails,
);

router.patch(
  "/profile-image",
  verifyJWT,
  upload.single("profileImage"),
  updateProfileImage,
);

router.patch(
  "/change-password",
  verifyJWT,
  validate({ body: changePasswordSchema }),
  changeCurrentPassword,
);

export default router;
