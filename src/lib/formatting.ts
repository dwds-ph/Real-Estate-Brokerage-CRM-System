/**
 * PH Locale-Aware Formatting Utilities
 *
 * Provides Filipinio (fil-PH / en-PH) locale-aware formatting for
 * currency, dates, numbers, number words (check-writing), and abbreviations.
 *
 * Covers P28.7 (Locale-aware formatting) and P28.8 (PH-specific number formatting).
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** Duck-typed Firestore Timestamp (or any object with .toDate()) */
interface FirestoreTimestampLike {
  toDate(): Date;
}

type DateLike = Date | FirestoreTimestampLike | string | number | null | undefined;

/** Options for formatDatePH */
interface FormatDateOptions {
  style?: "full" | "long" | "medium" | "short";
}

/** Options for formatNumberPH */
interface FormatNumberOptions {
  style?: "decimal" | "percent";
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalise a DateLike value into a Date object (or null).
 */
function toDate(value: DateLike): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // Duck-type Firestore Timestamp / any object with .toDate()
  if (typeof (value as FirestoreTimestampLike).toDate === "function") {
    const d = (value as FirestoreTimestampLike).toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Safely coerce a nullish value to a number, returning fallback if needed.
 */
function coerceNumber(value: number | null | undefined, fallback: number): number {
  if (value == null) return fallback;
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return value;
}

// ─── 1. Currency  ───────────────────────────────────────────────────────────

const phpFormatter = new Intl.NumberFormat("fil-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a number as PHP currency using `fil-PH` locale.
 *
 * Examples:
 *   1234567.89   →  "₱1,234,567.89"
 *   -500         →  "-₱500.00"
 *   0            →  "₱0.00"
 *   null/undefined → "₱0.00"
 */
export function formatCurrencyPHP(amount: number | null | undefined): string {
  const value = coerceNumber(amount, 0);
  return phpFormatter.format(value);
}

// ─── 2. Date  ───────────────────────────────────────────────────────────────

const dateStyleMap: Record<
  NonNullable<FormatDateOptions["style"]>,
  Intl.DateTimeFormatOptions
> = {
  full: { dateStyle: "full" },
  long: { dateStyle: "long" },
  medium: { dateStyle: "medium" },
  short: { dateStyle: "short" },
};

/**
 * Format a date in Filipino locale style.
 *
 * Examples (style = "full"):
 *   new Date(2026, 0, 15)  →  "Enero 15, 2026"  (fil-PH)
 *   new Date(2026, 0, 15)  →  "January 15, 2026" (en-PH fallback)
 *
 * Accepts Date, Firestore Timestamp (.toDate()), string, number, null, undefined.
 * Defaults to `medium` style.
 * Returns empty string for null / undefined input.
 */
export function formatDatePH(
  date: DateLike,
  options?: FormatDateOptions,
): string {
  const d = toDate(date);
  if (!d) return "";

  const style = options?.style ?? "medium";
  const dateOpts = dateStyleMap[style];

  try {
    return new Intl.DateTimeFormat("fil-PH", dateOpts).format(d);
  } catch {
    // Fallback to en-PH if fil-PH locale is unavailable
    return new Intl.DateTimeFormat("en-PH", dateOpts).format(d);
  }
}

// ─── 3. Number  ─────────────────────────────────────────────────────────────

/**
 * Format a number in PH locale.
 *
 * Examples:
 *   1234567.89          →  "1,234,567.89"
 *   0.1234 (percent)    →  "12%"       (rounded to default fraction digits)
 *   0.1234 (pct, 2 frac)→  "12.34%"
 *   null                →  "0"
 */
export function formatNumberPH(
  value: number | null | undefined,
  options?: FormatNumberOptions,
): string {
  const num = coerceNumber(value, 0);
  const style = options?.style ?? "decimal";

  const fmt = new Intl.NumberFormat("fil-PH", {
    style,
    ...(style === "percent" && { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    ...(options?.minimumFractionDigits != null && {
      minimumFractionDigits: options.minimumFractionDigits,
    }),
    ...(options?.maximumFractionDigits != null && {
      maximumFractionDigits: options.maximumFractionDigits,
    }),
  });

  return fmt.format(num);
}

// ─── 4. Number In Words (Check-writing)  ────────────────────────────────────

// Word maps (English — standard for PH formal documents)
const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];

const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
  "eighty", "ninety",
];

const SCALES = ["", "thousand", "million", "billion"];

const SCALE_VALUES = [1, 1_000, 1_000_000, 1_000_000_000] as const;

/**
 * Convert an integer (0–999) to words.
 */
function hundredsToWords(n: number): string {
  if (n === 0) return "";

  const parts: string[] = [];

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} hundred`);
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]);
    } else {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      const tenWord = TENS[ten];
      parts.push(one > 0 ? `${tenWord}-${ONES[one]}` : tenWord);
    }
  }

  return parts.join(" ");
}

/**
 * Convert a positive integer to English words (up to billions).
 */
function integerToWords(n: number): string {
  if (n === 0) return "zero";

  const parts: string[] = [];

  for (let i = SCALES.length - 1; i >= 0; i--) {
    const scaleVal = SCALE_VALUES[i];
    const unit = Math.floor(n / scaleVal);

    if (unit > 0) {
      const words = hundredsToWords(unit);
      parts.push(SCALES[i] ? `${words} ${SCALES[i]}` : words);
      n -= unit * scaleVal;
    }
  }

  return parts.join(" ");
}

/**
 * Write a number in English words following Philippine formal document /
 * check-writing convention.
 *
 * Examples:
 *   1234567.89  →  "one million two hundred thirty-four thousand
 *                   five hundred sixty-seven and 89/100"
 *   0           →  "zero"
 *   1           →  "one"
 *   500.50      →  "five hundred and 50/100"
 *   1000000000  →  "one billion"
 *
 * Supports values up to 999,999,999,999.99.
 */
export function formatNumberInWords(value: number): string {
  // Handle NaN
  if (typeof value !== "number" || Number.isNaN(value)) return "zero";

  // Handle negative
  if (value < 0) return `negative ${formatNumberInWords(-value)}`;

  // Handle zero
  if (value === 0) return "zero";

  // Split integer and fractional parts
  const integerPart = Math.floor(value);
  const fractionalPart = Math.round((value - integerPart) * 100);

  // Build result
  const words = integerToWords(integerPart);

  if (fractionalPart > 0) {
    return `${words} and ${String(fractionalPart).padStart(2, "0")}/100`;
  }

  return words;
}

// ─── 5. Number Abbreviation  ────────────────────────────────────────────────

/**
 * Abbreviate a number to a short human-readable form (K, M, B).
 *
 * Examples:
 *   1000       →  "1K"
 *   1500000    →  "1.5M"
 *   2500000000 →  "2.5B"
 *   999        →  "999"
 *   null       →  "0"
 */
export function abbreviateNumber(value: number | null | undefined): string {
  const num = coerceNumber(value, 0);

  if (Math.abs(num) >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return `${parseFloat(val.toFixed(1))}B`;
  }
  if (Math.abs(num) >= 1_000_000) {
    const val = num / 1_000_000;
    return `${parseFloat(val.toFixed(1))}M`;
  }
  if (Math.abs(num) >= 1_000) {
    const val = num / 1_000;
    return `${parseFloat(val.toFixed(1))}K`;
  }

  return String(num);
}
