import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createLogger } from "../api/_config.js";
import apiRouter from "./apiMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const log = createLogger({ runtime: "dev-server" });

app.use((req, res, next) => {
  req.requestId = String(req.headers["x-request-id"] || "").slice(0, 64) || Math.random().toString(36).slice(2, 12);
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use(cors({ origin: "http://localhost:3000", credentials: false }));
app.use(express.json({ limit: "64kb" }));

// Consolidated API routes - single function for all endpoints
app.use("/", apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Unknown endpoint." });
});

app.listen(PORT, () => {
  log.info("dev api server listening", { port: PORT });
});
