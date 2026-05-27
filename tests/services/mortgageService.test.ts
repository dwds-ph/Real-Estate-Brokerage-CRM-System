import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDefaultStages,
  createMortgage,
  updateMortgage,
  deleteMortgage,
  getNextStage,
  getPreviousStage,
  advanceMortgageStage,
  updateStageNotes,
  fetchMortgagesByDeal,
  STAGE_ORDER,
  MORTGAGE_STAGES,
  BANKS,
} from "@/services/mortgageService";
import type { Mortgage, MortgageStage } from "@/types";

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "collection-ref"),
  query: vi.fn(() => "query-ref"),
  where: vi.fn(() => "where-constraint"),
  orderBy: vi.fn(() => "orderBy-constraint"),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, _coll, id) => ({ id })),
}));

const { getDocs, addDoc, updateDoc, deleteDoc } = await import("firebase/firestore");

describe("mortgageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BANKS", () => {
    it("should contain predefined bank profiles", () => {
      expect(BANKS).toHaveLength(5);
      expect(BANKS[0].name).toBe("BPI");
      expect(BANKS[2].name).toBe("Metrobank");
      expect(BANKS[4].name).toBe("EastWest");
    });

    it("each bank should have required fields", () => {
      BANKS.forEach((bank) => {
        expect(bank).toHaveProperty("id");
        expect(bank).toHaveProperty("name");
        expect(bank).toHaveProperty("typicalRate");
        expect(bank).toHaveProperty("estimatedTimelineDays");
      });
    });
  });

  describe("MORTGAGE_STAGES", () => {
    it("should have correct stage definitions", () => {
      expect(MORTGAGE_STAGES).toHaveLength(5);
      expect(MORTGAGE_STAGES[0].key).toBe("application");
      expect(MORTGAGE_STAGES[4].key).toBe("loan-release");
    });
  });

  describe("STAGE_ORDER", () => {
    it("should define correct stage progression", () => {
      expect(STAGE_ORDER).toEqual([
        "application",
        "bank-evaluation",
        "bir-docs",
        "rod",
        "loan-release",
      ]);
    });
  });

  describe("createDefaultStages", () => {
    it("should create stages with first as in-progress and rest as pending", () => {
      const stages = createDefaultStages();
      expect(stages).toHaveLength(5);

      expect(stages[0].key).toBe("application");
      expect(stages[0].status).toBe("in-progress");
      expect(stages[0].startedAt).toBeDefined();

      expect(stages[1].status).toBe("pending");
      expect(stages[2].status).toBe("pending");
      expect(stages[3].status).toBe("pending");
      expect(stages[4].status).toBe("pending");
    });

    it("should include labels from MORTGAGE_STAGES", () => {
      const stages = createDefaultStages();
      expect(stages[1].label).toBe("Bank Evaluation");
      expect(stages[2].label).toBe("BIR Docs");
    });

    it("should not have completedAt or notes initially", () => {
      const stages = createDefaultStages();
      stages.forEach((stage) => {
        expect(stage.completedAt).toBeUndefined();
        expect(stage.notes).toBeUndefined();
      });
    });
  });

  describe("getNextStage", () => {
    it("should return the next stage in order", () => {
      expect(getNextStage("application")).toBe("bank-evaluation");
      expect(getNextStage("bank-evaluation")).toBe("bir-docs");
      expect(getNextStage("bir-docs")).toBe("rod");
      expect(getNextStage("rod")).toBe("loan-release");
    });

    it("should return null for the last stage", () => {
      expect(getNextStage("loan-release")).toBeNull();
    });

    it("should return null for an unknown stage", () => {
      expect(getNextStage("unknown" as MortgageStage)).toBeNull();
    });
  });

  describe("getPreviousStage", () => {
    it("should return the previous stage in order", () => {
      expect(getPreviousStage("loan-release")).toBe("rod");
      expect(getPreviousStage("rod")).toBe("bir-docs");
      expect(getPreviousStage("bir-docs")).toBe("bank-evaluation");
      expect(getPreviousStage("bank-evaluation")).toBe("application");
    });

    it("should return null for the first stage", () => {
      expect(getPreviousStage("application")).toBeNull();
    });

    it("should return null for an unknown stage", () => {
      expect(getPreviousStage("unknown" as MortgageStage)).toBeNull();
    });
  });

  describe("createMortgage", () => {
    it("should create mortgage with default stages", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "mortgage-1" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const id = await createMortgage({
        dealId: "deal-1",
        bankId: "bpi",
        bankName: "BPI",
        loanAmount: 3000000,
      });

      expect(id).toBe("mortgage-1");
      expect(addDoc).toHaveBeenCalledWith(
        "collection-ref",
        expect.objectContaining({
          dealId: "deal-1",
          currentStage: "application",
          status: "ongoing",
          stages: expect.arrayContaining([
            expect.objectContaining({ key: "application", status: "in-progress" }),
          ]),
        }),
      );
    });
  });

  describe("updateMortgage", () => {
    it("should call updateDoc with mortgage id and data", async () => {
      await updateMortgage("mortgage-1", { loanAmount: 3500000 });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mortgage-1" }),
        expect.objectContaining({
          loanAmount: 3500000,
          updatedAt: expect.any(Number),
        }),
      );
    });
  });

  describe("deleteMortgage", () => {
    it("should call deleteDoc with mortgage id", async () => {
      await deleteMortgage("mortgage-1");
      expect(deleteDoc).toHaveBeenCalledOnce();
    });
  });

  describe("advanceMortgageStage", () => {
    const createMockMortgage = (currentStage: MortgageStage): Mortgage => ({
      id: "mortgage-1",
      dealId: "deal-1",
      bankId: "bpi",
      bankName: "BPI",
      loanAmount: 3000000,
      status: "ongoing",
      currentStage,
      stages: STAGE_ORDER.map((key, index) => ({
        key,
        label: MORTGAGE_STAGES.find((s) => s.key === key)?.label || key,
        status: index === 0 ? ("in-progress" as const) : ("pending" as const),
        startedAt: index === 0 ? 1000000 : undefined,
        completedAt: undefined,
        notes: undefined,
      })),
      createdAt: 1000000,
      updatedAt: 1000000,
    });

    it("should advance from current stage to next stage", async () => {
      const mortgage = createMockMortgage("application");

      await advanceMortgageStage("mortgage-1", mortgage);

      // Should update current stage to completed, next stage to in-progress
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mortgage-1" }),
        expect.objectContaining({
          currentStage: "bank-evaluation",
          stages: expect.arrayContaining([
            expect.objectContaining({ key: "application", status: "done" }),
            expect.objectContaining({ key: "bank-evaluation", status: "in-progress" }),
          ]),
        }),
      );
    });

    it("should include notes when advancing", async () => {
      const mortgage = createMockMortgage("application");

      await advanceMortgageStage("mortgage-1", mortgage, "All documents verified");

      const updateArg = vi.mocked(updateDoc).mock.calls[0][1] as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const appStage = updateArg.stages.find((s) => s.key === "application");
      expect(appStage.notes).toBe("All documents verified");
    });

    it("should throw error if already at final stage", async () => {
      const mortgage = createMockMortgage("loan-release");

      await expect(advanceMortgageStage("mortgage-1", mortgage)).rejects.toThrow(
        "Already at the final stage",
      );
    });
  });

  describe("updateStageNotes", () => {
    it("should update notes for a specific stage", async () => {
      const stages = createDefaultStages();

      await updateStageNotes("mortgage-1", stages, "application", "New notes");

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mortgage-1" }),
        expect.objectContaining({
          stages: expect.arrayContaining([
            expect.objectContaining({ key: "application", notes: "New notes" }),
          ]),
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should not modify other stages", async () => {
      const stages = createDefaultStages();

      await updateStageNotes("mortgage-1", stages, "application", "Notes");

      const updateArg = vi.mocked(updateDoc).mock.calls[0][1] as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const bankStage = updateArg.stages.find((s) => s.key === "bank-evaluation");
      expect(bankStage.notes).toBeUndefined();
    });
  });

  describe("fetchMortgagesByDeal", () => {
    it("should query mortgages by dealId", async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: "mort-1",
            data: () => ({ dealId: "deal-1", bankName: "BPI" }),
          },
        ],
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await fetchMortgagesByDeal("deal-1");
      expect(result).toHaveLength(1);
      expect(result[0].bankName).toBe("BPI");
    });

    it("should return empty array when no mortgages found", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await fetchMortgagesByDeal("deal-1");
      expect(result).toEqual([]);
    });
  });
});
