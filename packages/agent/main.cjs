// WorkTrack hodim agenti — asosiy jarayon (Electron main process).
// Vazifasi: hodim login qiladi -> qurilma ro'yxatdan o'tadi -> "Ishni boshlash" bosilganda
// har interval screenshot + faollik foizini serverga yuboradi.
//
// MAXFIYLIK: bu yerda klaviaturada NIMA yozilgani umuman o'qilmaydi. Faqat
// powerMonitor.getSystemIdleTime() orqali "foydalanuvchi faol edimi" degan SON yig'iladi.

const { app, BrowserWindow, ipcMain, desktopCapturer, powerMonitor, screen, Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

// ---- Sozlamalar -----------------------------------------------------------
const AGENT_VERSION = "0.1.0";
// Ishlab chiqarishda 10 daqiqa. Sinov uchun .env yoki WT_INTERVAL_SEC bilan qisqartiring.
const REPORT_INTERVAL_SEC = Number(process.env.WT_INTERVAL_SEC || 10 * 60);
const SAMPLE_EVERY_SEC = 5; // har necha soniyada faollik tekshiriladi
const IDLE_THRESHOLD_SEC = SAMPLE_EVERY_SEC; // shu vaqtdan kam bekorchilik = faol

// ---- Konfiguratsiya saqlash (token va h.k.) -------------------------------
const configPath = () => path.join(app.getPath("userData"), "worktrack-config.json");
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), "utf8"));
  } catch {
    return { serverUrl: process.env.WT_SERVER || "http://localhost:4000" };
  }
}
function saveConfig(cfg) {
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2));
}
let config = loadConfig();

// ---- Holat ----------------------------------------------------------------
let mainWindow = null;
let tray = null;
let tracking = false;
let sampleTimer = null;
let reportTimer = null;
let activeTicks = 0;
let totalTicks = 0;
let intervalStartedAt = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 560,
    resizable: false,
    title: "WorkTrack",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

// ---- Server bilan ishlash -------------------------------------------------
async function apiPost(pathName, body, token) {
  const res = await fetch(config.serverUrl + pathName, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Server xatosi " + res.status);
  return data;
}

// ---- Faollik o'lchash ------------------------------------------------------
function sampleActivity() {
  totalTicks++;
  // getSystemIdleTime() — oxirgi klaviatura/sichqoncha hodisasidan beri o'tgan SONIYA.
  const idle = powerMonitor.getSystemIdleTime();
  if (idle < IDLE_THRESHOLD_SEC) activeTicks++;
}

async function captureScreenshotBase64() {
  const primary = screen.getPrimaryDisplay();
  const { width, height } = primary.size;
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width, height },
  });
  if (!sources.length) return null;
  const img = sources[0].thumbnail;
  if (!img || img.isEmpty()) return null;
  return img.toPNG().toString("base64");
}

async function sendReport() {
  const endedAt = new Date().toISOString();
  const startedAt = intervalStartedAt || new Date(Date.now() - REPORT_INTERVAL_SEC * 1000).toISOString();
  const activityPercent = totalTicks > 0 ? Math.round((activeTicks / totalTicks) * 100) : 0;

  // keyingi interval uchun hisoblagichlarni tiklaymiz
  activeTicks = 0;
  totalTicks = 0;
  intervalStartedAt = endedAt;

  let screenshotBase64 = null;
  try {
    screenshotBase64 = await captureScreenshotBase64();
  } catch (e) {
    console.error("Screenshot xatosi:", e.message);
  }

  try {
    await apiPost(
      "/api/ingest",
      {
        sample: {
          startedAt,
          endedAt,
          keyCount: 0, // aniq tugma sanog'i ixtiyoriy native modul bilan keyin qo'shiladi
          mouseCount: 0,
          activityPercent,
        },
        screenshotBase64,
        agentVersion: AGENT_VERSION,
        working: true,
      },
      config.deviceToken,
    );
    notifyRenderer("report-sent", { at: endedAt, activityPercent });
  } catch (e) {
    console.error("Yuborishda xato:", e.message);
    notifyRenderer("report-error", { message: e.message });
  }
}

function startTracking() {
  if (tracking) return;
  if (!config.deviceToken) throw new Error("Avval tizimga kiring");
  tracking = true;
  activeTicks = 0;
  totalTicks = 0;
  intervalStartedAt = new Date().toISOString();
  sampleTimer = setInterval(sampleActivity, SAMPLE_EVERY_SEC * 1000);
  reportTimer = setInterval(sendReport, REPORT_INTERVAL_SEC * 1000);
  updateTray();
  notifyRenderer("tracking-changed", { tracking: true });
}

function stopTracking() {
  tracking = false;
  if (sampleTimer) clearInterval(sampleTimer);
  if (reportTimer) clearInterval(reportTimer);
  sampleTimer = reportTimer = null;
  updateTray();
  notifyRenderer("tracking-changed", { tracking: false });
}

function notifyRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function updateTray() {
  if (!tray) return;
  tray.setToolTip(tracking ? "WorkTrack — kuzatilyapti" : "WorkTrack — to'xtatilgan");
}

// ---- IPC (renderer bilan aloqa) -------------------------------------------
ipcMain.handle("get-state", () => ({
  loggedIn: !!config.token,
  user: config.user || null,
  tracking,
  serverUrl: config.serverUrl,
  intervalSec: REPORT_INTERVAL_SEC,
}));

ipcMain.handle("set-server", (_e, url) => {
  config.serverUrl = url;
  saveConfig(config);
  return { ok: true };
});

ipcMain.handle("login", async (_e, { email, password }) => {
  const r = await apiPost("/api/auth/login", { email, password });
  config.token = r.token;
  config.user = r.user;
  // Qurilma hali ro'yxatdan o'tmagan bo'lsa — bog'laymiz.
  if (!config.deviceToken) {
    const dev = await apiPost(
      "/api/devices/enroll",
      { name: require("node:os").hostname(), os: process.platform },
      config.token,
    );
    config.deviceToken = dev.deviceToken;
    config.deviceId = dev.deviceId;
  }
  saveConfig(config);
  return { user: r.user };
});

ipcMain.handle("logout", () => {
  stopTracking();
  delete config.token;
  delete config.user;
  // Eslatma: deviceToken saqlanadi (qurilma bog'langan holicha qoladi).
  saveConfig(config);
  return { ok: true };
});

ipcMain.handle("start-tracking", () => {
  startTracking();
  return { tracking: true };
});
ipcMain.handle("stop-tracking", () => {
  stopTracking();
  return { tracking: false };
});

// ---- Hayot sikli ----------------------------------------------------------
app.whenReady().then(() => {
  createWindow();
  try {
    tray = new Tray(nativeImage.createEmpty());
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: "Oynani ochish", click: () => (mainWindow ? mainWindow.show() : createWindow()) },
        { label: "Chiqish", click: () => app.quit() },
      ]),
    );
    updateTray();
  } catch {
    /* tray ixtiyoriy */
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // Kuzatuv davom etayotgan bo'lsa fon rejimda qoladi; aks holda chiqamiz.
  if (!tracking && process.platform !== "darwin") app.quit();
});
