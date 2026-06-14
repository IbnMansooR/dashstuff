import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import { AdminApp } from "./AdminApp.tsx";
import "./styles.css";

// #admin hash -> platforma admin paneli, aks holda oddiy boshqaruv paneli.
function Root() {
  const [isAdmin, setIsAdmin] = React.useState(window.location.hash === "#admin");
  React.useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash === "#admin");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return isAdmin ? <AdminApp /> : <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
