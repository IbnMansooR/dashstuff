import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { config } from "./config.ts";
import { db } from "./db.ts";
import { hashToken } from "./crypto.ts";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

interface JwtPayload {
  sub: string; // user id
  companyId: string;
  role: string;
}

export function signUserToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

// Express so'roviga biriktiriladigan kontekst
export interface AuthedUser {
  id: string;
  companyId: string;
  role: "owner" | "manager" | "employee";
  email: string;
  fullName: string;
}
export interface AuthedDevice {
  id: string;
  userId: string;
  companyId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
      device?: AuthedDevice;
    }
  }
}

/** Foydalanuvchi (boshqaruvchi/hodim) JWT bilan kiradi. */
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token yo'q" });
  }
  try {
    const decoded = jwt.verify(header.slice(7), config.jwtSecret) as JwtPayload;
    const row = db
      .prepare("SELECT id, company_id, role, email, full_name FROM users WHERE id = ?")
      .get(decoded.sub) as
      | { id: string; company_id: string; role: string; email: string; full_name: string }
      | undefined;
    if (!row) return res.status(401).json({ error: "Foydalanuvchi topilmadi" });
    req.user = {
      id: row.id,
      companyId: row.company_id,
      role: row.role as AuthedUser["role"],
      email: row.email,
      fullName: row.full_name,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Token yaroqsiz" });
  }
}

/** Faqat owner/manager kira oladigan yo'llar uchun. */
export function requireManager(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "owner" && req.user?.role !== "manager") {
    return res.status(403).json({ error: "Ruxsat yo'q (faqat boshqaruvchi)" });
  }
  next();
}

/** Agent qurilma tokeni bilan kiradi (foydalanuvchi JWT'si emas). */
export function requireDevice(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Qurilma tokeni yo'q" });
  }
  const tokenHash = hashToken(header.slice(7));
  const row = db
    .prepare("SELECT id, user_id, company_id FROM devices WHERE token_hash = ? AND revoked = 0")
    .get(tokenHash) as
    | { id: string; user_id: string; company_id: string }
    | undefined;
  if (!row) return res.status(401).json({ error: "Qurilma tokeni yaroqsiz" });
  req.device = { id: row.id, userId: row.user_id, companyId: row.company_id };
  next();
}
