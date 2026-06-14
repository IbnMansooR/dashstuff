import express from "express";
import cors from "cors";
import os from "node:os";
import { config } from "./lib/config.ts";
import "./lib/db.ts"; // DB sxemasini ishga tushiradi
import { authRouter } from "./routes/auth.ts";
import { employeesRouter } from "./routes/employees.ts";
import { devicesRouter } from "./routes/devices.ts";
import { ingestRouter } from "./routes/ingest.ts";
import { dashboardRouter } from "./routes/dashboard.ts";
import { adminRouter } from "./routes/admin.ts";

const app = express();

// CORS: o'z kompyuterini server qilib ishlatish uchun "*" qo'llab-quvvatlanadi
// (autentifikatsiya baribir JWT/token orqali). Ishlab chiqarishda aniq domen yozing.
app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin }));
// Screenshotlar base64 bo'lib keladi — limitni oshiramiz.
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "feekr-server" }));

app.use("/api/auth", authRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/ingest", ingestRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/admin", adminRouter);

app.use((_req, res) => res.status(404).json({ error: "Topilmadi" }));

// Barcha tarmoq interfeyslarida tinglaydi (0.0.0.0) — boshqa kompyuterlardagi
// agentlar shu PC'ga ulanishi uchun.
app.listen(config.port, () => {
  console.log(`\n  Feekr server ishlayapti:`);
  console.log(`  • Shu kompyuterda:  http://localhost:${config.port}`);
  // LAN IP manzillarini chiqaramiz — hodim agentlariga shu manzilni bering.
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`  • Tarmoqdan (agent uchun):  http://${net.address}:${config.port}`);
      }
    }
  }
  console.log("");
});
