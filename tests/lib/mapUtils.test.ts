import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  geocodeAddress,
  getMarkerColor,
  DEFAULT_VIEWPORT,
  geocodeCache,
} from "@/lib/mapUtils";

beforeEach(() => {
  vi.restoreAllMocks();
  geocodeCache.clear();
});

// ─── DEFAULT_VIEWPORT ──────────────────────────────────────────────────

describe("DEFAULT_VIEWPORT", () => {
  it("has Manila center coordinates", () => {
    expect(DEFAULT_VIEWPORT.center).toEqual([14.5995, 120.9842]);
  });

  it("has zoom level 12", () => {
    expect(DEFAULT_VIEWPORT.zoom).toBe(12);
  });

  it("center is a tuple of two numbers", () => {
    expect(DEFAULT_VIEWPORT.center).toHaveLength(2);
    expect(typeof DEFAULT_VIEWPORT.center[0]).toBe("number");
    expect(typeof DEFAULT_VIEWPORT.center[1]).toBe("number");
  });
});

// ─── getMarkerColor ────────────────────────────────────────────────────

describe("getMarkerColor", () => {
  it("returns green for available", () => {
    expect(getMarkerColor("available")).toBe("#22c55e");
  });

  it("returns yellow for under-option", () => {
    expect(getMarkerColor("under-option")).toBe("#eab308");
  });

  it("returns red for sold", () => {
    expect(getMarkerColor("sold")).toBe("#ef4444");
  });

  it("returns blue for rented", () => {
    expect(getMarkerColor("rented")).toBe("#3b82f6");
  });

  it("returns gray for off-market", () => {
    expect(getMarkerColor("off-market")).toBe("#6b7280");
  });

  it("returns default gray for unknown status", () => {
    expect(getMarkerColor("unknown")).toBe("#6b7280");
  });

  it("returns default gray for empty string", () => {
    expect(getMarkerColor("")).toBe("#6b7280");
  });
});

// ─── geocodeAddress ────────────────────────────────────────────────────

describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset();
  });

  it("returns null for empty address", async () => {
    const result = await geocodeAddress("");
    expect(result).toBeNull();
  });

  it("returns null for whitespace-only address", async () => {
    const result = await geocodeAddress("   ");
    expect(result).toBeNull();
  });

  it("calls fetch with correct Nominatim URL", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () => Promise.resolve([{ lat: "14.5995", lon: "120.9842" }]),
    } as Response);

    await geocodeAddress("Manila, Philippines");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("nominatim.openstreetmap.org/search");
    expect(url).toContain(encodeURIComponent("Manila, Philippines"));
    expect(url).toContain("countrycodes=ph");
    expect(options).toMatchObject({
      headers: { "User-Agent": "RealEstateCRM/1.0" },
    });
  });

  it("parses lat/lon from response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () => Promise.resolve([{ lat: "14.5995", lon: "120.9842" }]),
    } as Response);

    const result = await geocodeAddress("Manila");
    expect(result).toEqual([14.5995, 120.9842]);
  });

  it("returns null when no results found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () => Promise.resolve([]),
    } as Response);

    const result = await geocodeAddress("Nowhereville, XYZ");
    expect(result).toBeNull();
  });

  it("returns null when response is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () => Promise.resolve([]),
    } as Response);

    const result = await geocodeAddress("");
    expect(result).toBeNull();
  });

  it("caches results and returns cached value on subsequent calls", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () => Promise.resolve([{ lat: "14.5995", lon: "120.9842" }]),
    } as Response);

    // First call
    const result1 = await geocodeAddress("Manila");
    expect(result1).toEqual([14.5995, 120.9842]);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call with same address (case-insensitive)
    const result2 = await geocodeAddress("manila");
    expect(result2).toEqual([14.5995, 120.9842]);
    expect(mockFetch).toHaveBeenCalledTimes(1); // no additional fetch

    // Third call with trimmed variation
    const result3 = await geocodeAddress("  Manila  ");
    expect(result3).toEqual([14.5995, 120.9842]);
    expect(mockFetch).toHaveBeenCalledTimes(1); // still cached
  });

  it("handles fetch error and returns null", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await geocodeAddress("Manila");
    expect(result).toBeNull();
  });

  it("handles JSON parse error gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () => Promise.reject(new Error("Invalid JSON")),
    } as Response);

    const result = await geocodeAddress("Manila");
    expect(result).toBeNull();
  });

  it("encodes address special characters", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () => Promise.resolve([{ lat: "10.0", lon: "125.0" }]),
    } as Response);

    await geocodeAddress("Rizal St., Makati City");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("Rizal St., Makati City")),
      expect.anything(),
    );
  });

  it("handles address with diacritics", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () => Promise.resolve([{ lat: "10.3", lon: "123.9" }]),
    } as Response);

    const result = await geocodeAddress("Cebu City");
    expect(result).toEqual([10.3, 123.9]);
  });

  it("handles multiple results by taking the first one", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () =>
        Promise.resolve([
          { lat: "14.5995", lon: "120.9842" },
          { lat: "14.5561", lon: "121.0216" }, // second result should be ignored
        ]),
    } as Response);

    const result = await geocodeAddress("Manila");
    expect(result).toEqual([14.5995, 120.9842]);
  });

  it("uses cached value even after fetch error on second different address", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch");
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([{ lat: "14.5", lon: "121.0" }]),
    } as Response);

    await geocodeAddress("Manila");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // For a different address, it should fetch again
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([{ lat: "10.0", lon: "125.0" }]),
    } as Response);

    const result = await geocodeAddress("Cebu");
    expect(result).toEqual([10.0, 125.0]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
