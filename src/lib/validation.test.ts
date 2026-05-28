import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateNumber,
  validateObject,
  nameRule,
  priceRule,
  EMAIL_RULE,
  type FieldRule,
} from "./validation";

describe("validateRequired", () => {
  it("returns null for valid values", () => {
    expect(validateRequired("hello", "Name")).toBeNull();
    expect(validateRequired(0, "Count")).toBeNull();
    expect(validateRequired(false, "Flag")).toBeNull();
  });

  it("returns error for empty string", () => {
    expect(validateRequired("", "Name")).toBe("Name is required");
  });

  it("returns error for null/undefined", () => {
    expect(validateRequired(null, "Field")).toBe("Field is required");
    expect(validateRequired(undefined, "Field")).toBe("Field is required");
  });
});

describe("validateEmail", () => {
  it("returns null for valid emails", () => {
    expect(validateEmail("user@example.com")).toBeNull();
    expect(validateEmail("user+tag@example.co.uk")).toBeNull();
  });

  it("returns null for empty email (not required check)", () => {
    expect(validateEmail("")).toBeNull();
  });

  it("returns error for invalid format", () => {
    expect(validateEmail("not-an-email")).toBe("Invalid email address");
    expect(validateEmail("@domain.com")).toBe("Invalid email address");
  });
});

describe("validatePhone", () => {
  it("returns null for valid PH numbers", () => {
    expect(validatePhone("+639123456789")).toBeNull();
    expect(validatePhone("09123456789")).toBeNull();
  });

  it("returns null for empty phone", () => {
    expect(validatePhone("")).toBeNull();
  });

  it("returns error for invalid phone", () => {
    const result = validatePhone("123");
    expect(result).toContain("Invalid phone number");
  });
});

describe("validateNumber", () => {
  it("returns null for valid numbers", () => {
    expect(validateNumber(100, "Price")).toBeNull();
    expect(validateNumber(0, "Price")).toBeNull();
  });

  it("returns error for NaN", () => {
    expect(validateNumber(NaN, "Price")).toBe("Price must be a valid number");
  });

  it("returns error for non-number values", () => {
    expect(validateNumber("abc" as unknown as number, "Price")).toBe(
      "Price must be a valid number",
    );
  });

  it("enforces min/max bounds", () => {
    expect(validateNumber(5, "Count", { min: 10 })).toBe(
      "Count must be at least 10",
    );
    expect(validateNumber(100, "Count", { max: 50 })).toBe(
      "Count must be at most 50",
    );
  });
});

describe("validateObject", () => {
  it("returns valid for empty rules", () => {
    const result = validateObject({ name: "test" }, {});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates required fields", () => {
    const rules: Partial<Record<"name", FieldRule<unknown>>> = {
      name: { required: true },
    };
    expect(validateObject({ name: "" }, rules).valid).toBe(false);
    expect(validateObject({ name: "John" }, rules).valid).toBe(true);
  });

  it("validates min/max length for strings", () => {
    const rules: Partial<Record<"name", FieldRule<unknown>>> = {
      name: { minLength: 3, maxLength: 10 },
    };
    expect(validateObject({ name: "ab" }, rules).valid).toBe(false);
    expect(validateObject({ name: "abcdefghijk" }, rules).valid).toBe(false);
    expect(validateObject({ name: "John" }, rules).valid).toBe(true);
  });

  it("validates number constraints", () => {
    const rules: Partial<Record<"price", FieldRule<unknown>>> = {
      price: { min: 0, max: 1000 },
    };
    expect(validateObject({ price: -1 }, rules).valid).toBe(false);
    expect(validateObject({ price: 1001 }, rules).valid).toBe(false);
    expect(validateObject({ price: 500 }, rules).valid).toBe(true);
  });

  it("validates regex patterns", () => {
    const rules: Partial<Record<"code", FieldRule<unknown>>> = {
      code: { pattern: /^[A-Z]{3}-\d{3}$/ },
    };
    expect(validateObject({ code: "abc-123" }, rules).valid).toBe(false);
    expect(validateObject({ code: "ABC-123" }, rules).valid).toBe(true);
  });

  it("runs custom validators", () => {
    const rules: Partial<Record<"email", FieldRule<unknown>>> = {
      email: EMAIL_RULE as FieldRule<unknown>,
    };
    expect(validateObject({ email: "bad" }, rules).valid).toBe(false);
    expect(validateObject({ email: "a@b.com" }, rules).valid).toBe(true);
  });

  it("collects all errors, not just first", () => {
    const rules: Partial<Record<"a" | "b", FieldRule<unknown>>> = {
      a: { required: true },
      b: { required: true },
    };
    const result = validateObject({ a: "", b: "" }, rules);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

describe("nameRule", () => {
  it("creates a rule with defaults", () => {
    const rule = nameRule();
    expect(rule.required).toBe(true);
    expect(rule.minLength).toBe(2);
    expect(rule.maxLength).toBe(200);
  });
});

describe("priceRule", () => {
  it("creates a price rule with bounds", () => {
    const rule = priceRule();
    expect(rule.required).toBe(true);
    expect(rule.min).toBe(0);
    expect(rule.max).toBe(1_000_000_000);
  });
});
