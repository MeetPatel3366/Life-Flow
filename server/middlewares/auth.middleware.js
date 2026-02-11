import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  console.log("decoded token : ", decodedToken);

  const user = await User.findById(decodedToken?.id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account is deactivated");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Email not verified");
  }

  if (user.passwordChangedAt) {
    const passwordChangedTime = parseInt(
      user.passwordChangedAt.getTime() / 1000,
      10,
    );

    if (decodedToken.iat < passwordChangedTime) {
      throw new ApiError(401, "Token expired. Please login again");
    }
  }

  req.user = user;
  next();
});

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required before authorization");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role: ${req.user.role} is not allowed to access this resource`,
      );
    }
    next();
  };
};
