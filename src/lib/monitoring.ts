/**
 * Error Monitoring Service
 * 
 * Lightweight client-side monitoring without Sentry dependency.
 * Logs errors to console in dev, could be extended to use
 * Firebase Performance Monitoring or a custom endpoint.
 */

type BreadcrumbLevel = "debug" | "info" | "warn" | "error";

interface Breadcrumb {
  message: string;
  level: BreadcrumbLevel;
  category: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

interface MonitoringConfig {
  enabled: boolean;
  environment: "development" | "staging" | "production";
  sampleRate: number; // 0-1, what fraction of errors to capture
}

const config: MonitoringConfig = {
  enabled: import.meta.env.PROD,
  environment: (import.meta.env.VITE_APP_ENV as MonitoringConfig["environment"]) || "development",
  sampleRate: 1.0,
};

const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 50;

export function addBreadcrumb(
  message: string,
  level: BreadcrumbLevel = "info",
  category = "app",
  data?: Record<string, unknown>,
) {
  breadcrumbs.push({ message, level, category, timestamp: Date.now(), data });
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!config.enabled) {
    console.error("[monitoring]", error.message, context || "");
    return;
  }
  
  // Only sample according to sampleRate
  if (Math.random() > config.sampleRate) {return;}
  
  // In production, this would send to a monitoring endpoint
  const payload = {
    error: { message: error.message, name: error.name, stack: error.stack },
    context,
    breadcrumbs: breadcrumbs.slice(-10),
    environment: config.environment,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
  
  // Log to console in all environments
  console.error("[monitoring] Error:", payload);
  
  // Store in sessionStorage for debugging (non-sensitive only)
  try {
    const stored = JSON.parse(sessionStorage.getItem("__monitor_errors") || "[]");
    stored.push({ message: error.message, timestamp: Date.now() });
    sessionStorage.setItem("__monitor_errors", JSON.stringify(stored.slice(-20)));
  } catch { /* ignore storage errors */ }
}

export function captureMessage(message: string, level: BreadcrumbLevel = "info") {
  addBreadcrumb(message, level, "message");
  if (level === "error" || level === "warn") {
    console[level](`[monitoring] ${message}`);
  }
}

// Initialize performance monitoring
export function initMonitoring(userId?: string) {
  if (!config.enabled) {return;}
  
  addBreadcrumb("Monitoring initialized", "info", "init", { 
    environment: config.environment,
    userId: userId?.slice(0, 8),
  });
  
  // Track page views
  const originalPushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    originalPushState(...args);
    addBreadcrumb("Navigation", "info", "navigation", { url: window.location.href });
  };
  
  // Global error handler
  window.addEventListener("error", (event) => {
    captureError(event.error || new Error(event.message), { 
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  
  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    captureError(error, { type: "unhandledrejection" });
  });
}
