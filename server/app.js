import express from "express";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import { errorMiddleware, notFound } from "./middlewares/error.middleware.js";
import userRoutes from "./routes/user.routes.js";
import hospitalRoutes from "./routes/hospital.routes.js";
import donationRoutes from "./routes/donation.routes.js";
import bloodStockRoutes from "./routes/bloodStock.routes.js";
import requestRoutes from "./routes/request.routes.js";
import transferRoutes from "./routes/transfer.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import morgan from "morgan";

config();
const app = express();

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/hospital", hospitalRoutes);
app.use("/api/v1/donation", donationRoutes);
app.use("/api/v1/bloodstock", bloodStockRoutes);
app.use("/api/v1/request", requestRoutes);
app.use("/api/v1/transfer", transferRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/contact", contactRoutes);

app.use(notFound);

app.use(errorMiddleware);

export default app;
