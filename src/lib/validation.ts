/**
 * Shared validation utilities for consistent input validation across the codebase.
 * Services, hooks, and forms should use these patterns instead of inline checks.
 */

// ─── Validation result types ─────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  fields: Record<string, unknown>;
}

// ─── Validated field types ───────────────────────────────────────────

export interface FieldRule<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null; // returns error message or null
}

// ─── Validators ────────────────────────────────────────────────────

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null) {return `${fieldName} is required`;}
  if (typeof value === "string" && value.trim().length === 0)
    {return `${fieldName} is required`;}
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) {return null;} // not required, use validateRequired separately
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {return "Invalid email address";}
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) {return null;}
  // Philippine mobile: +63 or 09 prefix
  const phoneRegex = /^(\+63|0)[0-9]{10}$/;
  if (!phoneRegex.test(phone.replace(/[\s-]/g, "")))
    {return "Invalid phone number (use +63 or 09 format)";}
  return null;
}

export function validateUrl(url: string): string | null {
  if (!url) {return null;}
  try {
    new URL(url);
    return null;
  } catch {
    return "Invalid URL";
  }
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  rules?: Pick<FieldRule<number>, "min" | "max">,
): string | null {
  if (typeof value !== "number" || isNaN(value)) {return `${fieldName} must be a valid number`;}
  if (rules?.min !== undefined && value < rules.min)
    {return `${fieldName} must be at least ${rules.min}`;}
  if (rules?.max !== undefined && value > rules.max)
    {return `${fieldName} must be at most ${rules.max}`;}
  return null;
}

export function validateDate(timestamp: number, fieldName: string): string | null {
  if (typeof timestamp !== "number" || isNaN(timestamp) || timestamp <= 0)
    {return `${fieldName} must be a valid date`;}
  return null;
}

// ─── Object validation ─────────────────────────────────────────────

/**
 * Validate an object against a set of field rules.
 * Returns all errors found, not just the first one.
 */
export function validateObject<T extends Record<string, unknown>>(
  obj: T,
  rules: Partial<Record<keyof T, FieldRule<unknown>>>,
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    if (!rule) {continue;}
    const value = obj[field];

    // Required check
    if (rule.required) {
      const err = validateRequired(value, field);
      if (err) {
        errors.push({ field, message: err });
        continue; // skip other checks if missing
      }
    }

    if (value === undefined || value === null) {continue;}

    // String rules
    if (typeof value === "string") {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.minLength} characters`,
        });
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field} must be at most ${rule.maxLength} characters`,
        });
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} has an invalid format`,
        });
      }
    }

    // Number rules
    if (typeof value === "number") {
      const numErr = validateNumber(value, field, {
        min: rule.min as number | undefined,
        max: rule.max as number | undefined,
      });
      if (numErr) {errors.push({ field, message: numErr });}
    }

    // Custom validation
    if (rule.custom) {
      const customErr = rule.custom(value);
      if (customErr) {errors.push({ field, message: customErr });}
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fields: { ...obj },
  };
}

// ─── Common validation schemas ───────────────────────────────────────
// Reusable validation rules for common entity fields.

export const EMAIL_RULE: FieldRule<string> = {
  custom: (v: string) => validateEmail(v),
};

export const PHONE_RULE: FieldRule<string> = {
  custom: (v: string) => validatePhone(v),
};

export const URL_RULE: FieldRule<string> = {
  custom: (v: string) => validateUrl(v),
};

export function nameRule(
  _fieldName: string = "Name",
  minLength: number = 2,
  maxLength: number = 200,
): FieldRule<string> {
  return { required: true, minLength, maxLength };
}

export function priceRule(_fieldName: string = "Price"): FieldRule<number> {
  return { required: true, min: 0, max: 1_000_000_000 };
}
