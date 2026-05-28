import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import {
  subscribeLicensesForAgent,
  subscribeAllLicenses,
  subscribeExpiringLicenses,
  createLicense,
  updateLicense,
  deleteLicense,
  computeLicenseStatus,
  getDaysUntilExpiry,
  isExpired,
  isExpiringSoon,
  getLicenseTypeLabel,
  getLicenseStatusColor,
  getLicenseStatusLabel,
  computeStatusForAll,
} from "@/services/licenseService";
import type { License, LicenseStatus, LicenseType } from "@/types";

// ─── Mock firebase/firestore ─────────────────────────────────────────

const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// ─── Helpers ─────────────────────────────────────────────────────────

function makeMockSnapshot(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>,
) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: d.data,
      exists: true,
    })),
  };
}

function sampleLicense(overrides: Partial<License> = {}): License {
  return {
    id: "license-1",
    agentId: "agent-1",
    agentName: "Alice Agent",
    type: "prc",
    licenseNumber: "PRC-2024-001",
    issuingBody: "PRC",
    issueDate: Date.now() - 365 * 86400000,
    expiryDate: Date.now() + 365 * 86400000,
    status: "active",
    renewedLicenseId: undefined,
    notes: undefined,
    documentUrl: undefined,
    createdBy: "broker-1",
    createdAt: Date.now() - 365 * 86400000,
    updatedAt: Date.now() - 365 * 86400000,
    ...overrides,
  };
}

// 1 day in ms
const DAY_MS = 86400000;

// ─── Tests ───────────────────────────────────────────────────────────

describe("licenseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeLicensesForAgent ───────────────────────────────────

  describe("subscribeLicensesForAgent", () => {
    it("should return a noop unsubscribe when agentId is undefined", () => {
      const unsub = subscribeLicensesForAgent(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should subscribe to licenses for the given agentId ordered by expiryDate asc", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere.mockReturnValue("where-agentId");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeLicensesForAgent("agent-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "licenses",
      );
      expect(mockWhere).toHaveBeenCalledWith("agentId", "==", "agent-1");
      expect(mockOrderBy).toHaveBeenCalledWith("expiryDate", "asc");
      expect(mockQuery).toHaveBeenCalledWith(
        "licenses-collection",
        "where-agentId",
        "orderBy-expiryDate-asc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot docs to License objects and invoke callback", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere.mockReturnValue("where-agentId");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "l1",
          data: () => ({
            type: "prc",
            licenseNumber: "L-001",
            status: "active",
            agentId: "a1",
          }),
        },
        {
          id: "l2",
          data: () => ({
            type: "broker-license",
            licenseNumber: "L-002",
            status: "expired",
            agentId: "a1",
          }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeLicensesForAgent("agent-1", callback);

      expect(callback).toHaveBeenCalledWith([
        {
          id: "l1",
          type: "prc",
          licenseNumber: "L-001",
          status: "active",
          agentId: "a1",
        },
        {
          id: "l2",
          type: "broker-license",
          licenseNumber: "L-002",
          status: "expired",
          agentId: "a1",
        },
      ]);
    });

    it("should invoke onError when snapshot error occurs", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere.mockReturnValue("where-agentId");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const testError = new Error("Network error");
      mockOnSnapshot.mockImplementation(
        (_q, _onNext, onError: (e: Error) => void) => {
          onError(testError);
          return vi.fn();
        },
      );

      const onError = vi.fn();
      subscribeLicensesForAgent("agent-1", vi.fn(), onError);

      expect(onError).toHaveBeenCalledWith("Network error");
    });

    it("should handle empty snapshot gracefully", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere.mockReturnValue("where-agentId");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeLicensesForAgent("agent-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should return the unsubscribe function from onSnapshot", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere.mockReturnValue("where-agentId");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribeLicensesForAgent("agent-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── subscribeAllLicenses ────────────────────────────────────────

  describe("subscribeAllLicenses", () => {
    it("should subscribe to all licenses ordered by expiryDate asc", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeAllLicenses(vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "licenses",
      );
      expect(mockOrderBy).toHaveBeenCalledWith("expiryDate", "asc");
      expect(mockQuery).toHaveBeenCalledWith(
        "licenses-collection",
        "orderBy-expiryDate-asc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "l1",
          data: () => ({
            type: "hlurb",
            licenseNumber: "H-001",
            status: "active",
          }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeAllLicenses(callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "l1", type: "hlurb", licenseNumber: "H-001", status: "active" },
      ]);
    });

    it("should invoke onError when snapshot error occurs", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const testError = new Error("Unauthorized");
      mockOnSnapshot.mockImplementation(
        (_q, _onNext, onError: (e: Error) => void) => {
          onError(testError);
          return vi.fn();
        },
      );

      const onError = vi.fn();
      subscribeAllLicenses(vi.fn(), onError);

      expect(onError).toHaveBeenCalledWith("Unauthorized");
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeAllLicenses(callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should return the unsubscribe function", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribeAllLicenses(vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── subscribeExpiringLicenses ───────────────────────────────────

  describe("subscribeExpiringLicenses", () => {
    it("should subscribe to licenses expiring within the given threshold days", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere
        .mockReturnValueOnce("where-expiry-gte")
        .mockReturnValueOnce("where-expiry-lte");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeExpiringLicenses(30, vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "licenses",
      );
      // First where: expiryDate >= now
      expect(mockWhere).toHaveBeenNthCalledWith(
        1,
        "expiryDate",
        ">=",
        expect.any(Number),
      );
      // Second where: expiryDate <= now + threshold
      expect(mockWhere).toHaveBeenNthCalledWith(
        2,
        "expiryDate",
        "<=",
        expect.any(Number),
      );
      expect(mockOrderBy).toHaveBeenCalledWith("expiryDate", "asc");
      expect(mockQuery).toHaveBeenCalledWith(
        "licenses-collection",
        "where-expiry-gte",
        "where-expiry-lte",
        "orderBy-expiryDate-asc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
      );
    });

    it("should calculate the correct future timestamp based on daysThreshold", () => {
      const before = Date.now();
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere.mockReturnValue("where-expiry");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeExpiringLicenses(90, vi.fn());

      const lowerBound = vi.mocked(mockWhere).mock.calls[0][2] as number;
      const upperBound = vi.mocked(mockWhere).mock.calls[1][2] as number;
      expect(lowerBound).toBeGreaterThanOrEqual(before);
      expect(upperBound - lowerBound).toBe(90 * DAY_MS);
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere.mockReturnValue("where-expiry");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "l1",
          data: () => ({
            type: "bir-accreditation",
            licenseNumber: "BIR-001",
            status: "expiring-soon",
          }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeExpiringLicenses(30, callback);

      expect(callback).toHaveBeenCalledWith([
        {
          id: "l1",
          type: "bir-accreditation",
          licenseNumber: "BIR-001",
          status: "expiring-soon",
        },
      ]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere.mockReturnValue("where-expiry");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeExpiringLicenses(30, callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should work with a 7-day threshold", () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockWhere.mockReturnValue("where-expiry");
      mockOrderBy.mockReturnValue("orderBy-expiryDate-asc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeExpiringLicenses(7, vi.fn());

      const lowerBound = vi.mocked(mockWhere).mock.calls[0][2] as number;
      const upperBound = vi.mocked(mockWhere).mock.calls[1][2] as number;
      expect(upperBound - lowerBound).toBe(7 * DAY_MS);
    });
  });

  // ─── createLicense ───────────────────────────────────────────────

  describe("createLicense", () => {
    const licenseInput = {
      agentId: "agent-1",
      agentName: "Alice Agent",
      type: "prc" as LicenseType,
      licenseNumber: "PRC-2024-001",
      issuingBody: "PRC",
      issueDate: Date.now() - 30 * DAY_MS,
      expiryDate: Date.now() + 365 * DAY_MS,
      renewedLicenseId: undefined as string | undefined,
      notes: undefined as string | undefined,
      documentUrl: undefined as string | undefined,
      createdBy: "broker-1",
    };

    it("should add a license with computed status and timestamps", async () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockAddDoc.mockResolvedValue({ id: "new-license-id" });

      const id = await createLicense(licenseInput);

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "licenses",
      );
      expect(mockAddDoc).toHaveBeenCalledWith(
        "licenses-collection",
        expect.objectContaining({
          ...licenseInput,
          status: expect.any(String),
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      );
      expect(id).toBe("new-license-id");
    });

    it("should compute status as 'active' for far-future expiry", async () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockAddDoc.mockResolvedValue({ id: "license-1" });

      await createLicense(licenseInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.status).toBe("active");
    });

    it("should compute status as 'expiring-soon' for expiry within 30 days", async () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockAddDoc.mockResolvedValue({ id: "license-1" });

      const nearFutureExpiry = Date.now() + 15 * DAY_MS;
      await createLicense({ ...licenseInput, expiryDate: nearFutureExpiry });

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.status).toBe("expiring-soon");
    });

    it("should compute status as 'expired' for past expiry", async () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockAddDoc.mockResolvedValue({ id: "license-1" });

      const pastExpiry = Date.now() - 5 * DAY_MS;
      await createLicense({ ...licenseInput, expiryDate: pastExpiry });

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.status).toBe("expired");
    });

    it("should set createdAt and updatedAt to the same timestamp", async () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockAddDoc.mockImplementation((_col, data: Record<string, unknown>) => {
        expect(data.createdAt).toEqual(data.updatedAt);
        expect(data.createdAt).toEqual(expect.any(Number));
        return { id: "license-123" };
      });

      await createLicense(licenseInput);
    });

    it("should pass all provided fields to addDoc", async () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockAddDoc.mockResolvedValue({ id: "license-1" });

      await createLicense(licenseInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.agentId).toBe("agent-1");
      expect(data.agentName).toBe("Alice Agent");
      expect(data.type).toBe("prc");
      expect(data.licenseNumber).toBe("PRC-2024-001");
      expect(data.issuingBody).toBe("PRC");
      expect(data.issueDate).toEqual(expect.any(Number));
      expect(data.expiryDate).toEqual(expect.any(Number));
      expect(data.createdBy).toBe("broker-1");
    });

    it("should not include id in the document data", async () => {
      mockCollection.mockReturnValue("licenses-collection");
      mockAddDoc.mockResolvedValue({ id: "license-1" });

      await createLicense(licenseInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data).not.toHaveProperty("id");
    });
  });

  // ─── updateLicense ───────────────────────────────────────────────

  describe("updateLicense", () => {
    it("should update the document with partial data and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "license-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateLicense("license-1", { agentName: "Updated Name" });

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "licenses",
        "license-1",
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "license-1" },
        expect.objectContaining({
          agentName: "Updated Name",
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should recompute status when expiryDate is updated", async () => {
      mockDoc.mockReturnValue({ id: "license-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      const pastExpiry = Date.now() - 10 * DAY_MS;
      await updateLicense("license-1", { expiryDate: pastExpiry });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("expired");
      expect(data.expiryDate).toBe(pastExpiry);
    });

    it("should compute status as 'active' when updated to far-future expiry", async () => {
      mockDoc.mockReturnValue({ id: "license-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      const farFutureExpiry = Date.now() + 365 * DAY_MS;
      await updateLicense("license-1", { expiryDate: farFutureExpiry });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("active");
    });

    it("should compute status as 'expiring-soon' when expiry is within 30 days", async () => {
      mockDoc.mockReturnValue({ id: "license-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      const nearExpiry = Date.now() + 10 * DAY_MS;
      await updateLicense("license-1", { expiryDate: nearExpiry });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("expiring-soon");
    });

    it("should not change status when expiryDate is not updated", async () => {
      mockDoc.mockReturnValue({ id: "license-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateLicense("license-1", { notes: "Updated notes" });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).not.toHaveProperty("status");
      expect(data.notes).toBe("Updated notes");
    });

    it("should merge partial update with updatedAt only when no fields provided", async () => {
      mockDoc.mockReturnValue({ id: "license-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateLicense("license-1", {});

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toEqual({ updatedAt: expect.any(Number) });
    });
  });

  // ─── deleteLicense ───────────────────────────────────────────────

  describe("deleteLicense", () => {
    it("should delete the document by licenseId", async () => {
      mockDoc.mockReturnValue({ id: "license-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteLicense("license-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "licenses",
        "license-to-delete",
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "license-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });

  // ─── computeLicenseStatus ────────────────────────────────────────

  describe("computeLicenseStatus", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Set a fixed "now" so tests are deterministic
      vi.setSystemTime(new Date("2025-06-01T00:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const NOW = new Date("2025-06-01T00:00:00.000Z").getTime();

    it("should return 'active' for expiry far in the future (>30 days)", () => {
      const futureExpiry = NOW + 60 * DAY_MS;
      expect(computeLicenseStatus(futureExpiry)).toBe("active");
    });

    it("should return 'active' for expiry exactly 31 days away", () => {
      const expiry31Days = NOW + 31 * DAY_MS;
      expect(computeLicenseStatus(expiry31Days)).toBe("active");
    });

    it("should return 'expiring-soon' for expiry exactly 30 days away", () => {
      const expiry30Days = NOW + 30 * DAY_MS;
      expect(computeLicenseStatus(expiry30Days)).toBe("expiring-soon");
    });

    it("should return 'expiring-soon' for expiry within the next 30 days", () => {
      const expirySoon = NOW + 15 * DAY_MS;
      expect(computeLicenseStatus(expirySoon)).toBe("expiring-soon");
    });

    it("should return 'expiring-soon' for expiry today", () => {
      expect(computeLicenseStatus(NOW)).toBe("expiring-soon");
    });

    it("should return 'expired' for expiry 1 day ago", () => {
      const pastExpiry = NOW - DAY_MS;
      expect(computeLicenseStatus(pastExpiry)).toBe("expired");
    });

    it("should return 'expired' for expiry far in the past", () => {
      const oldExpiry = NOW - 365 * DAY_MS;
      expect(computeLicenseStatus(oldExpiry)).toBe("expired");
    });
  });

  // ─── getDaysUntilExpiry ──────────────────────────────────────────

  describe("getDaysUntilExpiry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const NOW = new Date("2025-06-15T12:00:00.000Z").getTime();

    it("should return a positive number for future expiry", () => {
      const futureExpiry = NOW + 10 * DAY_MS;
      const days = getDaysUntilExpiry(futureExpiry);
      expect(days).toBe(10);
    });

    it("should return a negative number for past expiry", () => {
      const pastExpiry = NOW - 5 * DAY_MS;
      const days = getDaysUntilExpiry(pastExpiry);
      expect(days).toBe(-5);
    });

    it("should return 0 for today", () => {
      expect(getDaysUntilExpiry(NOW)).toBe(0);
    });

    it("should floor partial days", () => {
      // 2.5 days from now -> 2
      const twoAndHalfDays = NOW + 2.5 * DAY_MS;
      expect(getDaysUntilExpiry(twoAndHalfDays)).toBe(2);
    });
  });

  // ─── isExpired ───────────────────────────────────────────────────

  describe("isExpired", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T00:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const NOW = new Date("2025-06-01T00:00:00.000Z").getTime();

    it("should return false for future expiry", () => {
      expect(isExpired(NOW + DAY_MS)).toBe(false);
    });

    it("should return false for expiry today", () => {
      expect(isExpired(NOW)).toBe(false);
    });

    it("should return true for past expiry", () => {
      expect(isExpired(NOW - 1)).toBe(true);
    });

    it("should return true for far past expiry", () => {
      expect(isExpired(NOW - 365 * DAY_MS)).toBe(true);
    });
  });

  // ─── isExpiringSoon ──────────────────────────────────────────────

  describe("isExpiringSoon", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T00:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const NOW = new Date("2025-06-01T00:00:00.000Z").getTime();

    it("should return true for expiry within default threshold (30 days)", () => {
      expect(isExpiringSoon(NOW + 15 * DAY_MS)).toBe(true);
    });

    it("should return true for expiry today", () => {
      expect(isExpiringSoon(NOW)).toBe(true);
    });

    it("should return false for expiry beyond default threshold", () => {
      expect(isExpiringSoon(NOW + 31 * DAY_MS)).toBe(false);
    });

    it("should return true for expiry exactly at threshold", () => {
      expect(isExpiringSoon(NOW + 30 * DAY_MS)).toBe(true);
    });

    it("should return false for expiry in the past", () => {
      expect(isExpiringSoon(NOW - DAY_MS)).toBe(false);
    });

    it("should respect a custom thresholdDays parameter", () => {
      expect(isExpiringSoon(NOW + 60 * DAY_MS, 60)).toBe(true);
      expect(isExpiringSoon(NOW + 61 * DAY_MS, 60)).toBe(false);
    });
  });

  // ─── getLicenseTypeLabel ─────────────────────────────────────────

  describe("getLicenseTypeLabel", () => {
    it("should return 'PRC License' for prc", () => {
      expect(getLicenseTypeLabel("prc")).toBe("PRC License");
    });

    it("should return 'Broker's License' for broker-license", () => {
      expect(getLicenseTypeLabel("broker-license")).toBe("Broker's License");
    });

    it("should return 'BIR Accreditation' for bir-accreditation", () => {
      expect(getLicenseTypeLabel("bir-accreditation")).toBe(
        "BIR Accreditation",
      );
    });

    it("should return 'HLURB License' for hlurb", () => {
      expect(getLicenseTypeLabel("hlurb")).toBe("HLURB License");
    });

    it("should return 'Other' for other", () => {
      expect(getLicenseTypeLabel("other")).toBe("Other");
    });
  });

  // ─── getLicenseStatusColor ───────────────────────────────────────

  describe("getLicenseStatusColor", () => {
    it("should return green classes for active", () => {
      const color = getLicenseStatusColor("active");
      expect(color).toContain("bg-green-100");
      expect(color).toContain("text-green-700");
    });

    it("should return yellow classes for expiring-soon", () => {
      const color = getLicenseStatusColor("expiring-soon");
      expect(color).toContain("bg-yellow-100");
      expect(color).toContain("text-yellow-700");
    });

    it("should return red classes for expired", () => {
      const color = getLicenseStatusColor("expired");
      expect(color).toContain("bg-red-100");
      expect(color).toContain("text-red-700");
    });

    it("should return blue classes for renewed", () => {
      const color = getLicenseStatusColor("renewed");
      expect(color).toContain("bg-blue-100");
      expect(color).toContain("text-blue-700");
    });
  });

  // ─── getLicenseStatusLabel ───────────────────────────────────────

  describe("getLicenseStatusLabel", () => {
    it("should return 'Active' for active", () => {
      expect(getLicenseStatusLabel("active")).toBe("Active");
    });

    it("should return 'Expiring Soon' for expiring-soon", () => {
      expect(getLicenseStatusLabel("expiring-soon")).toBe("Expiring Soon");
    });

    it("should return 'Expired' for expired", () => {
      expect(getLicenseStatusLabel("expired")).toBe("Expired");
    });

    it("should return 'Renewed' for renewed", () => {
      expect(getLicenseStatusLabel("renewed")).toBe("Renewed");
    });
  });

  // ─── computeStatusForAll ─────────────────────────────────────────

  describe("computeStatusForAll", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T00:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const NOW = new Date("2025-06-01T00:00:00.000Z").getTime();

    it("should recompute status for each license based on expiryDate", () => {
      const licenses: License[] = [
        sampleLicense({
          id: "l1",
          expiryDate: NOW + 60 * DAY_MS,
          status: "active",
        }),
        sampleLicense({
          id: "l2",
          expiryDate: NOW + 15 * DAY_MS,
          status: "active",
        }),
        sampleLicense({
          id: "l3",
          expiryDate: NOW - 10 * DAY_MS,
          status: "active",
        }),
      ];

      const result = computeStatusForAll(licenses);

      expect(result[0].status).toBe("active");
      expect(result[1].status).toBe("expiring-soon");
      expect(result[2].status).toBe("expired");
    });

    it("should preserve all other fields", () => {
      const licenses: License[] = [
        sampleLicense({
          id: "l1",
          type: "prc",
          licenseNumber: "L-001",
          agentName: "Alice",
        }),
      ];

      const result = computeStatusForAll(licenses);

      expect(result[0].id).toBe("l1");
      expect(result[0].type).toBe("prc");
      expect(result[0].licenseNumber).toBe("L-001");
      expect(result[0].agentName).toBe("Alice");
    });

    it("should not mutate the original array", () => {
      const licenses: License[] = [
        sampleLicense({
          id: "l1",
          expiryDate: NOW - 10 * DAY_MS,
          status: "active",
        }),
      ];

      const result = computeStatusForAll(licenses);

      expect(licenses[0].status).toBe("active");
      expect(result[0].status).toBe("expired");
      expect(result).not.toBe(licenses);
    });

    it("should handle an empty array", () => {
      expect(computeStatusForAll([])).toEqual([]);
    });
  });
});
