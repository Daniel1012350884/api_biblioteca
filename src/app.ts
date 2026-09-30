import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import v1Routes from "./api/v1/index";
import { notFound, errorHandler } from "./shared/middlewares/errorHandler";

export const app = express();

app.use(express.json());
app.use(cors());
app.use(compression());
app.use(helmet());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/v1", v1Routes);

app.use(notFound);
app.use(errorHandler);
