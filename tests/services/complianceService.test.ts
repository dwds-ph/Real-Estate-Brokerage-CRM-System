import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  subscribeComplianceChecklists,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  getPHComplianceTemplate,
} from "@/services/complianceService";

// ─── Mock @/lib/firestore ─────────────────────────────────────────────

const mockSubscribeToQuery = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockDeleteDocument = vi.fn();

vi.mock("@/lib/firestore", () => ({
  subscribeToQuery: (...args: unknown[]) => mockSubscribeToQuery(...args),
  createDocument: (...args: unknown[]) => mockCreateDocument(...args),
  updateDocument: (...args: unknown[]) => mockUpdateDocument(...args),
  deleteDocument: (...args: unknown[]) => mockDeleteDocument(...args),
  COLLECTIONS: { COMPLIANCE_CHECKLISTS: "complianceChecklists" },
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

// ─── Tests ────────────────────────────────────────────────────────────

describe("complianceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeComplianceChecklists ──────────────────────────────

  describe("subscribeComplianceChecklists", () => {
    it("should return a noop unsubscribe when dealId is undefined", () => {
      const unsub = subscribeComplianceChecklists(undefined);
      expect(unsub).toBeInstanceOf(Function);
      expect(mockSubscribeToQuery).not.toHaveBeenCalled();
    });

    it("should return a noop unsubscribe when dealId is empty string", () => {
      const unsub = subscribeComplianceChecklists("");
      expect(unsub).toBeInstanceOf(Function);
      expect(mockSubscribeToQuery).not.toHaveBeenCalled();
    });

    it("should subscribe to complianceChecklists collection with a callback", () => {
      subscribeComplianceChecklists("deal-1", vi.fn());

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "complianceChecklists",
        expect.any(Array),
        expect.any(Function),
        undefined,
      );
    });

    it("should pass a non-empty constraints array", () => {
      subscribeComplianceChecklists("deal-1", vi.fn());

      const constraints = mockSubscribeToQuery.mock.calls[0][1];
      expect(Array.isArray(constraints)).toBe(true);
      expect(constraints.length).toBeGreaterThan(0);
    });

    it("should pass onError callback when provided", () => {
      const onError = vi.fn();
      subscribeComplianceChecklists("deal-1", vi.fn(), onError);

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "complianceChecklists",
        expect.any(Array),
        expect.any(Function),
        onError,
      );
    });

    it("should use a default callback when callback is undefined", () => {
      subscribeComplianceChecklists("deal-1", undefined, undefined);

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "complianceChecklists",
        expect.any(Array),
        expect.any(Function),
        undefined,
      );
    });
  });

  // ─── createChecklist ────────────────────────────────────────────

  describe("createChecklist", () => {
    const checklistInput = {
      dealId: "deal-1",
      dealTitle: "Beachfront Property Deal",
      items: [
        {
          id: "c1",
          label: "RA 9646 Disclosure",
          category: "legal" as const,
          required: true,
          completed: false,
        },
        {
          id: "c2",
          label: "Notarization of Contract",
          category: "legal" as const,
          required: true,
          completed: false,
        },
      ],
      progress: 0,
      createdBy: "user-1",
    };

    it("should create a document and return the new id", async () => {
      mockCreateDocument.mockResolvedValue("new-checklist-id");

      const id = await createChecklist(checklistInput);

      expect(mockCreateDocument).toHaveBeenCalledWith(
        "complianceChecklists",
        checklistInput,
      );
      expect(id).toBe("new-checklist-id");
    });

    it("should pass all fields to createDocument", async () => {
      mockCreateDocument.mockResolvedValue("id");

      await createChecklist(checklistInput);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data).toMatchObject(checklistInput);
      expect(data.items).toHaveLength(2);
    });

    it("should handle empty items array", async () => {
      mockCreateDocument.mockResolvedValue("id");

      const input = { ...checklistInput, items: [], progress: 100 };
      await createChecklist(input);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data.items).toEqual([]);
      expect(data.progress).toBe(100);
    });

    it("should handle error from createDocument", async () => {
      mockCreateDocument.mockRejectedValue(new Error("Firestore error"));

      await expect(createChecklist(checklistInput)).rejects.toThrow(
        "Firestore error",
      );
    });
  });

  // ─── updateChecklist ────────────────────────────────────────────

  describe("updateChecklist", () => {
    it("should update the document with partial data", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateChecklist("checklist-1", {
        progress: 50,
        items: [
          {
            id: "c1",
            label: "RA 9646 Disclosure",
            category: "legal" as const,
            required: true,
            completed: true,
            completedAt: Date.now(),
          },
        ],
      });

      expect(mockUpdateDocument).toHaveBeenCalledWith(
        "complianceChecklists",
        "checklist-1",
        {
          progress: 50,
          items: expect.arrayContaining([
            expect.objectContaining({
              id: "c1",
              completed: true,
            }),
          ]),
        },
      );
    });

    it("should allow updating progress only", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateChecklist("checklist-1", { progress: 100 });

      expect(mockUpdateDocument).toHaveBeenCalledWith(
        "complianceChecklists",
        "checklist-1",
        { progress: 100 },
      );
    });

    it("should handle error", async () => {
      mockUpdateDocument.mockRejectedValue(new Error("Update failed"));

      await expect(
        updateChecklist("cl-1", { progress: 50 }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ─── deleteChecklist ────────────────────────────────────────────

  describe("deleteChecklist", () => {
    it("should delete the document by id", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await deleteChecklist("checklist-to-delete");

      expect(mockDeleteDocument).toHaveBeenCalledWith(
        "complianceChecklists",
        "checklist-to-delete",
      );
    });

    it("should resolve successfully", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await expect(deleteChecklist("cl-1")).resolves.toBeUndefined();
    });

    it("should handle error", async () => {
      mockDeleteDocument.mockRejectedValue(new Error("Delete failed"));

      await expect(deleteChecklist("cl-1")).rejects.toThrow("Delete failed");
    });
  });

  // ─── getPHComplianceTemplate ────────────────────────────────────

  describe("getPHComplianceTemplate", () => {
    it("should return an array of 12 compliance items", () => {
      const template = getPHComplianceTemplate();
      expect(Array.isArray(template)).toBe(true);
      expect(template).toHaveLength(12);
    });

    it("should include required legal items", () => {
      const template = getPHComplianceTemplate();
      const legalItems = template.filter((i) => i.category === "legal");
      expect(legalItems.length).toBeGreaterThanOrEqual(3);
      expect(legalItems.some((i) => i.label.includes("RA 9646"))).toBe(true);
      expect(legalItems.some((i) => i.label.includes("Maceda Law"))).toBe(true);
      expect(legalItems.some((i) => i.label.includes("Notarization"))).toBe(true);
    });

    it("should include tax items", () => {
      const template = getPHComplianceTemplate();
      const taxItems = template.filter((i) => i.category === "tax");
      expect(taxItems.length).toBeGreaterThanOrEqual(4);
      expect(taxItems.some((i) => i.label.includes("CGT"))).toBe(true);
      expect(taxItems.some((i) => i.label.includes("DST"))).toBe(true);
      expect(taxItems.some((i) => i.label.includes("BIR"))).toBe(true);
      expect(taxItems.some((i) => i.label.includes("Transfer Tax"))).toBe(true);
    });

    it("should include documentary items", () => {
      const template = getPHComplianceTemplate();
      const docItems = template.filter((i) => i.category === "documentary");
      expect(docItems.length).toBeGreaterThanOrEqual(3);
      expect(docItems.some((i) => i.label.includes("Certificate of Title"))).toBe(true);
      expect(docItems.some((i) => i.label.includes("Tax Declaration"))).toBe(true);
      expect(docItems.some((i) => i.label.includes("Deed of Absolute"))).toBe(true);
    });

    it("should include financial items", () => {
      const template = getPHComplianceTemplate();
      const finItems = template.filter((i) => i.category === "financial");
      expect(finItems.length).toBeGreaterThanOrEqual(2);
      expect(finItems.some((i) => i.label.includes("Registration Fee"))).toBe(true);
      expect(finItems.some((i) => i.label.includes("Commission Receipt"))).toBe(true);
    });

    it("should set all items as not completed initially", () => {
      const template = getPHComplianceTemplate();
      template.forEach((item) => {
        expect(item.completed).toBe(false);
      });
    });

    it("should set all items as required", () => {
      const template = getPHComplianceTemplate();
      template.forEach((item) => {
        expect(item.required).toBe(true);
      });
    });

    it("should assign unique ids to each item", () => {
      const template = getPHComplianceTemplate();
      const ids = template.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
