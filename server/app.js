import express from "express";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import { errorMiddleware, notFound } from "./middlewares/error.middleware.js";
import userRoutes from "./routes/user.routes.js";

config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());

app.use("/api/v1/user", userRoutes);

app.use(notFound);

app.use(errorMiddleware);

export default app;
