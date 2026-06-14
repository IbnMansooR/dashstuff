import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { db, SCREENSHOT_DIR } from "../lib/db.ts";
import { requireUser, requireManager } from "../lib/auth.ts";
import { decryptBytes } from "../lib/crypto.ts";

export const dashboardRouter = Router();
dashboardRouter.use(requireUser, requireManager);

const INTERVAL_MINUTES = 10;

/** Bo'lak davomiyligini daqiqada hisoblaydi, INTERVAL_MINUTES bilan cheklaydi. */
function sampleMinutes(startedAt: string, endedAt: string): number {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const minutes = ms / 60000;
  if (!isFinite(minutes) || minutes <= 0) return 0;
  return Math.min(minutes, INTERVAL_MINUTES);
}

// Bir kun uchun barcha hodimlar xulosasi. ?date=YYYY-MM-DD
dashboardRouter.get("/summary", (req, res) => {
  const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const employees = db
    .prepare(
      "SELECT id, full_name FROM users WHERE company_id = ? AND role = 'employee' ORDER BY full_name",
    )
    .all(req.user!.companyId) as { id: string; full_name: string }[];

  const summary = employees.map((emp) => {
    const samples = db
      .prepare(
        `SELECT started_at, ended_at, activity_percent, working
         FROM samples WHERE user_id = ? AND started_at >= ? AND started_at <= ?`,
      )
      .all(emp.id, dayStart, dayEnd) as {
      started_at: string;
      ended_at: string;
      activity_percent: number;
      working: number;
    }[];

    let workedMinutes = 0;
    let activitySum = 0;
    let workingCount = 0;
    for (const s of samples) {
      if (s.working) {
        workedMinutes += sampleMinutes(s.started_at, s.ended_at);
        activitySum += s.activity_percent;
        workingCount++;
      }
    }
    const shotCount = (
      db
        .prepare(
          "SELECT COUNT(*) AS c FROM screenshots WHERE user_id = ? AND taken_at >= ? AND taken_at <= ?",
        )
        .get(emp.id, dayStart, dayEnd) as { c: number }
    ).c;

    return {
      employeeId: emp.id,
      fullName: emp.full_name,
      date,
      workedMinutes: Math.round(workedMinutes),
      avgActivityPercent: workingCount ? Math.round(activitySum / workingCount) : 0,
      screenshotCount: shotCount,
    };
  });

  res.json({ date, summary });
});

// Bitta hodimning screenshotlari ro'yxati. ?employeeId=&date=
dashboardRouter.get("/screenshots", (req, res) => {
  const employeeId = String(req.query.employeeId ?? "");
  const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
  const owner = db
    .prepare("SELECT id FROM users WHERE id = ? AND company_id = ?")
    .get(employeeId, req.user!.companyId);
  if (!owner) return res.status(404).json({ error: "Hodim topilmadi" });

  const rows = db
    .prepare(
      `SELECT id, taken_at FROM screenshots
       WHERE user_id = ? AND taken_at >= ? AND taken_at <= ? ORDER BY taken_at`,
    )
    .all(employeeId, `${date}T00:00:00.000Z`, `${date}T23:59:59.999Z`);
  res.json({ screenshots: rows });
});

// Bitta screenshotni deshifr qilib PNG sifatida qaytaradi.
dashboardRouter.get("/screenshots/:id/image", (req, res) => {
  const row = db
    .prepare(
      "SELECT enc_path, iv, auth_tag FROM screenshots WHERE id = ? AND company_id = ?",
    )
    .get(req.params.id, req.user!.companyId) as
    | { enc_path: string; iv: string; auth_tag: string }
    | undefined;
  if (!row) return res.status(404).json({ error: "Topilmadi" });

  try {
    const cipher = fs.readFileSync(path.join(SCREENSHOT_DIR, row.enc_path));
    const png = decryptBytes(cipher, row.iv, row.auth_tag);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  } catch {
    res.status(500).json({ error: "Deshifrlashda xato" });
  }
});

// Oylik maosh hisobi. ?employeeId=&from=YYYY-MM-DD&to=YYYY-MM-DD
dashboardRouter.get("/payroll", (req, res) => {
  const employeeId = String(req.query.employeeId ?? "");
  const from = String(req.query.from ?? "");
  const to = String(req.query.to ?? "");
  if (!from || !to) return res.status(400).json({ error: "from va to sanalari kerak" });

  const emp = db
    .prepare(
      "SELECT id, full_name, hourly_rate, currency FROM users WHERE id = ? AND company_id = ?",
    )
    .get(employeeId, req.user!.companyId) as
    | { id: string; full_name: string; hourly_rate: number; currency: string }
    | undefined;
  if (!emp) return res.status(404).json({ error: "Hodim topilmadi" });

  const samples = db
    .prepare(
      `SELECT started_at, ended_at FROM samples
       WHERE user_id = ? AND working = 1 AND started_at >= ? AND started_at <= ?`,
    )
    .all(emp.id, `${from}T00:00:00.000Z`, `${to}T23:59:59.999Z`) as {
    started_at: string;
    ended_at: string;
  }[];

  let workedMinutes = 0;
  for (const s of samples) workedMinutes += sampleMinutes(s.started_at, s.ended_at);
  const hours = workedMinutes / 60;
  const grossPay = Math.round(hours * emp.hourly_rate);

  res.json({
    employeeId: emp.id,
    fullName: emp.full_name,
    periodStart: from,
    periodEnd: to,
    workedMinutes: Math.round(workedMinutes),
    hourlyRate: emp.hourly_rate,
    grossPay,
    currency: emp.currency,
  });
});
