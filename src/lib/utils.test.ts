import { describe, it, expect, vi, afterEach } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
  generateId,
  getLeadStatusColor,
  getScoreColor,
  getListingStatusColor,
  clamp,
  formatPercent,
  truncate,
  safeJsonParse,
} from "./utils";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    const show = false;
    expect(cn("base", show && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined values", () => {
    expect(cn("a", undefined, "b")).toBe("a b");
  });
});

describe("generateId", () => {
  it("returns a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("produces unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("falls back when crypto.randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", { randomUUID: undefined });
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    expect(id).toMatch(/^id_\d+/);
  });
});

describe("formatCurrency", () => {
  it("formats PHP currency", () => {
    const result = formatCurrency(1500000);
    expect(result).toContain("1,500,000");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });

  it("handles decimals", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1,234.56");
  });
});

describe("formatDate", () => {
  it("formats a timestamp", () => {
    const date = new Date(2025, 0, 15).getTime();
    const result = formatDate(date);
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });
});

describe("formatDateTime", () => {
  it("includes time in output", () => {
    const date = new Date(2025, 5, 15, 14, 30).getTime();
    const result = formatDateTime(date);
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2025");
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

  it("returns days for older times", () => {
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    expect(timeAgo(fiveDaysAgo)).toMatch(/\d+d/);
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

  it("returns gray fallback for unknown status", () => {
    expect(getLeadStatusColor("unknown")).toContain("gray");
  });
});

describe("getScoreColor", () => {
  it("returns correct color for each score", () => {
    expect(getScoreColor("hot")).toContain("red");
    expect(getScoreColor("warm")).toContain("yellow");
    expect(getScoreColor("cold")).toContain("blue");
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
});

describe("clamp", () => {
  it("clamps values below minimum", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it("clamps values above maximum", () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it("returns the value when within range", () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

describe("formatPercent", () => {
  it("formats a decimal as percentage", () => {
    expect(formatPercent(0.03)).toBe("3%");
    expect(formatPercent(0.125, 1)).toBe("12.5%");
  });
});

describe("truncate", () => {
  it("returns string unchanged if shorter than max", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates with ellipsis", () => {
    expect(truncate("hello world this is long", 10)).toBe("hello worl...");
  });
});

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it("returns fallback for invalid JSON", () => {
    expect(safeJsonParse("not json", { fallback: true })).toEqual({
      fallback: true,
    });
  });
});
