import { describe, it, expect, vi } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
  getLeadStatusColor,
  getScoreColor,
  getListingStatusColor,
  generateId,
} from "@/lib/utils";

// Mock firebase/firestore for generateId
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ id: "generated-mock-id-12345" })),
}));

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    const show = false;
    expect(cn("base", show && "hidden", "visible")).toBe("base visible");
  });

  it("handles multiple conditional classes", () => {
    const active = true;
    expect(cn("btn", active && "btn-primary", !active && "btn-secondary")).toBe("btn btn-primary");
  });

  it("handles empty/falsy values", () => {
    expect(cn("a", undefined, null, false, "b")).toBe("a b");
  });
});

describe("formatCurrency", () => {
  it("formats PHP currency with commas", () => {
    const result = formatCurrency(1500000);
    expect(result).toContain("1,500,000");
    expect(result).toContain("₱");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });

  it("handles decimals with two fraction digits", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1,234.56");
  });

  it("rounds to 2 decimal places max", () => {
    const result = formatCurrency(99.999);
    // Intl.NumberFormat with maximumFractionDigits:2 will round to 100.00
    expect(result).toContain("100");
  });

  it("handles negative amounts", () => {
    const result = formatCurrency(-5000);
    expect(result).toContain("-");
    expect(result).toContain("5,000");
  });

  it("handles large numbers", () => {
    const result = formatCurrency(9999999999);
    expect(result).toContain("9,999,999,999");
  });
});

describe("formatDate", () => {
  it("formats a timestamp with month, day, year", () => {
    const date = new Date(2025, 0, 15).getTime();
    const result = formatDate(date);
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });

  it("formats different months correctly", () => {
    expect(formatDate(new Date(2025, 11, 25).getTime())).toContain("Dec");
    expect(formatDate(new Date(2025, 6, 4).getTime())).toContain("Jul");
  });

  it("handles single-digit days", () => {
    const result = formatDate(new Date(2025, 2, 5).getTime());
    expect(result).toContain("5");
  });

  it("handles epoch zero", () => {
    // Should not throw; returns a formatted date for 1970
    expect(() => formatDate(0)).not.toThrow();
  });
});

describe("formatDateTime", () => {
  it("includes date and time in output", () => {
    const date = new Date(2025, 5, 15, 14, 30).getTime();
    const result = formatDateTime(date);
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2025");
    expect(result).toContain("02");
    expect(result).toContain("30");
    expect(result).toContain("PM");
  });

  it("formats morning time with AM/PM equivalent", () => {
    const date = new Date(2025, 0, 1, 9, 5).getTime();
    const result = formatDateTime(date);
    expect(result).toContain("09");
    expect(result).toContain("05");
  });
});

describe("timeAgo", () => {
  it('returns "just now" for recent timestamps', () => {
    expect(timeAgo(Date.now())).toBe("just now");
  });

  it("returns minutes for recent times", () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(timeAgo(fiveMinAgo)).toMatch(/\d+m/);
  });

  it("returns hours for older times", () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    expect(timeAgo(twoHoursAgo)).toMatch(/\d+h/);
  });

  it("returns days for times > 24h", () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    expect(timeAgo(threeDaysAgo)).toMatch(/\d+d/);
  });

  it("returns months for times > 30 days", () => {
    const twoMonthsAgo = Date.now() - 61 * 24 * 60 * 60 * 1000;
    expect(timeAgo(twoMonthsAgo)).toMatch(/\d+mo/);
  });

  it("returns 1m ago for exactly 1 minute", () => {
    const oneMinAgo = Date.now() - 60 * 1000;
    expect(timeAgo(oneMinAgo)).toBe("1m ago");
  });

  it("returns 1h ago for exactly 1 hour", () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    expect(timeAgo(oneHourAgo)).toBe("1h ago");
  });

  it("returns 1d ago for exactly 1 day", () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    expect(timeAgo(oneDayAgo)).toBe("1d ago");
  });
});

describe("generateId", () => {
  it("returns a non-empty string id", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("getLeadStatusColor", () => {
  it("returns correct color for each status", () => {
    expect(getLeadStatusColor("new")).toContain("blue");
    expect(getLeadStatusColor("contacted")).toContain("yellow");
    expect(getLeadStatusColor("viewed")).toContain("purple");
    expect(getLeadStatusColor("negotiating")).toContain("orange");
    expect(getLeadStatusColor("closed")).toContain("green");
    expect(getLeadStatusColor("lost")).toContain("red");
  });

  it("returns default gray for unknown status", () => {
    const result = getLeadStatusColor("unknown-status");
    expect(result).toContain("gray");
  });

  it("returns correct dark mode classes", () => {
    const result = getLeadStatusColor("new");
    expect(result).toContain("dark:");
  });

  it("handles empty string", () => {
    const result = getLeadStatusColor("");
    expect(result).toContain("gray");
  });
});

describe("getScoreColor", () => {
  it("returns correct color for each score", () => {
    expect(getScoreColor("hot")).toContain("red");
    expect(getScoreColor("warm")).toContain("yellow");
    expect(getScoreColor("cold")).toContain("blue");
  });

  it("returns empty string for unknown score", () => {
    expect(getScoreColor("unknown")).toBe("");
  });

  it("returns empty string for empty score", () => {
    expect(getScoreColor("")).toBe("");
  });
});

describe("getListingStatusColor", () => {
  it("returns correct color for each status", () => {
    expect(getListingStatusColor("available")).toContain("green");
    expect(getListingStatusColor("under-option")).toContain("yellow");
    expect(getListingStatusColor("sold")).toContain("gray");
    expect(getListingStatusColor("rented")).toContain("blue");
    expect(getListingStatusColor("off-market")).toContain("red");
  });

  it("returns default gray for unknown status", () => {
    const result = getListingStatusColor("pending");
    expect(result).toContain("gray");
  });

  it("returns dark mode classes", () => {
    const result = getListingStatusColor("available");
    expect(result).toContain("dark:");
  });
});
