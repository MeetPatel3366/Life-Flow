import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { errorMiddleware, notFound } from "./middlewares/error.middleware";

config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(notFound);

app.use(errorMiddleware);

export default app;
