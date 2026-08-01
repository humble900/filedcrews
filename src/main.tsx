import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
