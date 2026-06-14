import { useEffect, useState } from "react";
import {
  api,
  setToken,
  getToken,
  type Employee,
  type DaySummary,
  type Payroll,
} from "./api.ts";

const today = () => new Date().toISOString().slice(0, 10);
const fmtMinutes = (m: number) => `${Math.floor(m / 60)} soat ${m % 60} daqiqa`;
const fmtMoney = (n: number, cur: string) => `${n.toLocaleString("ru-RU")} ${cur}`;

export function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center">Yuklanmoqda…</div>;
  if (!user) return <AuthScreen onAuthed={setUser} />;
  return <Dashboard user={user} onLogout={() => { setToken(null); setUser(null); }} />;
}

function AuthScreen({ onAuthed }: { onAuthed: (u: any) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const r =
        mode === "login"
          ? await api.login(email, password)
          : await api.registerCompany(companyName, fullName, email, password);
      setToken(r.token);
      onAuthed(r.user);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="center">
      <form className="card auth" onSubmit={submit}>
        <div className="brand-logo">
          <img src="/feekr-logo.svg" alt="" />
          <span>Feekr</span>
        </div>
        <p className="muted">Boshqaruv paneli</p>
        {mode === "register" && (
          <>
            <input placeholder="Kompaniya nomi" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <input placeholder="To'liq ismingiz" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </>
        )}
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Parol" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="error">{err}</div>}
        <button type="submit">{mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}</button>
        <button
          type="button"
          className="link"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Yangi kompaniya ochish" : "Hisobingiz bormi? Kirish"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [date, setDate] = useState(today());
  const [summary, setSummary] = useState<DaySummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    try {
      const [s, e] = await Promise.all([api.summary(date), api.employees()]);
      setSummary(s.summary);
      setEmployees(e.employees);
    } catch (e: any) {
      setErr(e.message);
    }
  }
  useEffect(() => {
    reload();
  }, [date]);

  return (
    <div className="app">
      <header>
        <span className="brand-logo">
          <img src="/feekr-logo.svg" alt="" />
          <span>Feekr</span>
        </span>
        <span className="muted">{user.fullName} · {user.email}</span>
        <button className="link" onClick={onLogout}>Chiqish</button>
      </header>

      <main>
        {err && <div className="error">{err}</div>}
        <div className="toolbar">
          <label>
            Sana:{" "}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <AddEmployee onAdded={reload} />
        </div>

        <table className="grid">
          <thead>
            <tr>
              <th>Hodim</th>
              <th>Ishlangan vaqt</th>
              <th>Faollik %</th>
              <th>Screenshotlar</th>
              <th>Soatlik stavka</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => {
              const emp = employees.find((e) => e.id === row.employeeId);
              return (
                <tr key={row.employeeId}>
                  <td>{row.fullName}</td>
                  <td>{fmtMinutes(row.workedMinutes)}</td>
                  <td>
                    <div className="bar">
                      <div className="bar-fill" style={{ width: `${row.avgActivityPercent}%` }} />
                      <span>{row.avgActivityPercent}%</span>
                    </div>
                  </td>
                  <td>{row.screenshotCount} ta</td>
                  <td>{emp ? fmtMoney(emp.hourly_rate, emp.currency) : "—"}</td>
                  <td>
                    <button className="link" onClick={() => setSelected(row.employeeId)}>
                      Batafsil
                    </button>
                  </td>
                </tr>
              );
            })}
            {summary.length === 0 && (
              <tr>
                <td colSpan={6} className="muted center-cell">Hali hodim yoki ma'lumot yo'q</td>
              </tr>
            )}
          </tbody>
        </table>
      </main>

      {selected && (
        <EmployeeDetail
          employee={employees.find((e) => e.id === selected)!}
          date={date}
          onClose={() => setSelected(null)}
          onRateSaved={reload}
        />
      )}
    </div>
  );
}

function AddEmployee({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hourlyRate, setHourlyRate] = useState("0");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api.createEmployee({
        fullName,
        email,
        password,
        hourlyRate: Number(hourlyRate),
        currency: "UZS",
      });
      setOpen(false);
      setFullName(""); setEmail(""); setPassword(""); setHourlyRate("0");
      onAdded();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  if (!open) return <button onClick={() => setOpen(true)}>+ Hodim qo'shish</button>;
  return (
    <form className="inline-form" onSubmit={submit}>
      <input placeholder="Ism" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Parol (8+)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input placeholder="Soatlik stavka" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
      {err && <span className="error">{err}</span>}
      <button type="submit">Saqlash</button>
      <button type="button" className="link" onClick={() => setOpen(false)}>Bekor</button>
    </form>
  );
}

function EmployeeDetail({
  employee,
  date,
  onClose,
  onRateSaved,
}: {
  employee: Employee;
  date: string;
  onClose: () => void;
  onRateSaved: () => void;
}) {
  const [shots, setShots] = useState<{ id: string; taken_at: string; url?: string }[]>([]);
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [rate, setRate] = useState(String(employee.hourly_rate));
  const [from, setFrom] = useState(date.slice(0, 8) + "01");
  const [to, setTo] = useState(date);

  useEffect(() => {
    api.screenshots(employee.id, date).then(async (r) => {
      const withUrls = await Promise.all(
        r.screenshots.map(async (s) => ({
          ...s,
          url: await api.fetchScreenshot(s.id).catch(() => undefined),
        })),
      );
      setShots(withUrls);
    });
  }, [employee.id, date]);

  async function saveRate() {
    await api.updateEmployee(employee.id, { hourlyRate: Number(rate) });
    onRateSaved();
  }
  async function calcPayroll() {
    setPayroll(await api.payroll(employee.id, from, to));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{employee.full_name}</h2>
          <button className="link" onClick={onClose}>✕</button>
        </div>

        <section>
          <h3>Soatlik stavka</h3>
          <div className="row">
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            <span>{employee.currency}</span>
            <button onClick={saveRate}>Saqlash</button>
          </div>
        </section>

        <section>
          <h3>Oylik maosh hisobi</h3>
          <div className="row">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <button onClick={calcPayroll}>Hisoblash</button>
          </div>
          {payroll && (
            <div className="payroll">
              Ishlangan: <b>{fmtMinutes(payroll.workedMinutes)}</b> · Stavka:{" "}
              {fmtMoney(payroll.hourlyRate, payroll.currency)}/soat · Jami:{" "}
              <b className="pay">{fmtMoney(payroll.grossPay, payroll.currency)}</b>
            </div>
          )}
        </section>

        <section>
          <h3>Screenshotlar ({date})</h3>
          <div className="shots">
            {shots.map((s) => (
              <figure key={s.id}>
                {s.url ? <img src={s.url} alt="" /> : <div className="shot-placeholder" />}
                <figcaption>{new Date(s.taken_at).toLocaleTimeString("ru-RU")}</figcaption>
              </figure>
            ))}
            {shots.length === 0 && <p className="muted">Bu kunda screenshot yo'q</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
