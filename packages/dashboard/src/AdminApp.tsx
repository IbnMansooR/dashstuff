import { useEffect, useState } from "react";
import { api, setAdminToken, getAdminToken, type AdminCompany } from "./api.ts";

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "—";

export function AdminApp() {
  const [authed, setAuthed] = useState(!!getAdminToken());
  if (!authed) return <AdminLogin onAuthed={() => setAuthed(true)} />;
  return <AdminPanel onLogout={() => { setAdminToken(null); setAuthed(false); }} />;
}

function AdminLogin({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const r = await api.adminLogin(email, password);
      setAdminToken(r.token);
      onAuthed();
    } catch (e: any) {
      setErr("Email yoki parol xato");
    }
  }

  return (
    <div className="center">
      <form className="card auth" onSubmit={submit}>
        <div className="brand-logo">
          <img src="/feekr-logo.svg" alt="" />
          <span>Feekr</span>
        </div>
        <p className="muted">Platforma admin paneli</p>
        <input placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Parol" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="error">{err}</div>}
        <button type="submit">Kirish</button>
      </form>
    </div>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.adminStats(), api.adminCompanies()])
      .then(([s, c]) => {
        setStats(s as any);
        setCompanies(c.companies);
      })
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="app">
      <header>
        <span className="brand-logo">
          <img src="/feekr-logo.svg" alt="" />
          <span>Feekr</span>
        </span>
        <span className="muted">Platforma admin</span>
        <button className="link" onClick={onLogout}>Chiqish</button>
      </header>

      {err && <div className="error" style={{ marginTop: 16 }}>{err}</div>}

      <div className="admin-stats">
        <Stat label="Kompaniyalar" value={stats?.companies} />
        <Stat label="Hodimlar" value={stats?.employees} />
        <Stat label="Faol qurilmalar" value={stats?.devices} />
        <Stat label="Screenshotlar" value={stats?.screenshots} />
        <Stat label="Hisobotlar" value={stats?.samples} />
      </div>

      <h3 style={{ marginTop: 8 }}>Kompaniyalar</h3>
      <table className="grid" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Kompaniya</th>
            <th>Hodimlar</th>
            <th>Qurilmalar</th>
            <th>Ro'yxatdan o'tgan</th>
            <th>Oxirgi faollik</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.employees}</td>
              <td>{c.devices}</td>
              <td>{fmtDate(c.created_at)}</td>
              <td>{fmtDate(c.last_activity)}</td>
            </tr>
          ))}
          {companies.length === 0 && (
            <tr><td colSpan={5} className="center-cell muted">Hali kompaniya yo'q</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="stat-card">
      <b>{value ?? "…"}</b>
      <span>{label}</span>
    </div>
  );
}
