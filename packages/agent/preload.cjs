// Preload — renderer (UI) bilan main process o'rtasida xavfsiz ko'prik.
// Renderer to'g'ridan-to'g'ri Node'ga kira olmaydi; faqat shu funksiyalardan foydalanadi.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("worktrack", {
  getState: () => ipcRenderer.invoke("get-state"),
  setServer: (url) => ipcRenderer.invoke("set-server", url),
  login: (email, password) => ipcRenderer.invoke("login", { email, password }),
  logout: () => ipcRenderer.invoke("logout"),
  startTracking: () => ipcRenderer.invoke("start-tracking"),
  stopTracking: () => ipcRenderer.invoke("stop-tracking"),
  on: (channel, handler) => {
    const allowed = ["tracking-changed", "report-sent", "report-error"];
    if (allowed.includes(channel)) ipcRenderer.on(channel, (_e, payload) => handler(payload));
  },
});
