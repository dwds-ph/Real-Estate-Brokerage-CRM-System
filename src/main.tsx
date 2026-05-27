/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Analytics } from "./components/Analytics";
import { initAnalytics, logPageView } from "./services/analytics";
import App from "./App";
import { enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "./index.css";
import "leaflet/dist/leaflet.css";

// ── Initialise analytics on app load ─────────────────────────────────
initAnalytics();

// ── Enable Firestore offline persistence ─────────────────────────────
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn(
      "[offline] Multiple tabs open — persistence in first tab only",
    );
  } else if (err.code === "unimplemented") {
    console.warn("[offline] Browser doesn't support IndexedDB persistence");
  } else {
    console.error("[offline] Failed to enable persistence:", err);
  }
});

// ── Track page views on every route change ──────────────────────────
function PageViewTracker() {
  const location = useLocation();

  React.useEffect(() => {
    logPageView(location.pathname);
  }, [location]);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Analytics />
      <PageViewTracker />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
