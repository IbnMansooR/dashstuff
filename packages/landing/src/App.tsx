import { useState } from "react";

// Dashboard (ilova) manzili — ro'yxatdan o'tish/kirish shu yerga olib boradi.
const APP_URL = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";

export function App() {
  return (
    <>
      <Nav />
      <Hero />
      <Trust />
      <Features />
      <HowItWorks />
      <Pricing />
      <Faq />
      <CtaBand />
      <Footer />
    </>
  );
}

function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="logo">
      <img src="/feekr-logo.svg" width={size} height={size} alt="" />
      <span className="logo-word">Feekr</span>
    </span>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a href="#" className="nav-brand"><Logo /></a>
        <nav className={`nav-links ${open ? "open" : ""}`}>
          <a href="#features" onClick={() => setOpen(false)}>Imkoniyatlar</a>
          <a href="#how" onClick={() => setOpen(false)}>Qanday ishlaydi</a>
          <a href="#pricing" onClick={() => setOpen(false)}>Narxlar</a>
          <a href="#faq" onClick={() => setOpen(false)}>Savollar</a>
        </nav>
        <div className="nav-cta">
          <a href={APP_URL} className="btn btn-ghost">Kirish</a>
          <a href={APP_URL} className="btn btn-primary">Bepul boshlash</a>
        </div>
        <button className="nav-burger" onClick={() => setOpen(!open)} aria-label="Menyu">☰</button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="pill">14 kun bepul · karta talab qilinmaydi</div>
        <h1>
          Jamoangiz vaqtini <span className="ink-accent">aniq</span> biling,
          maoshni <span className="ink-blue">o'zi</span> hisoblasin.
        </h1>
        <p className="lead">
          Feekr hodimlarning ish faolligini avtomatik kuzatadi, ekran suratlarini
          to'playdi va ishlangan soatlarga qarab oylik maoshni o'zi hisoblab beradi.
          Ortiqcha jadval va nazoratga vaqt sarflamang.
        </p>
        <div className="hero-actions">
          <a href={APP_URL} className="btn btn-primary btn-lg">Bepul sinab ko'rish</a>
          <a href="#how" className="btn btn-outline btn-lg">Qanday ishlaydi?</a>
        </div>
        <div className="hero-mock">
          <MockDashboard />
        </div>
      </div>
    </section>
  );
}

// Soddalashtirilgan dashboard ko'rinishi (rasm o'rniga — yengil va aniq).
function MockDashboard() {
  const rows = [
    { name: "Ali Valiyev", h: "7s 40d", a: 86 },
    { name: "Dilnoza Karimova", h: "6s 12d", a: 74 },
    { name: "Sardor To'rayev", h: "8s 05d", a: 91 },
  ];
  return (
    <div className="mock">
      <div className="mock-top">
        <Logo size={20} />
        <span className="mock-date">Bugun · 14-iyun</span>
      </div>
      <div className="mock-grid">
        {rows.map((r) => (
          <div className="mock-row" key={r.name}>
            <span className="mock-name">{r.name}</span>
            <span className="mock-hours">{r.h}</span>
            <span className="mock-bar"><i style={{ width: `${r.a}%` }} />{r.a}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trust() {
  return (
    <section className="trust">
      <div className="container">
        <p>O'zbekistondagi zamonaviy jamoalar uchun qurilgan</p>
        <div className="trust-stats">
          <div><b>10 daq</b><span>oraliqda nazorat</span></div>
          <div><b>AES-256</b><span>shifrlash</span></div>
          <div><b>0%</b><span>matn o'qish</span></div>
          <div><b>Win + Mac</b><span>qo'llab-quvvatlash</span></div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: "📸", title: "Ekran suratlari", text: "Belgilangan oraliqda avtomatik screenshot — kim nima ustida ishlayotganini ko'ring." },
  { icon: "📊", title: "Faollik darajasi", text: "Klaviatura va sichqoncha faolligi foiz ko'rinishida. Yozgan matningiz hech qachon saqlanmaydi." },
  { icon: "💰", title: "Avtomatik maosh", text: "Soatlik stavkani kiriting — ishlangan vaqtga qarab oylik o'zi hisoblanadi." },
  { icon: "🏢", title: "Bir nechta jamoa", text: "Har bo'lim va hodimni alohida boshqaring, hisobotlarni solishtiring." },
  { icon: "🔒", title: "Maxfiylik birinchi", text: "Ma'lumotlar shifrlangan, har kompaniya butunlay alohida (izolyatsiya)." },
  { icon: "⚡", title: "Yengil agent", text: "Hodim kompyuterini sekinlashtirmaydi. Windows va Mac uchun bitta o'rnatma." },
];

function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head">
          <h2>Nazorat uchun kerak bo'lgan hamma narsa</h2>
          <p>Murakkab sozlamalarsiz. O'rnating va birinchi kundanoq ishlatib boshlang.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article className="feature" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Ro'yxatdan o'ting", text: "Saytda kompaniya hisobi oching va hodimlarni qo'shing — bir necha daqiqada." },
  { n: "02", title: "Agentni o'rnating", text: "Hodimlar Feekr ilovasini (.exe yoki .dmg) o'rnatib, hisobiga kiradi." },
  { n: "03", title: "Hisobni ko'ring", text: "Dashboard'da soatlar, faollik va avtomatik hisoblangan maoshni kuzating." },
];

function HowItWorks() {
  return (
    <section className="section section-alt" id="how">
      <div className="container">
        <div className="section-head">
          <h2>Uch qadamda ishga tushadi</h2>
          <p>Texnik bilim shart emas.</p>
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <div className="step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: "Standart",
    price: "29 000",
    unit: "so'm / hodim / oy",
    features: ["Ekran suratlari", "Faollik darajasi", "Avtomatik maosh", "Boshqaruv paneli", "Email yordam"],
    cta: "Boshlash",
    featured: false,
  },
  {
    name: "Pro",
    price: "49 000",
    unit: "so'm / hodim / oy",
    features: ["Standart'dagi hammasi", "Batafsil hisobotlar", "Excel / PDF eksport", "Integratsiyalar", "Ustuvor yordam"],
    cta: "Pro'ni tanlash",
    featured: true,
  },
  {
    name: "Korxona",
    price: "Kelishuv",
    unit: "ko'p hodim uchun",
    features: ["Cheksiz hodim", "Maxsus sozlamalar", "SLA shartnoma", "Shaxsiy menejer", "On-premise imkoniyati"],
    cta: "Bog'lanish",
    featured: false,
  },
];

function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-head">
          <h2>Oddiy va halol narxlar</h2>
          <p>14 kun bepul sinov. Istalgan vaqt bekor qiling.</p>
        </div>
        <div className="plans">
          {PLANS.map((p) => (
            <article className={`plan ${p.featured ? "plan-featured" : ""}`} key={p.name}>
              {p.featured && <div className="plan-badge">Ommabop</div>}
              <h3>{p.name}</h3>
              <div className="plan-price">
                <strong>{p.price}</strong>
                <span>{p.unit}</span>
              </div>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href={APP_URL} className={`btn btn-lg ${p.featured ? "btn-primary" : "btn-outline"}`}>
                {p.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Hodim nima yozayotganini ko'rasizmi?", a: "Yo'q. Faqat faollik darajasi (foiz) hisoblanadi — klaviaturada yozilgan matn umuman saqlanmaydi. Bu maxfiylik va qonuniylik uchun muhim." },
  { q: "Bizning ma'lumotni siz ko'rasizmi?", a: "Yo'q. Har kompaniya butunlay alohida (izolyatsiya). Biz faqat tizimni boshqaramiz, sizning hodim ma'lumotlaringizga kira olmaymiz." },
  { q: "Agent qaysi tizimlarda ishlaydi?", a: "Windows va macOS. Hodim bir marta o'rnatadi va o'z hisobiga kiradi." },
  { q: "To'lov qanday amalga oshadi?", a: "Oylik obuna, hodim soniga qarab. 14 kunlik bepul sinovdan so'ng to'lovni boshlaysiz." },
  { q: "Screenshotlar xavfsizmi?", a: "Ha. Barcha ekran suratlari AES-256 bilan shifrlangan holda saqlanadi." },
];

function Faq() {
  const [active, setActive] = useState<number | null>(0);
  return (
    <section className="section section-alt" id="faq">
      <div className="container container-narrow">
        <div className="section-head">
          <h2>Ko'p so'raladigan savollar</h2>
        </div>
        <div className="faq">
          {FAQS.map((f, i) => (
            <div className={`faq-item ${active === i ? "open" : ""}`} key={i}>
              <button onClick={() => setActive(active === i ? null : i)}>
                <span>{f.q}</span>
                <span className="faq-sign">{active === i ? "–" : "+"}</span>
              </button>
              {active === i && <p>{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="cta-band">
      <div className="container cta-inner">
        <h2>Jamoangizni bugun kuzatib boshlang</h2>
        <p>14 kun bepul. Karta kerak emas. Bir necha daqiqada ishga tushadi.</p>
        <a href={APP_URL} className="btn btn-primary btn-lg">Bepul hisob ochish</a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <Logo />
          <p className="footer-note">Hodim ish vaqtini avtomatik kuzatuvchi tizim.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Mahsulot</h4>
            <a href="#features">Imkoniyatlar</a>
            <a href="#pricing">Narxlar</a>
            <a href={APP_URL}>Kirish</a>
          </div>
          <div>
            <h4>Kompaniya</h4>
            <a href="#faq">Savollar</a>
            <a href="mailto:info@feekr.uz">Bog'lanish</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Feekr. Barcha huquqlar himoyalangan.</span>
      </div>
    </footer>
  );
}
