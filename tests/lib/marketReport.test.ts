import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  computeMarketReport,
  formatCurrency,
  formatCompactCurrency,
  getPropertyTypeColor,
  getStatusColor,
} from "@/lib/marketReport";
import type { Listing, Deal } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────

const NOW = 1_700_000_000_000; // 2023-11-14T20:53:20.000Z (fixed timestamp)
const DAY_MS = 1000 * 60 * 60 * 24;

function listing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "l-001",
    title: "Test Property",
    description: "A test listing",
    price: 5_000_000,
    location: { address: "123 Main St", city: "Manila", province: "NCR" },
    propertyDetails: { floorArea: 100, lotArea: 200 },
    propertyType: "condo",
    floodRisk: "low",
    amenities: ["pool"],
    status: "available",
    assignedTo: "agent-1",
    createdBy: "agent-1",
    media: [],
    views: 0,
    inquiries: 0,
    createdAt: NOW - 30 * DAY_MS,
    updatedAt: NOW - 5 * DAY_MS,
    ...overrides,
  };
}

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "d-001",
    clientName: "Juan Dela Cruz",
    clientContact: "09170000000",
    dealPrice: 5_000_000,
    status: "closed",
    createdBy: "agent-1",
    createdAt: NOW - 30 * DAY_MS,
    updatedAt: NOW - 10 * DAY_MS,
    ...overrides,
  };
}

// ─── System time fixture ──────────────────────────────────────────────

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

// =====================================================================
//  computeMarketReport
// =====================================================================

describe("computeMarketReport", () => {
  // ── Empty data ────────────────────────────────────────────────────

  describe("with empty data", () => {
    it("returns zeroed overview when listings and deals are empty", () => {
      const report = computeMarketReport([], []);
      expect(report.overview).toEqual({
        totalListings: 0,
        totalActive: 0,
        totalSold: 0,
        totalVolume: 0,
        averagePrice: 0,
        medianPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        averagePricePerSqm: 0,
        averageDaysOnMarket: 0,
      });
    });

    it("returns empty breakdowns when listings are empty", () => {
      const report = computeMarketReport([], []);
      expect(report.propertyTypeBreakdown).toEqual([]);
      expect(report.statusBreakdown).toEqual([]);
      expect(report.locationData).toEqual([]);
      expect(report.priceTrends).toEqual([]);
    });

    it("sets generatedAt to current time", () => {
      const report = computeMarketReport([], []);
      expect(report.generatedAt).toBe(NOW);
    });
  });

  // ── Overview ──────────────────────────────────────────────────────

  describe("overview", () => {
    it("counts totalListings from listings array", () => {
      const listings = [listing(), listing(), listing()];
      const report = computeMarketReport(listings, []);
      expect(report.overview.totalListings).toBe(3);
    });

    it("counts active listings (available + under-option)", () => {
      const listings = [
        listing({ status: "available" }),
        listing({ status: "under-option" }),
        listing({ status: "sold" }),
        listing({ status: "rented" }),
        listing({ status: "off-market" }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.overview.totalActive).toBe(2);
    });

    it("counts sold listings (sold + rented)", () => {
      const listings = [
        listing({ status: "sold" }),
        listing({ status: "rented" }),
        listing({ status: "available" }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.overview.totalSold).toBe(2);
    });

    it("computes totalVolume from closed deals only", () => {
      const deals = [
        deal({ dealPrice: 3_000_000, status: "closed" }),
        deal({ dealPrice: 2_000_000, status: "closed" }),
        deal({ dealPrice: 1_000_000, status: "pending" }),
        deal({ dealPrice: 4_000_000, status: "cancelled" }),
      ];
      const report = computeMarketReport([], deals);
      expect(report.overview.totalVolume).toBe(5_000_000);
    });

    it("totalVolume is 0 when no closed deals", () => {
      const deals = [
        deal({ status: "pending" }),
        deal({ status: "cancelled" }),
      ];
      const report = computeMarketReport([], deals);
      expect(report.overview.totalVolume).toBe(0);
    });

    it("computes averagePrice from listings with price > 0", () => {
      const listings = [
        listing({ price: 2_000_000 }),
        listing({ price: 4_000_000 }),
        listing({ price: 6_000_000 }),
        listing({ price: 0 }), // should be excluded
      ];
      const report = computeMarketReport(listings, []);
      expect(report.overview.averagePrice).toBe(4_000_000); // (2+4+6)/3
    });

    it("averagePrice is 0 when no listings have price > 0", () => {
      const listings = [listing({ price: 0 }), listing({ price: 0 })];
      const report = computeMarketReport(listings, []);
      expect(report.overview.averagePrice).toBe(0);
    });

    it("computes medianPrice with odd count", () => {
      const listings = [
        listing({ price: 1_000_000 }),
        listing({ price: 3_000_000 }),
        listing({ price: 2_000_000 }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.overview.medianPrice).toBe(2_000_000);
    });

    it("computes medianPrice with even count", () => {
      const listings = [
        listing({ price: 1_000_000 }),
        listing({ price: 4_000_000 }),
        listing({ price: 2_000_000 }),
        listing({ price: 3_000_000 }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.overview.medianPrice).toBe(2_500_000); // (2M + 3M) / 2
    });

    it("medianPrice is 0 when no listings have price > 0", () => {
      const report = computeMarketReport([listing({ price: 0 })], []);
      expect(report.overview.medianPrice).toBe(0);
    });

    it("sets minPrice and maxPrice correctly", () => {
      const listings = [
        listing({ price: 5_000_000 }),
        listing({ price: 1_000_000 }),
        listing({ price: 10_000_000 }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.overview.minPrice).toBe(1_000_000);
      expect(report.overview.maxPrice).toBe(10_000_000);
    });

    it("minPrice and maxPrice are 0 when no prices", () => {
      const report = computeMarketReport([], []);
      expect(report.overview.minPrice).toBe(0);
      expect(report.overview.maxPrice).toBe(0);
    });

    it("computes averagePricePerSqm using floorArea", () => {
      const listings = [
        listing({
          price: 1_000_000,
          propertyDetails: { floorArea: 50, lotArea: 200 },
        }),
        listing({
          price: 3_000_000,
          propertyDetails: { floorArea: 100, lotArea: 200 },
        }),
      ];
      const report = computeMarketReport(listings, []);
      // 1000000/50 = 20000, 3000000/100 = 30000 => avg = 25000
      expect(report.overview.averagePricePerSqm).toBe(25_000);
    });

    it("falls back to lotArea when floorArea is missing", () => {
      const listings = [
        listing({
          price: 1_000_000,
          propertyDetails: { floorArea: undefined, lotArea: 50 },
        }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.overview.averagePricePerSqm).toBe(20_000); // 1M / 50
    });

    it("skips listings without either floorArea or lotArea for price per sqm", () => {
      const listings = [
        listing({
          price: 1_000_000,
          propertyDetails: { floorArea: 100, lotArea: 200 },
        }),
        listing({ price: 5_000_000, propertyDetails: {} }),
        listing({ price: 0, propertyDetails: { floorArea: 100 } }), // price 0 excluded
      ];
      const report = computeMarketReport(listings, []);
      expect(report.overview.averagePricePerSqm).toBe(10_000); // only 1st listing: 1M/100
    });

    it("averagePricePerSqm is 0 when no qualifying listings", () => {
      const listings = [
        listing({ price: 0, propertyDetails: { floorArea: 100 } }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.overview.averagePricePerSqm).toBe(0);
    });

    it("computes averageDaysOnMarket from createdAt and updatedAt", () => {
      const listings = [
        listing({ createdAt: NOW - 10 * DAY_MS, updatedAt: NOW }),
        listing({ createdAt: NOW - 20 * DAY_MS, updatedAt: NOW - 5 * DAY_MS }),
      ];
      const report = computeMarketReport(listings, []);
      // Listing 1: floor((NOW - (NOW-10d)) / DAY_MS) = 10 days
      // Listing 2: floor(((NOW-5d) - (NOW-20d)) / DAY_MS) = floor(15d / DAY_MS) = 15 days
      // Average: (10+15)/2 = 12.5 -> round to 13
      expect(report.overview.averageDaysOnMarket).toBe(13);
    });

    it("averageDaysOnMarket falls back to now when updatedAt is not set", () => {
      const listings = [
        listing({
          createdAt: NOW - 10 * DAY_MS,
          updatedAt: undefined as unknown as number,
        }),
      ];
      const report = computeMarketReport(listings, []);
      // days = floor((NOW - (NOW-10d)) / DAY_MS) = floor(10d / DAY_MS) = 10
      expect(report.overview.averageDaysOnMarket).toBe(10);
    });

    it("averageDaysOnMarket is 0 when listings is empty", () => {
      const report = computeMarketReport([], []);
      expect(report.overview.averageDaysOnMarket).toBe(0);
    });
  });

  // ── Property Type Breakdown ───────────────────────────────────────

  describe("propertyTypeBreakdown", () => {
    it("groups listings by propertyType", () => {
      const listings = [
        listing({ propertyType: "condo", price: 3_000_000 }),
        listing({ propertyType: "condo", price: 5_000_000 }),
        listing({ propertyType: "house-lot", price: 8_000_000 }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.propertyTypeBreakdown).toHaveLength(2);

      const condo = report.propertyTypeBreakdown.find(
        (t) => t.type === "condo",
      )!;
      expect(condo.count).toBe(2);
      expect(condo.percentage).toBe(67); // round(2/3*100)=67
      expect(condo.averagePrice).toBe(4_000_000); // (3M+5M)/2
      expect(condo.label).toBe("Condo");

      const houseLot = report.propertyTypeBreakdown.find(
        (t) => t.type === "house-lot",
      )!;
      expect(houseLot.count).toBe(1);
      expect(houseLot.percentage).toBe(33);
      expect(houseLot.averagePrice).toBe(8_000_000);
      expect(houseLot.label).toBe("House & Lot");
    });

    it("filters out types with zero count", () => {
      const listings = [listing({ propertyType: "condo" })];
      const report = computeMarketReport(listings, []);
      const types = report.propertyTypeBreakdown.map((t) => t.type);
      expect(types).toEqual(["condo"]);
      expect(types).not.toContain("house-lot");
      expect(types).not.toContain("lot-only");
      expect(types).not.toContain("commercial");
      expect(types).not.toContain("foreclosed");
    });

    it("returns empty array when no listings", () => {
      const report = computeMarketReport([], []);
      expect(report.propertyTypeBreakdown).toEqual([]);
    });

    it("uses correct labels for all property types", () => {
      const listings = (
        ["condo", "house-lot", "lot-only", "commercial", "foreclosed"] as const
      ).map((t) => listing({ propertyType: t }));
      const report = computeMarketReport(listings, []);
      const labels = report.propertyTypeBreakdown.map((t) => t.label);
      expect(labels).toContain("Condo");
      expect(labels).toContain("House & Lot");
      expect(labels).toContain("Lot Only");
      expect(labels).toContain("Commercial");
      expect(labels).toContain("Foreclosed");
    });

    it("averagePrice is 0 for a type whose listings all have price 0", () => {
      const listings = [
        listing({ propertyType: "condo", price: 0 }),
        listing({ propertyType: "condo", price: 0 }),
      ];
      const report = computeMarketReport(listings, []);
      const condo = report.propertyTypeBreakdown.find(
        (t) => t.type === "condo",
      )!;
      expect(condo.count).toBe(2);
      expect(condo.averagePrice).toBe(0);
    });
  });

  // ── Status Breakdown ──────────────────────────────────────────────

  describe("statusBreakdown", () => {
    it("groups listings by status", () => {
      const listings = [
        listing({ status: "available" }),
        listing({ status: "available" }),
        listing({ status: "sold" }),
        listing({ status: "under-option" }),
      ];
      const report = computeMarketReport(listings, []);
      const available = report.statusBreakdown.find(
        (s) => s.status === "available",
      )!;
      expect(available.count).toBe(2);
      expect(available.percentage).toBe(50);
      expect(available.label).toBe("Available");

      const sold = report.statusBreakdown.find((s) => s.status === "sold")!;
      expect(sold.count).toBe(1);
      expect(sold.percentage).toBe(25);
      expect(sold.label).toBe("Sold");
    });

    it("filters out statuses with zero count", () => {
      const listings = [listing({ status: "available" })];
      const report = computeMarketReport(listings, []);
      const statuses = report.statusBreakdown.map((s) => s.status);
      expect(statuses).toEqual(["available"]);
      expect(statuses).not.toContain("under-option");
      expect(statuses).not.toContain("sold");
      expect(statuses).not.toContain("rented");
      expect(statuses).not.toContain("off-market");
    });

    it("returns empty array when no listings", () => {
      const report = computeMarketReport([], []);
      expect(report.statusBreakdown).toEqual([]);
    });
  });

  // ── Location Data ─────────────────────────────────────────────────

  describe("locationData", () => {
    it("groups listings by city", () => {
      const listings = [
        listing({
          location: { address: "A", city: "Manila", province: "NCR" },
          price: 5_000_000,
        }),
        listing({
          location: { address: "B", city: "Manila", province: "NCR" },
          price: 3_000_000,
        }),
        listing({
          location: { address: "C", city: "Cebu", province: "Cebu" },
          price: 8_000_000,
        }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.locationData).toHaveLength(2);

      const manila = report.locationData.find((l) => l.city === "Manila")!;
      expect(manila.count).toBe(2);
      expect(manila.averagePrice).toBe(4_000_000);
      expect(manila.totalVolume).toBe(8_000_000);
      expect(manila.province).toBe("NCR");

      const cebu = report.locationData.find((l) => l.city === "Cebu")!;
      expect(cebu.count).toBe(1);
      expect(cebu.averagePrice).toBe(8_000_000);
      expect(cebu.totalVolume).toBe(8_000_000);
      expect(cebu.province).toBe("Cebu");
    });

    it("uses 'Unknown' when city is empty", () => {
      const listings = [
        listing({
          location: { address: "X", city: "", province: "Province" },
        }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.locationData).toHaveLength(1);
      expect(report.locationData[0].city).toBe("Unknown");
      expect(report.locationData[0].province).toBe("Province");
    });

    it("sorts locations by count descending", () => {
      const listings = [
        listing({
          location: { address: "A", city: "Small", province: "" },
          price: 1,
        }),
        listing({
          location: { address: "B", city: "Large", province: "" },
          price: 1,
        }),
        listing({
          location: { address: "C", city: "Large", province: "" },
          price: 1,
        }),
        listing({
          location: { address: "D", city: "Medium", province: "" },
          price: 1,
        }),
        listing({
          location: { address: "E", city: "Medium", province: "" },
          price: 1,
        }),
      ];
      const report = computeMarketReport(listings, []);
      expect(report.locationData.map((l) => l.city)).toEqual([
        "Large",
        "Medium",
        "Small",
      ]);
    });
  });

  // ── Price Trends (Monthly) ────────────────────────────────────────

  describe("priceTrends", () => {
    it("groups listings by month of createdAt", () => {
      // January
      const jan1 = listing({
        createdAt: new Date("2023-01-05").getTime(),
        price: 4_000_000,
      });
      const jan2 = listing({
        createdAt: new Date("2023-01-20").getTime(),
        price: 6_000_000,
      });
      // February
      const feb = listing({
        createdAt: new Date("2023-02-10").getTime(),
        price: 5_000_000,
      });

      const report = computeMarketReport([jan1, jan2, feb], []);
      expect(report.priceTrends).toHaveLength(2);

      const janTrend = report.priceTrends.find((t) => t.month === "2023-01")!;
      expect(janTrend.listingCount).toBe(2);
      expect(janTrend.averagePrice).toBe(5_000_000); // (4M+6M)/2
      expect(janTrend.medianPrice).toBe(5_000_000);
      expect(janTrend.totalVolume).toBe(10_000_000);
      expect(janTrend.yearMonth).toBe(202301);

      const febTrend = report.priceTrends.find((t) => t.month === "2023-02")!;
      expect(febTrend.listingCount).toBe(1);
      expect(febTrend.averagePrice).toBe(5_000_000);
      expect(febTrend.medianPrice).toBe(5_000_000);
      expect(febTrend.totalVolume).toBe(5_000_000);
      expect(febTrend.yearMonth).toBe(202302);
    });

    it("includes closed deal prices in monthly trends", () => {
      const listing1 = listing({
        createdAt: new Date("2023-01-05").getTime(),
        price: 4_000_000,
      });
      const deal1 = deal({
        dealPrice: 3_000_000,
        status: "closed",
        createdAt: new Date("2023-01-15").getTime(),
      });

      const report = computeMarketReport([listing1], [deal1]);
      const janTrend = report.priceTrends.find((t) => t.month === "2023-01")!;
      expect(janTrend.listingCount).toBe(2); // listing + deal
      expect(janTrend.averagePrice).toBe(3_500_000); // (4M+3M)/2
      expect(janTrend.totalVolume).toBe(7_000_000);
    });

    it("ignores non-closed deals in trends", () => {
      const deal1 = deal({
        dealPrice: 10_000_000,
        status: "pending",
        createdAt: new Date("2023-01-15").getTime(),
      });
      const report = computeMarketReport([], [deal1]);
      expect(report.priceTrends).toHaveLength(0);
    });

    it("computes median correctly for even count in a month", () => {
      const listings = [
        listing({
          createdAt: new Date("2023-03-01").getTime(),
          price: 2_000_000,
        }),
        listing({
          createdAt: new Date("2023-03-15").getTime(),
          price: 4_000_000,
        }),
        listing({
          createdAt: new Date("2023-03-20").getTime(),
          price: 6_000_000,
        }),
        listing({
          createdAt: new Date("2023-03-25").getTime(),
          price: 8_000_000,
        }),
      ];
      const report = computeMarketReport(listings, []);
      const trend = report.priceTrends.find((t) => t.month === "2023-03")!;
      expect(trend.medianPrice).toBe(5_000_000); // (4M+6M)/2
    });

    it("sorts trends by yearMonth ascending", () => {
      const mar = listing({
        createdAt: new Date("2023-03-01").getTime(),
        price: 1,
      });
      const jan = listing({
        createdAt: new Date("2023-01-01").getTime(),
        price: 1,
      });
      const feb = listing({
        createdAt: new Date("2023-02-01").getTime(),
        price: 1,
      });
      const report = computeMarketReport([mar, jan, feb], []);
      expect(report.priceTrends.map((t) => t.month)).toEqual([
        "2023-01",
        "2023-02",
        "2023-03",
      ]);
    });

    it("returns empty array when no listings or closed deals", () => {
      const report = computeMarketReport([], []);
      expect(report.priceTrends).toEqual([]);
    });
  });

  // ── Full report structure ─────────────────────────────────────────

  it("returns all required top-level fields", () => {
    const report = computeMarketReport([listing()], [deal()]);
    expect(report).toHaveProperty("overview");
    expect(report).toHaveProperty("propertyTypeBreakdown");
    expect(report).toHaveProperty("statusBreakdown");
    expect(report).toHaveProperty("locationData");
    expect(report).toHaveProperty("priceTrends");
    expect(report).toHaveProperty("generatedAt");
  });

  it("generatedAt is a timestamp (number)", () => {
    const report = computeMarketReport([listing()], [deal()]);
    expect(typeof report.generatedAt).toBe("number");
    expect(report.generatedAt).toBeGreaterThan(0);
  });
});

// =====================================================================
//  formatCurrency
// =====================================================================

describe("formatCurrency", () => {
  it("formats values >= 1,000,000 as ₱X.XM", () => {
    expect(formatCurrency(1_000_000)).toBe("₱1.0M");
    expect(formatCurrency(1_500_000)).toBe("₱1.5M");
    expect(formatCurrency(12_300_000)).toBe("₱12.3M");
    expect(formatCurrency(100_000_000)).toBe("₱100.0M");
  });

  it("formats values >= 1,000 as ₱XK", () => {
    expect(formatCurrency(1_000)).toBe("₱1K");
    expect(formatCurrency(5_500)).toBe("₱6K"); // round to integer
    expect(formatCurrency(999_000)).toBe("₱999K");
  });

  it("formats values < 1,000 with ₱ and locale separator", () => {
    expect(formatCurrency(0)).toBe("₱0");
    expect(formatCurrency(500)).toBe("₱500");
    expect(formatCurrency(999)).toBe("₱999");
  });

  it("uses toLocaleString for small values (comma separator expected in en locale)", () => {
    // Note: exact output of toLocaleString can vary by environment;
    // we just verify it contains the ₱ prefix and the numeric portion
    const result = formatCurrency(1234);
    expect(result).toMatch(/^₱/);
    // 1234 < 1000 check? Actually >=1000 so it goes to ₱1K path
    // Let's test a true small value
    expect(formatCurrency(999)).toBe("₱999");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("₱0");
  });
});

// =====================================================================
//  formatCompactCurrency
// =====================================================================

describe("formatCompactCurrency", () => {
  it("formats values >= 1,000,000,000 as ₱X.XB", () => {
    expect(formatCompactCurrency(1_000_000_000)).toBe("₱1.0B");
    expect(formatCompactCurrency(2_500_000_000)).toBe("₱2.5B");
    expect(formatCompactCurrency(10_000_000_000)).toBe("₱10.0B");
  });

  it("formats values >= 1,000,000 as ₱X.XM", () => {
    expect(formatCompactCurrency(1_000_000)).toBe("₱1.0M");
    expect(formatCompactCurrency(5_500_000)).toBe("₱5.5M");
    expect(formatCompactCurrency(999_000_000)).toBe("₱999.0M");
  });

  it("formats values >= 1,000 as ₱XK", () => {
    expect(formatCompactCurrency(1_000)).toBe("₱1K");
    expect(formatCompactCurrency(5_500)).toBe("₱6K");
    expect(formatCompactCurrency(999_000)).toBe("₱999K");
  });

  it("formats values < 1,000 with ₱ and locale separator", () => {
    expect(formatCompactCurrency(0)).toBe("₱0");
    expect(formatCompactCurrency(500)).toBe("₱500");
    expect(formatCompactCurrency(999)).toBe("₱999");
  });

  it("handles edge values near each threshold", () => {
    // Just below 1K
    expect(formatCompactCurrency(999)).toBe("₱999");
    // Exactly 1K
    expect(formatCompactCurrency(1_000)).toBe("₱1K");
    // Just below 1M
    expect(formatCompactCurrency(999_999)).toBe("₱1000K"); // 999,999/1000=999.999 -> toFixed(0)=1000
    // Exactly 1M
    expect(formatCompactCurrency(1_000_000)).toBe("₱1.0M");
    // Just below 1B
    expect(formatCompactCurrency(999_999_999)).toBe("₱1000.0M"); // 999,999,999/1M -> 1000.0M
    // Exactly 1B
    expect(formatCompactCurrency(1_000_000_000)).toBe("₱1.0B");
  });
});

// =====================================================================
//  getPropertyTypeColor
// =====================================================================

describe("getPropertyTypeColor", () => {
  const cases: [string, string][] = [
    ["condo", "bg-blue-500"],
    ["house-lot", "bg-green-500"],
    ["lot-only", "bg-yellow-500"],
    ["commercial", "bg-purple-500"],
    ["foreclosed", "bg-red-500"],
  ];

  it.each(cases)("returns %s for type %s", (type, expected) => {
    expect(getPropertyTypeColor(type as string)).toBe(expected);
  });

  it("returns fallback gray for unknown type", () => {
    expect(getPropertyTypeColor("unknown" as string)).toBe("bg-gray-500");
  });
});

// =====================================================================
//  getStatusColor
// =====================================================================

describe("getStatusColor", () => {
  const cases: [string, string][] = [
    ["available", "bg-green-500"],
    ["under-option", "bg-blue-500"],
    ["sold", "bg-purple-500"],
    ["rented", "bg-yellow-500"],
    ["off-market", "bg-gray-500"],
  ];

  it.each(cases)("returns %s for status %s", (status, expected) => {
    expect(getStatusColor(status as string)).toBe(expected);
  });

  it("returns fallback gray for unknown status", () => {
    expect(getStatusColor("unknown" as string)).toBe("bg-gray-500");
  });
});
