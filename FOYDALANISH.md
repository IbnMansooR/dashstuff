# Feekr — o'z kompyuteringizda ishga tushirish va sinab ko'rish

Bu qo'llanma Feekr'ni o'z kompyuteringizni **server** qilib ishlatib sinab ko'rish uchun.

## 0. Talab
- Node.js o'rnatilgan bo'lsin (`node --version` ishlasin).
- VS Code'da `worktrack` papkasini oching, terminal oching (Terminal → New Terminal).

## 1. Bir marta o'rnatish
```bash
npm install
```

## 2. Hammasini ishga tushirish (server + panel + sayt)
```bash
npm run dev
```
Bu uchta narsani birga ishga tushiradi:
- **server**  → http://localhost:4000  (ma'lumotlar shu yerda)
- **panel**   → http://localhost:5173  (boshqaruvchi dashboardi)
- **sayt**    → http://localhost:5175  (marketing sayt)

Server ishga tushganda terminalda **ulanish manzillarini** ko'rsatadi, masalan:
```
  • Shu kompyuterda:  http://localhost:4000
  • Tarmoqdan (agent uchun):  http://192.168.0.192:4000   ← shu manzilni eslab qoling
```

## 3. Birinchi marta sozlash (boshqaruvchi)
1. Brauzerda **http://localhost:5173** oching.
2. **"Yangi kompaniya ochish"** → kompaniya nomi, ismingiz, email, parol.
3. Ichkarida **"+ Hodim qo'shish"** → hodim ismi, email, parol, soatlik stavka.

## 4. Hodim agentini ishga tushirish
Yangi terminal oynasida:
```bash
npm run dev:agent
```
Agent oynasida:
1. Pastdagi **"Server manzili"** ni oching va to'g'ri manzilni yozing:
   - Agar agent **shu kompyuterda** bo'lsa: `http://localhost:4000`
   - Agar agent **boshqa kompyuterda** bo'lsa: `http://192.168.0.192:4000`
     (server ko'rsatgan "Tarmoqdan" manzili)
2. Hodim emaili va paroli bilan **Kirish**.
3. **"Ishni boshlash"** — endi har interval screenshot + faollik yuboriladi.

> Sinov uchun 10 daqiqani kutmaslik: agentni shunday ishga tushiring —
> `WT_INTERVAL_SEC=20 npm run dev:agent` (har 20 soniyada yuboradi).

Panelda (http://localhost:5173) sahifani yangilang — hodimning soatlari, faollik
foizi va screenshotlari paydo bo'ladi.

## 5. Admin panel (siz — platforma egasi)
- http://localhost:5173/#admin
- Standart: `admin@feekr.uz` / `admin12345`  (parolni `.env` da o'zgartiring!)
- Bu yerda barcha kompaniyalar va umumiy statistikani ko'rasiz.

## Boshqa kompyuterdagi hodimni ulash (o'z PC'ingiz server bo'lganda)
1. Hamma bir xil **Wi-Fi / tarmoqda** bo'lsin.
2. Hodim kompyuterida agentni o'rnating (yoki ishga tushiring), **Server manzili** =
   `http://192.168.0.192:4000` (server ko'rsatgan manzil).
3. **Windows Firewall:** server birinchi ishga tushganda "Allow access" so'raydi —
   **ruxsat bering** (Private network). Aks holda boshqa kompyuter ulana olmaydi.
4. Sizning kompyuteringiz **yoniq** turishi kerak (server o'chsa, kuzatuv to'xtaydi).

> Eslatma: tarmoq manzili (192.168.x.x) Wi-Fi qayta ulanganda o'zgarishi mumkin.
> O'zgarsa, server ishga tushganda yangi manzilni ko'rsatadi — agentda yangilang.
> Hodimlar **internet orqali** (boshqa joydan) ulanishi uchun keyin tizimni
> internetga joylashtirish (deploy) kerak bo'ladi.

## Agentni `.exe` qilib yasash (hodimlarga tarqatish uchun)

Agent allaqachon yasalgan. Ikki ko'rinishi bor:

### 1. Portativ (hozir tayyor, o'rnatishsiz)
```
worktrack\packages\agent\dist\win-unpacked\
```
Bu papka ichidagi **Feekr.exe** to'g'ridan-to'g'ri ishlaydi. Hodimga butun
`win-unpacked` papkasini ZIP qilib bering — ular ochib, `Feekr.exe` ni ishga tushiradi.
O'rnatish shart emas.

### 2. O'rnatuvchi (Feekr Setup.exe — bitta fayl) — qayta yasash kerak
Bitta faylli chiroyli o'rnatuvchi uchun:
```bash
npm run dist:agent
```
> ⚠️ Bu buyruq Windows'da **symbolic link** yaratadi — buning uchun **Developer Mode**
> yoqilgan bo'lishi kerak (Sozlamalar → Maxfiylik va xavfsizlik → Dasturchilar uchun →
> **Developer Mode = ON**), YOKI terminalni **Administrator** sifatida oching.
> Aks holda winCodeSign xatosi chiqadi (yuqoridagi portativ versiya baribir yasaladi).

Tayyor bo'lganda o'rnatuvchi shu yerda paydo bo'ladi:
`worktrack\packages\agent\dist\Feekr Setup 0.1.0.exe`

> macOS uchun `.dmg` faqat Mac kompyuterda yasaladi: `npm run dist:mac`.

## To'xtatish
Terminalda **Ctrl + C**.
