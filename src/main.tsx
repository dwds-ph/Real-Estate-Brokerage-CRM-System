import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Analytics } from "./components/Analytics";
import { initAnalytics, logPageView } from "./services/analytics";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";

// ── Initialise analytics on app load ─────────────────────────────────
initAnalytics();

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
