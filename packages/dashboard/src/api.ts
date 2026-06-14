// Backend bilan ishlovchi yengil klient.
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let token: string | null = localStorage.getItem("wt_token");

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("wt_token", t);
  else localStorage.removeItem("wt_token");
}
export function getToken() {
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Xato ${res.status}`);
  }
  return res.json();
}

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  hourly_rate: number;
  currency: string;
}
export interface DaySummary {
  employeeId: string;
  fullName: string;
  date: string;
  workedMinutes: number;
  avgActivityPercent: number;
  screenshotCount: number;
}
export interface Payroll {
  employeeId: string;
  fullName: string;
  periodStart: string;
  periodEnd: string;
  workedMinutes: number;
  hourlyRate: number;
  grossPay: number;
  currency: string;
}

export const api = {
  base: BASE,
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  registerCompany: (companyName: string, fullName: string, email: string, password: string) =>
    request<{ token: string; user: any }>("/api/auth/register-company", {
      method: "POST",
      body: JSON.stringify({ companyName, fullName, email, password }),
    }),
  me: () => request<{ user: any }>("/api/auth/me"),
  employees: () => request<{ employees: Employee[] }>("/api/employees"),
  createEmployee: (data: {
    fullName: string;
    email: string;
    password: string;
    hourlyRate: number;
    currency: string;
  }) => request<{ employee: any }>("/api/employees", { method: "POST", body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: { hourlyRate?: number; fullName?: string }) =>
    request<{ ok: boolean }>(`/api/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  summary: (date: string) =>
    request<{ date: string; summary: DaySummary[] }>(`/api/dashboard/summary?date=${date}`),
  screenshots: (employeeId: string, date: string) =>
    request<{ screenshots: { id: string; taken_at: string }[] }>(
      `/api/dashboard/screenshots?employeeId=${employeeId}&date=${date}`,
    ),
  // Token sarlavhada ketadi, rasm blob sifatida olinadi va vaqtinchalik URL yaratiladi.
  fetchScreenshot: async (id: string): Promise<string> => {
    const res = await fetch(`${BASE}/api/dashboard/screenshots/${id}/image`, {
      headers: token ? { authorization: "Bearer " + token } : {},
    });
    if (!res.ok) throw new Error("Rasmni yuklab bo'lmadi");
    return URL.createObjectURL(await res.blob());
  },
  payroll: (employeeId: string, from: string, to: string) =>
    request<Payroll>(`/api/dashboard/payroll?employeeId=${employeeId}&from=${from}&to=${to}`),
};
