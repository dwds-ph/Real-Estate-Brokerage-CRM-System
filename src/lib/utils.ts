import { type ClassValue, clsx } from "clsx";

// ─── Classnames ──────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── ID Generation ───────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure random ID.
 * Uses crypto.randomUUID() (available in all modern browsers and Node 19+).
 * Falls back to a timestamp-based ID if crypto is unavailable.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Formatting ──────────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatDate(timestamp: number): string {
  return dateFormatter.format(new Date(timestamp));
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(timestamp: number): string {
  return dateTimeFormatter.format(new Date(timestamp));
}

// ─── Relative Time ───────────────────────────────────────────────────────

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const MONTH = 2_592_000_000;

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < MONTH) return `${Math.floor(diff / DAY)}d ago`;
  return `${Math.floor(diff / MONTH)}mo ago`;
}

// ─── Status Color Helpers ────────────────────────────────────────────────

const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  viewed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  negotiating: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  closed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function getLeadStatusColor(status: string): string {
  return leadStatusColors[status] ?? "bg-gray-100 text-gray-800";
}

const scoreColors: Record<string, string> = {
  hot: "text-red-600 dark:text-red-400",
  warm: "text-yellow-600 dark:text-yellow-400",
  cold: "text-blue-600 dark:text-blue-400",
};

export function getScoreColor(score: string): string {
  return scoreColors[score] ?? "";
}

const listingStatusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "under-option": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  sold: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  rented: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "off-market": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function getListingStatusColor(status: string): string {
  return listingStatusColors[status] ?? "bg-gray-100 text-gray-800";
}

// ─── Generic Helpers ─────────────────────────────────────────────────────

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a percentage value (e.g., 0.03 → "3%").
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate a string with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/**
 * Safely parse JSON, returning a default value on failure.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
