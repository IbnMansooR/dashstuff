import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Muhit o'zgaruvchisi yo'q: ${name} (.env faylini tekshiring)`);
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required("JWT_SECRET", "dev-insecure-secret-change-me"),
  screenshotKeyHex: required(
    "SCREENSHOT_KEY",
    // dev uchun nol-kalit; ishlab chiqarishda .env orqali majburiy o'zgartiriladi
    "0000000000000000000000000000000000000000000000000000000000000000",
  ),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  // Platforma egasi (super-admin) uchun. Ishlab chiqarishda albatta o'zgartiring.
  adminEmail: (process.env.ADMIN_EMAIL ?? "admin@feekr.uz").toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin12345",
};

if (config.screenshotKeyHex.length !== 64) {
  throw new Error("SCREENSHOT_KEY aynan 64 ta hex belgi (32 bayt) bo'lishi kerak");
}
