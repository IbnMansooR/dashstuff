import crypto from "node:crypto";
import { config } from "./config.ts";

const KEY = Buffer.from(config.screenshotKeyHex, "hex");

/** Screenshot baytlarini AES-256-GCM bilan shifrlaydi.
 *  Diskda faqat shifrlangan ma'lumot turadi; IV va authTag DB'da saqlanadi. */
export function encryptBytes(plain: Buffer): {
  ciphertext: Buffer;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptBytes(ciphertext: Buffer, ivHex: string, authTagHex: string): Buffer {
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Qurilma uchun yangi maxfiy token yaratadi (agentga bir marta ko'rsatiladi). */
export function generateDeviceToken(): string {
  return "wt_" + crypto.randomBytes(32).toString("base64url");
}

/** Tokenni DB'da ochiq saqlamaymiz — faqat SHA-256 hashini saqlaymiz. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
