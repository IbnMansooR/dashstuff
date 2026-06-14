// Renderer — faqat UI mantig'i. Hamma ish `window.worktrack` (preload) orqali.
const $ = (id) => document.getElementById(id);

const loginView = $("login-view");
const trackView = $("track-view");

async function refresh() {
  const s = await window.worktrack.getState();
  $("server-url").value = s.serverUrl || "";
  $("interval-min").textContent = Math.round((s.intervalSec || 600) / 60);

  if (s.loggedIn) {
    loginView.classList.add("hidden");
    trackView.classList.remove("hidden");
    $("user-line").textContent = s.user ? `${s.user.fullName} (${s.user.email})` : "";
    setTrackingUI(s.tracking);
  } else {
    loginView.classList.remove("hidden");
    trackView.classList.add("hidden");
  }
}

function setTrackingUI(tracking) {
  $("state-dot").className = "dot " + (tracking ? "on" : "off");
  $("state-text").textContent = tracking ? "Kuzatilyapti" : "To'xtatilgan";
  $("start-btn").classList.toggle("hidden", tracking);
  $("stop-btn").classList.toggle("hidden", !tracking);
}

$("login-btn").addEventListener("click", async () => {
  const err = $("login-error");
  err.classList.add("hidden");
  try {
    await window.worktrack.login($("email").value.trim(), $("password").value);
    await refresh();
  } catch (e) {
    err.textContent = e.message || "Kirishda xato";
    err.classList.remove("hidden");
  }
});

$("save-server").addEventListener("click", async () => {
  await window.worktrack.setServer($("server-url").value.trim());
});

$("start-btn").addEventListener("click", async () => {
  await window.worktrack.startTracking();
});
$("stop-btn").addEventListener("click", async () => {
  await window.worktrack.stopTracking();
});
$("logout-btn").addEventListener("click", async () => {
  await window.worktrack.logout();
  await refresh();
});

window.worktrack.on("tracking-changed", (p) => setTrackingUI(p.tracking));
window.worktrack.on("report-sent", (p) => {
  $("last-report").textContent = `Oxirgi yuborildi: ${new Date(p.at).toLocaleTimeString("ru-RU")} · faollik ${p.activityPercent}%`;
});
window.worktrack.on("report-error", (p) => {
  $("last-report").textContent = `Yuborishda xato: ${p.message}`;
});

refresh();
