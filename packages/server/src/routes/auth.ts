import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../lib/db.ts";
import { hashPassword, verifyPassword, signUserToken, requireUser } from "../lib/auth.ts";

export const authRouter = Router();

const registerSchema = z.object({
  companyName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

// Yangi kompaniya + uning egasi (owner) hisobini yaratadi.
authRouter.post("/register-company", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { companyName, fullName, email, password } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "Bu email allaqachon ro'yxatdan o'tgan" });

  const now = new Date().toISOString();
  const companyId = nanoid();
  const userId = nanoid();
  const passwordHash = await hashPassword(password);

  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO companies (id, name, created_at) VALUES (?, ?, ?)").run(
      companyId,
      companyName,
      now,
    );
    db.prepare(
      `INSERT INTO users (id, company_id, email, password_hash, full_name, role, created_at)
       VALUES (?, ?, ?, ?, ?, 'owner', ?)`,
    ).run(userId, companyId, email.toLowerCase(), passwordHash, fullName, now);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const token = signUserToken({ sub: userId, companyId, role: "owner" });
  res.json({
    token,
    user: { id: userId, email: email.toLowerCase(), fullName, role: "owner", companyId },
  });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Email yoki parol xato" });
  const { email, password } = parsed.data;

  const row = db
    .prepare(
      "SELECT id, company_id, email, password_hash, full_name, role FROM users WHERE email = ?",
    )
    .get(email.toLowerCase()) as
    | {
        id: string;
        company_id: string;
        email: string;
        password_hash: string;
        full_name: string;
        role: string;
      }
    | undefined;
  if (!row) return res.status(401).json({ error: "Email yoki parol xato" });

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: "Email yoki parol xato" });

  const token = signUserToken({ sub: row.id, companyId: row.company_id, role: row.role });
  res.json({
    token,
    user: {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      companyId: row.company_id,
    },
  });
});

authRouter.get("/me", requireUser, (req, res) => {
  res.json({ user: req.user });
});
