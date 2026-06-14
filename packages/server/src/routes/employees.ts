import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../lib/db.ts";
import { hashPassword, requireUser, requireManager } from "../lib/auth.ts";

export const employeesRouter = Router();
employeesRouter.use(requireUser);

// Hodimlar ro'yxati (faqat o'z kompaniyasidagilar — multi-tenant izolyatsiya).
employeesRouter.get("/", requireManager, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, email, full_name, role, hourly_rate, currency, created_at
       FROM users WHERE company_id = ? AND role = 'employee' ORDER BY full_name`,
    )
    .all(req.user!.companyId);
  res.json({ employees: rows });
});

const createSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  hourlyRate: z.number().nonnegative().default(0),
  currency: z.string().default("UZS"),
});

// Boshqaruvchi yangi hodim hisobini ochadi.
employeesRouter.post("/", requireManager, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { fullName, email, password, hourlyRate, currency } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "Bu email band" });

  const id = nanoid();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  db.prepare(
    `INSERT INTO users (id, company_id, email, password_hash, full_name, role, hourly_rate, currency, created_at)
     VALUES (?, ?, ?, ?, ?, 'employee', ?, ?, ?)`,
  ).run(id, req.user!.companyId, email.toLowerCase(), passwordHash, fullName, hourlyRate, currency, now);

  res.status(201).json({ employee: { id, fullName, email: email.toLowerCase(), hourlyRate, currency } });
});

const updateSchema = z.object({
  hourlyRate: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  fullName: z.string().min(2).optional(),
});

// Soatlik stavka / nomni yangilash.
employeesRouter.patch("/:id", requireManager, (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const target = db
    .prepare("SELECT id FROM users WHERE id = ? AND company_id = ? AND role = 'employee'")
    .get(req.params.id, req.user!.companyId);
  if (!target) return res.status(404).json({ error: "Hodim topilmadi" });

  const { hourlyRate, currency, fullName } = parsed.data;
  if (hourlyRate !== undefined)
    db.prepare("UPDATE users SET hourly_rate = ? WHERE id = ?").run(hourlyRate, req.params.id);
  if (currency !== undefined)
    db.prepare("UPDATE users SET currency = ? WHERE id = ?").run(currency, req.params.id);
  if (fullName !== undefined)
    db.prepare("UPDATE users SET full_name = ? WHERE id = ?").run(fullName, req.params.id);

  res.json({ ok: true });
});
