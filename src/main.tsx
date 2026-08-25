import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Catch dynamic import errors caused by new deployments / stale index.html chunk hashes
window.addEventListener("vite:preloadError", (event) => {
  console.warn("[Vite] Dynamic import preload error detected. Reloading page for latest assets...", event);
  window.location.reload();
});

// Suppress non-critical external extension/iframe channel errors like "tabs:outgoing.message.ready"
window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message || String(event.reason || "");
  if (
    msg.includes("tabs:outgoing") ||
    msg.includes("No Listener: tabs:outgoing") ||
    msg.includes("message channel closed") ||
    msg.includes("Receiving end does not exist")
  ) {
    event.preventDefault();
  }
});

// Register Production PWA Service Worker
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (registration) => {
        console.log("[PWA SW] Service worker registered successfully:", registration.scope);
      },
      (err) => {
        console.warn("[PWA SW] Service worker registration failed:", err);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);

