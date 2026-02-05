import { ApiError } from "../utils/ApiError";

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

import { ApiError } from "../utils/ApiError.js";

export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    error = new ApiError(
      error.statusCode || 500,
      error.message || "Internal Server Error",
      [],
      error.stack,
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.error(error.stack);
  }

  res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    errors: error.errors,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};
