/**
 * Google Analytics 4 client-side analytics service.
 *
 * Provides typed helper functions for page views and custom events.
 * Gracefully degrades when VITE_GA_MEASUREMENT_ID is not set — no errors thrown.
 *
 * Usage:
 *   import { initAnalytics, logPageView, logEvent } from "@/services/analytics";
 *
 *   initAnalytics();
 *   logPageView("/leads");
 *   logEvent("lead_created", { source: "facebook" });
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Known custom event names used throughout the CRM. */
export type AnalyticsEventName =
  | "lead_created"
  | "deal_status_changed"
  | "viewing_scheduled"
  | "commission_computed"
  | "brochure_viewed"
  | "listing_shared"
  | "task_completed"
  | "deal_closed"
  | "project_created"
  | "document_generated"
  | "login"
  | "registration"
  | "payment_recorded"
  | "tour_completed";

/** Params dict for gtag events. */
export type AnalyticsEventParams = Record<string, string | number | boolean>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the GA measurement ID from env, or empty string if unset.
 * Prevents crashes when the variable is missing at build time.
 */
function getMeasurementId(): string {
  try {
    return import.meta.env.VITE_GA_MEASUREMENT_ID ?? "";
  } catch {
    return "";
  }
}

/** True when GA has been configured and the gtag function is available. */
function isGaReady(): boolean {
  return !!getMeasurementId() && typeof window.gtag === "function";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize Google Analytics 4.
 *
 * Injects the gtag.js script and calls `gtag('config', <MEASUREMENT_ID>)` once.
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * Should be called once at app bootstrap (e.g. in main.tsx).
 */
export function initAnalytics(): void {
  const gaId = getMeasurementId();
  if (!gaId) return;

  // Prevent double-initialisation
  if (document.querySelector(`script[data-ga-init="${gaId}"]`)) return;

  // First script: load gtag.js
  const gtagScript = document.createElement("script");
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(gtagScript);

  // Second script: initialise dataLayer and gtag command queue
  const initScript = document.createElement("script");
  initScript.setAttribute("data-ga-init", gaId);
  initScript.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(initScript);
}

/**
 * Log a page view to Google Analytics.
 * @param path The current URL path, e.g. "/leads" or "/deals/abc123".
 */
export function logPageView(path: string): void {
  if (!isGaReady()) return;

  try {
    window.gtag!("event", "page_view", {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
    });
  } catch {
    // Silently ignore — analytics should never block the app.
  }
}

/**
 * Log a custom event to Google Analytics.
 *
 * @param eventName One of the known AnalyticsEventName values.
 * @param params    Optional key-value pairs to attach to the event.
 *
 * @example
 *   logEvent("lead_created", { source: "facebook", score: "hot" });
 *   logEvent("deal_status_changed", { from: "pending", to: "closed" });
 */
export function logEvent(
  eventName: AnalyticsEventName,
  params?: AnalyticsEventParams,
): void {
  if (!isGaReady()) return;

  try {
    window.gtag!("event", eventName, params ?? {});
  } catch {
    // Silently ignore.
  }
}
