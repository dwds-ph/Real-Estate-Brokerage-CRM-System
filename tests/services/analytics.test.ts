import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  initAnalytics,
  logPageView,
  logEvent,
} from "@/services/analytics";
import type { AnalyticsEventName } from "@/services/analytics";

// ─── Mocks ────────────────────────────────────────────────────────────

const mockGtag = vi.fn();

beforeEach(() => {
  // Reset DOM state
  document.head.querySelectorAll("script").forEach((s) => s.remove());

  // Set up environment
  process.env.VITE_GA_MEASUREMENT_ID = "G-TEST123";

  // Set up window.gtag
  window.gtag = mockGtag;
  window.dataLayer = [];
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.gtag;
  delete window.dataLayer;
  delete process.env.VITE_GA_MEASUREMENT_ID;
});

// ─── Tests ────────────────────────────────────────────────────────────

describe("analytics", () => {
  describe("initAnalytics", () => {
    it("should not crash when GA ID is set (graceful handling)", () => {
      // initAnalytics uses import.meta.env.VITE_GA_MEASUREMENT_ID which is a
      // build-time Vite construct. In tests it may be undefined, but the
      // function should handle that gracefully without throwing.
      expect(() => initAnalytics()).not.toThrow();
    });

    it("should be a no-op on subsequent calls (no errors)", () => {
      initAnalytics();
      expect(() => initAnalytics()).not.toThrow();
    });
  });

  describe("logPageView", () => {
    it("should call gtag with page_view event when GA is ready", () => {
      // Setup import.meta.env for getMeasurementId to return a value
      // This is needed because isGaReady() checks getMeasurementId() first
      window.gtag = mockGtag;
      // Override getMeasurementId by setting VITE_GA_MEASUREMENT_ID in env
      process.env.VITE_GA_MEASUREMENT_ID = "G-TEST123";

      logPageView("/leads");

      expect(mockGtag).toHaveBeenCalledWith("event", "page_view", {
        page_path: "/leads",
        page_title: expect.any(String),
        page_location: expect.any(String),
      });
    });

    it("should silently do nothing when gtag is not available", () => {
      delete window.gtag;

      expect(() => logPageView("/leads")).not.toThrow();
    });

    it("should pass the correct path to gtag", () => {
      window.gtag = mockGtag;

      logPageView("/deals/abc-123");

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "page_view",
        expect.objectContaining({
          page_path: "/deals/abc-123",
        }),
      );
    });

    it("should silently do nothing when measurement ID is missing", () => {
      delete process.env.VITE_GA_MEASUREMENT_ID;
      window.gtag = mockGtag;

      logPageView("/leads");

      expect(mockGtag).not.toHaveBeenCalled();
    });
  });

  describe("logEvent", () => {
    it("should call gtag with custom event name when GA is ready", () => {
      window.gtag = mockGtag;

      logEvent("lead_created", { source: "facebook" });

      expect(mockGtag).toHaveBeenCalledWith("event", "lead_created", {
        source: "facebook",
      });
    });

    it("should call gtag with empty params when params are omitted", () => {
      window.gtag = mockGtag;

      logEvent("deal_closed");

      expect(mockGtag).toHaveBeenCalledWith("event", "deal_closed", {});
    });

    it("should silently do nothing when gtag is not available", () => {
      delete window.gtag;

      expect(() => logEvent("lead_created")).not.toThrow();
    });

    it("should support all known AnalyticsEventName values", () => {
      window.gtag = mockGtag;

      const events: AnalyticsEventName[] = [
        "lead_created",
        "deal_status_changed",
        "viewing_scheduled",
        "commission_computed",
        "brochure_viewed",
        "listing_shared",
        "task_completed",
        "deal_closed",
        "project_created",
        "document_generated",
        "login",
        "registration",
        "payment_recorded",
        "tour_completed",
      ];

      for (const eventName of events) {
        logEvent(eventName);
        expect(mockGtag).toHaveBeenCalledWith("event", eventName, {});
      }
    });

    it("should pass numeric and boolean params correctly", () => {
      window.gtag = mockGtag;

      logEvent("deal_closed", {
        deal_value: 5000000,
        is_referral: true,
      });

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "deal_closed",
        expect.objectContaining({
          deal_value: 5000000,
          is_referral: true,
        }),
      );
    });

    it("should handle errors gracefully without throwing", () => {
      window.gtag = mockGtag;
      mockGtag.mockImplementationOnce(() => {
        throw new Error("gtag error");
      });

      expect(() => logEvent("lead_created")).not.toThrow();
    });

    it("should silently do nothing when measurement ID is missing", () => {
      delete process.env.VITE_GA_MEASUREMENT_ID;
      window.gtag = mockGtag;

      logEvent("lead_created");

      expect(mockGtag).not.toHaveBeenCalled();
    });
  });
});
