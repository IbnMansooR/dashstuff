import express from "express";
import cors from "cors";
import { config } from "./lib/config.ts";
import "./lib/db.ts"; // DB sxemasini ishga tushiradi
import { authRouter } from "./routes/auth.ts";
import { employeesRouter } from "./routes/employees.ts";
import { devicesRouter } from "./routes/devices.ts";
import { ingestRouter } from "./routes/ingest.ts";
import { dashboardRouter } from "./routes/dashboard.ts";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
// Screenshotlar base64 bo'lib keladi — limitni oshiramiz.
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "worktrack-server" }));

app.use("/api/auth", authRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/ingest", ingestRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: "Topilmadi" }));

app.listen(config.port, () => {
  console.log(`WorkTrack server: http://localhost:${config.port}`);
});
