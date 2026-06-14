# WorkTrack

Hodimlar ish vaqtini kuzatuvchi SaaS tizimi. Har kompaniya alohida (multi-tenant)
ishlaydi: agent har interval ekrandan rasm oladi va faollik darajasini hisoblaydi,
boshqaruvchi dashboard orqali soatlarni ko'radi va oylik maoshni avtomatik hisoblaydi.

## Uchta qism

| Qism | Papka | Texnologiya | Vazifasi |
|------|-------|-------------|----------|
| **Server** | `packages/server` | Node.js + Express + SQLite | API, ma'lumot saqlash, maosh hisobi |
| **Dashboard** (boshqaruvchi) | `packages/dashboard` | React + Vite | Hodimlar, faollik, screenshot, maosh |
| **Agent** (hodim) | `packages/agent` | Electron (Windows + Mac) | Screenshot + faollik yuborish |
| Umumiy tiplar | `packages/shared` | TypeScript | 3 qism o'rtasidagi ma'lumot shartnomasi |

## Maxfiylik va xavfsizlik (muhim)

- **Klaviaturada yozilgan matn saqlanmaydi.** Agent faqat `getSystemIdleTime()` orqali
  "foydalanuvchi faol edimi" degan SONni yig'adi — qaysi tugma bosilgani o'qilmaydi.
  (Aniq tugma sanog'i kerak bo'lsa, keyin ixtiyoriy native modul qo'shiladi.)
- **Screenshotlar shifrlangan holda saqlanadi** (AES-256-GCM). Diskda ochiq rasm yo'q.
- **Multi-tenant izolyatsiya:** har so'rov `company_id` bo'yicha cheklangan — kompaniya
  faqat o'z hodimlarini ko'radi.
- **Qurilma tokeni** DB'da ochiq emas, faqat SHA-256 hash bo'lib saqlanadi.
- **Parollar** bcrypt bilan hash qilinadi. Foydalanuvchi sessiyasi JWT.
- Agentda hodimga doimo ko'rinadigan **"ekraningiz kuzatilmoqda"** ogohlantirishi bor.

## Ishga tushirish

### 1. O'rnatish
```bash
npm install
```

### 2. Server
```bash
cp packages/server/.env.example packages/server/.env
# .env ichidagi JWT_SECRET va SCREENSHOT_KEY ni o'zgartiring:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev:server          # http://localhost:4000
```

### 3. Dashboard
```bash
npm run dev:dashboard       # http://localhost:5173
```
Brauzerda oching → "Yangi kompaniya ochish" → hodim qo'shing.

### 4. Agent (hodim kompyuterida)
```bash
npm run dev:agent
```
Hodim o'z email/paroli bilan kiradi → "Ishni boshlash" bosadi.
Sinov uchun intervalni qisqartirish:
```bash
WT_INTERVAL_SEC=20 npm run dev:agent   # har 20 soniyada yuboradi
```

## Biznes modeli

Har kompaniyaga oylik obuna evaziga sotiladi. Siz faqat serverni boshqarasiz —
mijoz kompaniyaning hodim ma'lumotlariga (screenshot/faollik) kira olmaysiz, chunki
ular o'z kompaniya hisobi ostida izolyatsiya qilingan.

## Keyingi bosqichlar (MVP'dan keyin)

- To'lov/obuna tizimi (masalan, Payme/Click yoki Stripe)
- Postgres'ga o'tish (hozir SQLite — kichik/o'rta uchun yetarli)
- Screenshotlarni S3'ga o'tkazish
- Agent uchun avtomatik yangilanish va autostart
- Ixtiyoriy: aniq klaviatura/sichqoncha sanog'i (native modul)
- Hisobotlar eksporti (Excel/PDF)
