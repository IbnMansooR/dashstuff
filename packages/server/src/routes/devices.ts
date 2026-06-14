import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../lib/db.ts";
import { requireUser } from "../lib/auth.ts";
import { generateDeviceToken, hashToken } from "../lib/crypto.ts";

export const devicesRouter = Router();
devicesRouter.use(requireUser);

const enrollSchema = z.object({
  name: z.string().default("Mening kompyuterim"),
  os: z.string().default(""),
});

// Hodim o'z hisobidan kompyuterini ro'yxatdan o'tkazadi.
// Token FAQAT shu javobda ko'rsatiladi — keyin DB'da hash bo'lib qoladi.
devicesRouter.post("/enroll", (req, res) => {
  const parsed = enrollSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const token = generateDeviceToken();
  const id = nanoid();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO devices (id, user_id, company_id, token_hash, name, os, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, req.user!.id, req.user!.companyId, hashToken(token), parsed.data.name, parsed.data.os, now);

  res.status(201).json({ deviceId: id, deviceToken: token });
});

// O'z qurilmalari ro'yxati (token ko'rsatilmaydi).
devicesRouter.get("/", (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, os, revoked, last_seen_at, created_at
       FROM devices WHERE user_id = ? ORDER BY created_at DESC`,
    )
    .all(req.user!.id);
  res.json({ devices: rows });
});

// Qurilmani o'chirish (token bekor qilinadi).
devicesRouter.delete("/:id", (req, res) => {
  const result = db
    .prepare("UPDATE devices SET revoked = 1 WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user!.id);
  if (result.changes === 0) return res.status(404).json({ error: "Qurilma topilmadi" });
  res.json({ ok: true });
});
