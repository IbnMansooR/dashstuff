// WorkTrack — agent, server va dashboard o'rtasida umumiy tiplar.
// Bu yerda faqat MA'LUMOT TUZILMALARI bo'ladi (logika emas).

/** Faollik bo'lagi: agent har interval (mas. 10 daqiqa) shu obyektni yuboradi.
 *  DIQQAT: bu yerda klaviaturada NIMA yozilgani saqlanmaydi — faqat SONlar. */
export interface ActivitySample {
  /** Bo'lak boshlangan vaqt (ISO 8601, UTC). */
  startedAt: string;
  /** Bo'lak tugagan vaqt (ISO 8601, UTC). */
  endedAt: string;
  /** Shu bo'lakda nechta klaviatura tugmasi bosilgani (faqat son). */
  keyCount: number;
  /** Shu bo'lakda nechta sichqoncha bosilishi/harakati hodisasi bo'lgani. */
  mouseCount: number;
  /** Hisoblangan faollik foizi (0–100). */
  activityPercent: number;
}

/** Agentdan serverga yuboriladigan to'liq hisobot (bitta interval). */
export interface AgentReport {
  /** Qurilma tokeni emas — u sarlavhada (header) ketadi. Bu metama'lumot. */
  sample: ActivitySample;
  /** Screenshot base64 (PNG). Server uni shifrlab saqlaydi. */
  screenshotBase64: string | null;
  /** Agent versiyasi — debugging uchun. */
  agentVersion: string;
  /** Hodim o'sha paytda faol ish rejimida bo'lganmi (Ishni boshladim bosganmi). */
  working: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: "owner" | "manager" | "employee";
  companyId: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

/** Qurilmani ro'yxatdan o'tkazish: hodim o'z hisobidan kompyuterini bog'laydi. */
export interface EnrollDeviceResponse {
  deviceId: string;
  /** Agent shu tokenni saqlab, har so'rovda Authorization: Bearer bilan yuboradi. */
  deviceToken: string;
}

/** Dashboard uchun bitta hodimning kunlik xulosasi. */
export interface EmployeeDaySummary {
  employeeId: string;
  fullName: string;
  date: string; // YYYY-MM-DD
  /** Faol ishlangan daqiqalar (working=true bo'lgan bo'laklar yig'indisi). */
  workedMinutes: number;
  /** O'rtacha faollik foizi (0–100). */
  avgActivityPercent: number;
  screenshotCount: number;
}

/** Oylik maosh hisobi. */
export interface PayrollResult {
  employeeId: string;
  fullName: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  workedMinutes: number;
  hourlyRate: number; // belgilangan valyutada
  /** workedMinutes / 60 * hourlyRate. */
  grossPay: number;
  currency: string;
}

export const INTERVAL_MINUTES = 10;
