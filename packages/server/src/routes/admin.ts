import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { config } from "../lib/config.ts";
import { db } from "../lib/db.ts";

// Platforma egasi (super-admin) paneli. Bu barcha kompaniyalar bo'ylab umumiy
// statistikani ko'radi (faqat son/holat — hodimlarning screenshot/faolligi EMAS).
export const adminRouter = Router();

const loginSchema = z.object({ email: z.string(), password: z.string() });

adminRouter.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Email yoki parol xato" });
  const email = parsed.data.email.toLowerCase();
  if (email !== config.adminEmail || parsed.data.password !== config.adminPassword) {
    return res.status(401).json({ error: "Email yoki parol xato" });
  }
  const token = jwt.sign({ sub: "platform-admin", role: "super_admin" }, config.jwtSecret, {
    expiresIn: "1d",
  });
  res.json({ token });
});

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Token yo'q" });
  try {
    const decoded = jwt.verify(header.slice(7), config.jwtSecret) as { role?: string };
    if (decoded.role !== "super_admin") return res.status(403).json({ error: "Ruxsat yo'q" });
    next();
  } catch {
    return res.status(401).json({ error: "Token yaroqsiz" });
  }
}

adminRouter.get("/stats", requireSuperAdmin, (_req, res) => {
  const count = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  res.json({
    companies: count("SELECT COUNT(*) AS c FROM companies"),
    employees: count("SELECT COUNT(*) AS c FROM users WHERE role = 'employee'"),
    devices: count("SELECT COUNT(*) AS c FROM devices WHERE revoked = 0"),
    screenshots: count("SELECT COUNT(*) AS c FROM screenshots"),
    samples: count("SELECT COUNT(*) AS c FROM samples"),
  });
});

adminRouter.get("/companies", requireSuperAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT
         c.id,
         c.name,
         c.created_at,
         (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'employee') AS employees,
         (SELECT COUNT(*) FROM devices d WHERE d.company_id = c.id AND d.revoked = 0) AS devices,
         (SELECT MAX(s.created_at) FROM samples s WHERE s.company_id = c.id) AS last_activity
       FROM companies c
       ORDER BY c.created_at DESC`,
    )
    .all();
  res.json({ companies: rows });
});
