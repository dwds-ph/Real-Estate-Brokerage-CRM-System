import { describe, it, expect, vi, beforeEach } from "vitest";
import { geocodeAddress, geocodeAddresses, buildAddressString } from "@/services/geocoding";

describe("geocoding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock sessionStorage
    const store: Record<string, string> = {};
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          Object.keys(store).forEach((k) => delete store[k]);
        }),
      },
      writable: true,
      configurable: true,
    });
    // Mock global fetch
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("geocodeAddress", () => {
    it("should return null for empty address", async () => {
      const result = await geocodeAddress("");
      expect(result).toBeNull();
    });

    it("should return null for whitespace-only address", async () => {
      const result = await geocodeAddress("   ");
      expect(result).toBeNull();
    });

    it("should return cached result if available", async () => {
      const cachedPoint = { lat: 14.5, lng: 121.0, displayName: "Manila, Philippines" };
      // Set up cache
      const cacheKey = "geocode_manila";
      sessionStorage.setItem(cacheKey, JSON.stringify(cachedPoint));
      vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify(cachedPoint));

      const result = await geocodeAddress("Manila");
      expect(result).toEqual(cachedPoint);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should fetch from Nominatim API and return geocoded point", async () => {
      const mockResponse = [
        {
          lat: "14.5995",
          lon: "120.9842",
          display_name: "Manila, Philippines",
          type: "city",
          importance: 0.8,
        },
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await geocodeAddress("Manila, Philippines");

      expect(result).toEqual({
        lat: 14.5995,
        lng: 120.9842,
        displayName: "Manila, Philippines",
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should return null if Nominatim returns non-ok response", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
      } as Response);

      const result = await geocodeAddress("Manila");
      expect(result).toBeNull();
    });

    it("should return null if Nominatim returns empty results", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      const result = await geocodeAddress("Nowhereland");
      expect(result).toBeNull();
    });

    it("should handle network errors gracefully", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      const result = await geocodeAddress("Manila");
      expect(result).toBeNull();
    });

    it("should respect rate limiting (min 1100ms between requests)", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve([
            { lat: "14.5", lon: "121.0", display_name: "Place", type: "city", importance: 0.5 },
          ]),
      } as Response;
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const start = Date.now();
      await geocodeAddress("Query 1");
      await geocodeAddress("Query 2");
      const elapsed = Date.now() - start;

      // Should have waited at least 1100ms between requests
      expect(elapsed).toBeGreaterThanOrEqual(1000);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("geocodeAddresses", () => {
    it("should geocode multiple unique addresses", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve([
            { lat: "14.5", lon: "121.0", display_name: "Place", type: "city", importance: 0.5 },
          ]),
      } as Response;
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const results = await geocodeAddresses(["Address A", "Address B"]);
      expect(results.size).toBe(2);
    });

    it("should filter out empty addresses", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve([
            { lat: "14.5", lon: "121.0", display_name: "Place", type: "city", importance: 0.5 },
          ]),
      } as Response;
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const results = await geocodeAddresses(["Addr", "", "  "]);
      // Only one unique non-empty address
      expect(results.size).toBe(1);
    });

    it("should deduplicate repeated addresses", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve([
            { lat: "14.5", lon: "121.0", display_name: "Place", type: "city", importance: 0.5 },
          ]),
      } as Response;
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const results = await geocodeAddresses(["Same", "Same", "Same"]);
      expect(results.size).toBe(1);
    });

    it("should call onProgress callback", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve([
            { lat: "14.5", lon: "121.0", display_name: "Place", type: "city", importance: 0.5 },
          ]),
      } as Response;
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const onProgress = vi.fn();
      await geocodeAddresses(["A", "B"], onProgress);
      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2);
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2);
    });
  });

  describe("buildAddressString", () => {
    it("should build a full address string", () => {
      const result = buildAddressString("123 Main St", "Manila", "Metro Manila");
      expect(result).toBe("123 Main St, Manila, Metro Manila, Philippines");
    });

    it("should omit empty parts", () => {
      const result = buildAddressString("123 Main St", "", "");
      expect(result).toBe("123 Main St, Philippines");
    });

    it("should return only Philippines if all parts empty", () => {
      const result = buildAddressString("", "", "");
      expect(result).toBe("Philippines");
    });
  });
});
