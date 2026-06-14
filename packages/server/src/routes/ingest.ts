import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import fs from "node:fs";
import path from "node:path";
import { db, SCREENSHOT_DIR } from "../lib/db.ts";
import { requireDevice } from "../lib/auth.ts";
import { encryptBytes } from "../lib/crypto.ts";

export const ingestRouter = Router();

const reportSchema = z.object({
  sample: z.object({
    startedAt: z.string(),
    endedAt: z.string(),
    keyCount: z.number().int().nonnegative(),
    mouseCount: z.number().int().nonnegative(),
    activityPercent: z.number().int().min(0).max(100),
  }),
  screenshotBase64: z.string().nullable(),
  agentVersion: z.string().default("0.0.0"),
  working: z.boolean().default(true),
});

// Agent qurilma tokeni bilan kiradi va bitta intervalni yuboradi.
ingestRouter.post("/", requireDevice, (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { sample, screenshotBase64, working } = parsed.data;
  const dev = req.device!;
  const now = new Date().toISOString();

  const sampleId = nanoid();
  db.prepare(
    `INSERT INTO samples
      (id, device_id, user_id, company_id, started_at, ended_at, key_count, mouse_count, activity_percent, working, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    sampleId,
    dev.id,
    dev.userId,
    dev.companyId,
    sample.startedAt,
    sample.endedAt,
    sample.keyCount,
    sample.mouseCount,
    sample.activityPercent,
    working ? 1 : 0,
    now,
  );

  if (screenshotBase64) {
    const plain = Buffer.from(screenshotBase64, "base64");
    const { ciphertext, iv, authTag } = encryptBytes(plain);
    const shotId = nanoid();
    const fileName = `${shotId}.enc`;
    fs.writeFileSync(path.join(SCREENSHOT_DIR, fileName), ciphertext);
    db.prepare(
      `INSERT INTO screenshots (id, sample_id, user_id, company_id, taken_at, enc_path, iv, auth_tag, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(shotId, sampleId, dev.userId, dev.companyId, sample.endedAt, fileName, iv, authTag, now);
  }

  db.prepare("UPDATE devices SET last_seen_at = ? WHERE id = ?").run(now, dev.id);
  res.status(201).json({ ok: true, sampleId });
});
