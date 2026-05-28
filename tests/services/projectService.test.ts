import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  subscribeProjects,
  subscribeProjectsForAgent,
  createProject,
  updateProject,
  deleteProject,
  subscribeUnits,
  subscribeUnitsByStatus,
  createUnit,
  updateUnit,
  deleteUnit,
  subscribeMilestones,
  subscribeProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  computeProjectStatus,
  getUnitStatusColor,
  getUnitStatusLabel,
  computePhaseSoldPercentage,
  getProjectStatusColor,
  getProjectStatusLabel,
  getMilestoneStatusColor,
  getMilestoneStatusLabel,
} from "@/services/projectService";
import type { Project, PaymentMilestone, ProjectStatus, UnitStatus } from "@/types";

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

const now = Date.now();

function makeMockSnapshot(docs: Array<{ id: string; data: () => Record<string, unknown> }>) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: d.data,
      exists: true,
    })),
  };
}

function sampleProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    name: "Sunrise Residences",
    developer: "ABC Developers",
    developerContact: "+639****0000",
    location: {
      address: "123 Sunrise Ave",
      city: "Quezon City",
      province: "NCR",
    },
    description: "A premier residential development",
    status: "ongoing",
    projectType: "condo",
    totalUnits: 100,
    availableUnits: 40,
    priceRange: { min: 3000000, max: 8000000 },
    phases: [
      {
        id: "phase-1",
        name: "Phase 1",
        status: "ongoing",
        totalUnits: 50,
        availableUnits: 20,
        priceRange: { min: 3000000, max: 5000000 },
      },
      {
        id: "phase-2",
        name: "Phase 2",
        status: "pre-selling",
        totalUnits: 50,
        availableUnits: 50,
        priceRange: { min: 5000000, max: 8000000 },
      },
    ],
    amenities: ["pool", "gym", "parking"],
    media: ["img1.jpg", "img2.jpg"],
    commissionRate: 3,
    assignedTo: ["agent-1", "agent-2"],
    createdBy: "user-1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("projectService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeProjects ─────────────────────────────────────────

  describe("subscribeProjects", () => {
    it("should query all projects ordered by createdAt desc", () => {
      mockCollection.mockReturnValue("projects-collection");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeProjects(vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "projects");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockQuery).toHaveBeenCalledWith("projects-collection", "orderBy-createdAt-desc");
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot docs to Project objects and invoke callback", () => {
      mockCollection.mockReturnValue("projects-collection");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        { id: "p1", data: () => ({ name: "Project A", status: "ongoing" }) },
        {
          id: "p2",
          data: () => ({ name: "Project B", status: "pre-selling" }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeProjects(callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "p1", name: "Project A", status: "ongoing" },
        { id: "p2", name: "Project B", status: "pre-selling" },
      ]);
    });

    it("should handle empty snapshot gracefully", () => {
      mockCollection.mockReturnValue("projects-collection");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeProjects(callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should return the unsubscribe function from onSnapshot", () => {
      mockCollection.mockReturnValue("projects-collection");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribeProjects(vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── subscribeProjectsForAgent ──────────────────────────────────

  describe("subscribeProjectsForAgent", () => {
    it("should query projects with array-contains filter on assignedTo", () => {
      mockCollection.mockReturnValue("projects-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeProjectsForAgent("agent-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "projects");
      expect(mockWhere).toHaveBeenCalledWith("assignedTo", "array-contains", "agent-1");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "projects-collection",
        expect.objectContaining({
          field: "assignedTo",
          op: "array-contains",
          val: "agent-1",
        }),
        "orderBy-createdAt-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("projects-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        { id: "p1", data: () => ({ name: "My Project", status: "ongoing" }) },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeProjectsForAgent("agent-1", callback);

      expect(callback).toHaveBeenCalledWith([{ id: "p1", name: "My Project", status: "ongoing" }]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("projects-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeProjectsForAgent("agent-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  // ─── createProject ──────────────────────────────────────────────

  describe("createProject", () => {
    const projectInput = {
      name: "New Project",
      developer: "Developer Inc",
      developerContact: "+639****1111",
      location: { address: "456 New St", city: "Manila", province: "NCR" },
      description: "Brand new development",
      status: "pre-selling" as ProjectStatus,
      projectType: "subdivision" as const,
      totalUnits: 80,
      availableUnits: 80,
      priceRange: { min: 2000000, max: 5000000 },
      phases: [],
      amenities: ["park"],
      media: [],
      commissionRate: 2.5,
      assignedTo: ["agent-1"],
      createdBy: "user-1",
    };

    it("should add a document with timestamps and return the new id", async () => {
      mockCollection.mockReturnValue("projects-collection");
      mockAddDoc.mockResolvedValue({ id: "new-project-id" });

      const id = await createProject(projectInput);

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "projects");
      expect(mockAddDoc).toHaveBeenCalledWith(
        "projects-collection",
        expect.objectContaining({
          ...projectInput,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      );
      expect(id).toBe("new-project-id");
    });

    it("should set createdAt and updatedAt to the same timestamp", async () => {
      mockCollection.mockReturnValue("projects-collection");
      mockAddDoc.mockImplementation((_col, data: Record<string, unknown>) => {
        expect(data.createdAt).toEqual(data.updatedAt);
        return { id: "proj-123" };
      });

      await createProject(projectInput);
    });

    it("should pass all provided fields to addDoc", async () => {
      mockCollection.mockReturnValue("projects-collection");
      mockAddDoc.mockResolvedValue({ id: "proj-1" });

      await createProject(projectInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.name).toBe("New Project");
      expect(data.developer).toBe("Developer Inc");
      expect(data.status).toBe("pre-selling");
      expect(data.totalUnits).toBe(80);
      expect(data.availableUnits).toBe(80);
      expect(data.location).toEqual({
        address: "456 New St",
        city: "Manila",
        province: "NCR",
      });
      expect(data.priceRange).toEqual({ min: 2000000, max: 5000000 });
      expect(data.phases).toEqual([]);
      expect(data.amenities).toEqual(["park"]);
      expect(data.commissionRate).toBe(2.5);
      expect(data.assignedTo).toEqual(["agent-1"]);
    });
  });

  // ─── updateProject ──────────────────────────────────────────────

  describe("updateProject", () => {
    it("should update the document with partial data and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "project-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateProject("project-1", {
        name: "Updated Project Name",
        status: "completed",
      });

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "projects", "project-1");
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "project-1" },
        expect.objectContaining({
          name: "Updated Project Name",
          status: "completed",
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should merge data without removing existing fields", async () => {
      mockDoc.mockReturnValue({ id: "project-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateProject("project-1", { availableUnits: 30 });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toHaveProperty("availableUnits", 30);
      expect(data).toHaveProperty("updatedAt");
      expect(Object.keys(data)).toEqual(["availableUnits", "updatedAt"]);
    });

    it("should allow empty partial update", async () => {
      mockDoc.mockReturnValue({ id: "project-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateProject("project-1", {});

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toEqual({ updatedAt: expect.any(Number) });
    });
  });

  // ─── deleteProject ──────────────────────────────────────────────

  describe("deleteProject", () => {
    it("should delete the document by projectId", async () => {
      mockDoc.mockReturnValue({ id: "project-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteProject("project-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "projects", "project-to-delete");
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "project-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });

  // ─── subscribeUnits ─────────────────────────────────────────────

  describe("subscribeUnits", () => {
    it("should query units filtered by projectId and ordered by block asc", () => {
      mockCollection.mockReturnValue("units-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-block-asc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeUnits("project-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "units");
      expect(mockWhere).toHaveBeenCalledWith("projectId", "==", "project-1");
      expect(mockOrderBy).toHaveBeenCalledWith("block", "asc");
      expect(mockQuery).toHaveBeenCalledWith(
        "units-collection",
        expect.objectContaining({
          field: "projectId",
          op: "==",
          val: "project-1",
        }),
        "orderBy-block-asc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot docs to Unit objects and invoke callback", () => {
      mockCollection.mockReturnValue("units-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-block-asc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "u1",
          data: () => ({ block: "A", lot: "101", status: "available" }),
        },
        { id: "u2", data: () => ({ block: "A", lot: "102", status: "sold" }) },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeUnits("project-1", callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "u1", block: "A", lot: "101", status: "available" },
        { id: "u2", block: "A", lot: "102", status: "sold" },
      ]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("units-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-block-asc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeUnits("project-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  // ─── subscribeUnitsByStatus ─────────────────────────────────────

  describe("subscribeUnitsByStatus", () => {
    it("should query units filtered by projectId and status, ordered by createdAt desc", () => {
      mockCollection.mockReturnValue("units-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeUnitsByStatus("project-1", "available", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "units");
      expect(mockWhere).toHaveBeenCalledWith("projectId", "==", "project-1");
      expect(mockWhere).toHaveBeenCalledWith("status", "==", "available");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "units-collection",
        expect.objectContaining({
          field: "projectId",
          op: "==",
          val: "project-1",
        }),
        expect.objectContaining({
          field: "status",
          op: "==",
          val: "available",
        }),
        "orderBy-createdAt-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("units-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        { id: "u1", data: () => ({ block: "B", status: "reserved" }) },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeUnitsByStatus("project-1", "reserved", callback);

      expect(callback).toHaveBeenCalledWith([{ id: "u1", block: "B", status: "reserved" }]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("units-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      subscribeUnitsByStatus("project-1", "sold", vi.fn());
    });
  });

  // ─── createUnit ─────────────────────────────────────────────────

  describe("createUnit", () => {
    const unitInput = {
      projectId: "project-1",
      projectName: "Sunrise Residences",
      phaseId: "phase-1",
      phaseName: "Phase 1",
      block: "C",
      lot: "201",
      floor: 10,
      model: "Two-Bedroom",
      area: 50,
      price: 5000000,
      status: "available" as UnitStatus,
      buyerName: undefined,
      buyerContact: undefined,
      agentId: undefined,
      agentName: undefined,
      dealId: undefined,
      notes: undefined,
      createdBy: "user-1",
    };

    it("should add a unit document with timestamps", async () => {
      mockCollection.mockReturnValue("units-collection");
      mockAddDoc.mockResolvedValue({ id: "new-unit-id" });

      const id = await createUnit(unitInput);

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "units");
      expect(mockAddDoc).toHaveBeenCalledWith(
        "units-collection",
        expect.objectContaining({
          ...unitInput,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      );
      expect(id).toBe("new-unit-id");
    });

    it("should set createdAt and updatedAt to the same timestamp", async () => {
      mockCollection.mockReturnValue("units-collection");
      mockAddDoc.mockImplementation((_col, data: Record<string, unknown>) => {
        expect(data.createdAt).toEqual(data.updatedAt);
        return { id: "unit-123" };
      });

      await createUnit(unitInput);
    });

    it("should pass all required unit fields", async () => {
      mockCollection.mockReturnValue("units-collection");
      mockAddDoc.mockResolvedValue({ id: "unit-1" });

      await createUnit(unitInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.projectId).toBe("project-1");
      expect(data.block).toBe("C");
      expect(data.lot).toBe("201");
      expect(data.area).toBe(50);
      expect(data.price).toBe(5000000);
      expect(data.status).toBe("available");
      expect(data.floor).toBe(10);
      expect(data.model).toBe("Two-Bedroom");
    });
  });

  // ─── updateUnit ─────────────────────────────────────────────────

  describe("updateUnit", () => {
    it("should update the unit document with partial data and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "unit-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateUnit("unit-1", {
        status: "sold",
        buyerName: "Juan Dela Cruz",
      });

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "units", "unit-1");
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "unit-1" },
        expect.objectContaining({
          status: "sold",
          buyerName: "Juan Dela Cruz",
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should allow empty partial update", async () => {
      mockDoc.mockReturnValue({ id: "unit-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateUnit("unit-1", {});

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toEqual({ updatedAt: expect.any(Number) });
    });
  });

  // ─── deleteUnit ─────────────────────────────────────────────────

  describe("deleteUnit", () => {
    it("should delete the unit document by unitId", async () => {
      mockDoc.mockReturnValue({ id: "unit-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteUnit("unit-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "units", "unit-to-delete");
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "unit-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });

  // ─── subscribeMilestones ────────────────────────────────────────

  describe("subscribeMilestones", () => {
    it("should query milestones filtered by unitId and ordered by dueDate asc", () => {
      mockCollection.mockReturnValue("milestones-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeMilestones("unit-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "paymentMilestones");
      expect(mockWhere).toHaveBeenCalledWith("unitId", "==", "unit-1");
      expect(mockOrderBy).toHaveBeenCalledWith("dueDate", "asc");
      expect(mockQuery).toHaveBeenCalledWith(
        "milestones-collection",
        expect.objectContaining({ field: "unitId", op: "==", val: "unit-1" }),
        "orderBy-dueDate-asc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("milestones-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "m1",
          data: () => ({
            name: "Downpayment",
            amount: 200000,
            status: "pending",
          }),
        },
        {
          id: "m2",
          data: () => ({
            name: "Final Payment",
            amount: 500000,
            status: "pending",
          }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeMilestones("unit-1", callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "m1", name: "Downpayment", amount: 200000, status: "pending" },
        { id: "m2", name: "Final Payment", amount: 500000, status: "pending" },
      ]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("milestones-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeMilestones("unit-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  // ─── subscribeProjectMilestones ─────────────────────────────────

  describe("subscribeProjectMilestones", () => {
    it("should query milestones filtered by projectId and ordered by dueDate asc", () => {
      mockCollection.mockReturnValue("milestones-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeProjectMilestones("project-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "paymentMilestones");
      expect(mockWhere).toHaveBeenCalledWith("projectId", "==", "project-1");
      expect(mockOrderBy).toHaveBeenCalledWith("dueDate", "asc");
      expect(mockQuery).toHaveBeenCalledWith(
        "milestones-collection",
        expect.objectContaining({
          field: "projectId",
          op: "==",
          val: "project-1",
        }),
        "orderBy-dueDate-asc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("milestones-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        { id: "m1", data: () => ({ name: "Reservation", status: "paid" }) },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeProjectMilestones("project-1", callback);

      expect(callback).toHaveBeenCalledWith([{ id: "m1", name: "Reservation", status: "paid" }]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("milestones-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      subscribeProjectMilestones("project-1", vi.fn());
    });
  });

  // ─── createMilestone ────────────────────────────────────────────

  describe("createMilestone", () => {
    const milestoneInput = {
      projectId: "project-1",
      unitId: "unit-1",
      name: "Equity Payment",
      amount: 100000,
      dueDate: now + 604800000,
      paidDate: undefined,
      status: "pending" as const,
      notes: "First equity payment",
    };

    it("should add a milestone document with timestamps", async () => {
      mockCollection.mockReturnValue("milestones-collection");
      mockAddDoc.mockResolvedValue({ id: "new-milestone-id" });

      const id = await createMilestone(milestoneInput);

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "paymentMilestones");
      expect(mockAddDoc).toHaveBeenCalledWith(
        "milestones-collection",
        expect.objectContaining({
          ...milestoneInput,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      );
      expect(id).toBe("new-milestone-id");
    });

    it("should set createdAt and updatedAt to the same timestamp", async () => {
      mockCollection.mockReturnValue("milestones-collection");
      mockAddDoc.mockImplementation((_col, data: Record<string, unknown>) => {
        expect(data.createdAt).toEqual(data.updatedAt);
        return { id: "ms-123" };
      });

      await createMilestone(milestoneInput);
    });

    it("should pass all milestone fields", async () => {
      mockCollection.mockReturnValue("milestones-collection");
      mockAddDoc.mockResolvedValue({ id: "ms-1" });

      await createMilestone(milestoneInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.projectId).toBe("project-1");
      expect(data.unitId).toBe("unit-1");
      expect(data.name).toBe("Equity Payment");
      expect(data.amount).toBe(100000);
      expect(data.status).toBe("pending");
      expect(data.notes).toBe("First equity payment");
    });
  });

  // ─── updateMilestone ────────────────────────────────────────────

  describe("updateMilestone", () => {
    it("should update the milestone document with partial data and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "milestone-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateMilestone("milestone-1", { status: "paid", paidDate: now });

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "paymentMilestones", "milestone-1");
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "milestone-1" },
        expect.objectContaining({
          status: "paid",
          paidDate: now,
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should allow empty partial update", async () => {
      mockDoc.mockReturnValue({ id: "milestone-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateMilestone("milestone-1", {});

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toEqual({ updatedAt: expect.any(Number) });
    });
  });

  // ─── deleteMilestone ────────────────────────────────────────────

  describe("deleteMilestone", () => {
    it("should delete the milestone document by milestoneId", async () => {
      mockDoc.mockReturnValue({ id: "milestone-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteMilestone("milestone-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "paymentMilestones",
        "milestone-to-delete",
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "milestone-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });

  // ─── computeProjectStatus ───────────────────────────────────────

  describe("computeProjectStatus", () => {
    it("should return 'completed' when project status is 'completed'", () => {
      const project = sampleProject({ status: "completed" });
      expect(computeProjectStatus(project)).toBe("completed");
    });

    it("should return 'on-hold' when project status is 'on-hold'", () => {
      const project = sampleProject({ status: "on-hold" });
      expect(computeProjectStatus(project)).toBe("on-hold");
    });

    it("should return 'fully-sold' when sell-through rate is >= 1", () => {
      const project = sampleProject({
        status: "ongoing",
        totalUnits: 100,
        availableUnits: 0,
      });
      expect(computeProjectStatus(project)).toBe("fully-sold");
    });

    it("should return 'pre-selling-high-demand' when pre-selling and sell-through > 0.7", () => {
      const project = sampleProject({
        status: "pre-selling",
        totalUnits: 100,
        availableUnits: 20, // sold 80, rate = 0.8
      });
      expect(computeProjectStatus(project)).toBe("pre-selling-high-demand");
    });

    it("should return 'pre-selling' when pre-selling and sell-through <= 0.7", () => {
      const project = sampleProject({
        status: "pre-selling",
        totalUnits: 100,
        availableUnits: 40, // sold 60, rate = 0.6
      });
      expect(computeProjectStatus(project)).toBe("pre-selling");
    });

    it("should return 'pre-selling' when pre-selling and sell-through exactly 0.7", () => {
      const project = sampleProject({
        status: "pre-selling",
        totalUnits: 100,
        availableUnits: 30, // sold 70, rate = 0.7
      });
      // 0.7 is NOT > 0.7, so should stay "pre-selling"
      expect(computeProjectStatus(project)).toBe("pre-selling");
    });

    it("should return original status for ongoing when not fully-sold", () => {
      const project = sampleProject({
        status: "ongoing",
        totalUnits: 100,
        availableUnits: 50,
      });
      expect(computeProjectStatus(project)).toBe("ongoing");
    });

    it("should return 'fully-sold' when ongoing and no available units", () => {
      const project = sampleProject({
        status: "ongoing",
        totalUnits: 100,
        availableUnits: 0,
      });
      expect(computeProjectStatus(project)).toBe("fully-sold");
    });

    it("should handle zero totalUnits to avoid division by zero", () => {
      const project = sampleProject({
        status: "pre-selling",
        totalUnits: 0,
        availableUnits: 0,
      });
      expect(computeProjectStatus(project)).toBe("pre-selling");
    });
  });

  // ─── getUnitStatusColor ─────────────────────────────────────────

  describe("getUnitStatusColor", () => {
    it("should return correct color for available status", () => {
      const color = getUnitStatusColor("available");
      expect(color).toContain("bg-green-100");
    });

    it("should return correct color for reserved status", () => {
      const color = getUnitStatusColor("reserved");
      expect(color).toContain("bg-yellow-100");
    });

    it("should return correct color for sold status", () => {
      const color = getUnitStatusColor("sold");
      expect(color).toContain("bg-purple-100");
    });

    it("should return correct color for under-contract status", () => {
      const color = getUnitStatusColor("under-contract");
      expect(color).toContain("bg-blue-100");
    });

    it("should return correct color for blocked status", () => {
      const color = getUnitStatusColor("blocked");
      expect(color).toContain("bg-gray-100");
    });

    it("should fall back to available color for unknown status", () => {
      const color = getUnitStatusColor("unknown" as UnitStatus);
      expect(color).toContain("bg-green-100");
    });
  });

  // ─── getUnitStatusLabel ─────────────────────────────────────────

  describe("getUnitStatusLabel", () => {
    it("should return 'Available' for available status", () => {
      expect(getUnitStatusLabel("available")).toBe("Available");
    });

    it("should return 'Reserved' for reserved status", () => {
      expect(getUnitStatusLabel("reserved")).toBe("Reserved");
    });

    it("should return 'Sold' for sold status", () => {
      expect(getUnitStatusLabel("sold")).toBe("Sold");
    });

    it("should return 'Under Contract' for under-contract status", () => {
      expect(getUnitStatusLabel("under-contract")).toBe("Under Contract");
    });

    it("should return 'Blocked' for blocked status", () => {
      expect(getUnitStatusLabel("blocked")).toBe("Blocked");
    });

    it("should return raw status for unknown status", () => {
      expect(getUnitStatusLabel("unknown" as UnitStatus)).toBe("unknown");
    });
  });

  // ─── computePhaseSoldPercentage ─────────────────────────────────

  describe("computePhaseSoldPercentage", () => {
    it("should calculate correct percentage when units are sold", () => {
      const phase = { totalUnits: 100, availableUnits: 30 };
      // sold = 70, percentage = 70%
      expect(computePhaseSoldPercentage(phase)).toBe(70);
    });

    it("should return 0 when no units are sold", () => {
      const phase = { totalUnits: 100, availableUnits: 100 };
      expect(computePhaseSoldPercentage(phase)).toBe(0);
    });

    it("should return 100 when all units are sold", () => {
      const phase = { totalUnits: 100, availableUnits: 0 };
      expect(computePhaseSoldPercentage(phase)).toBe(100);
    });

    it("should return 0 when totalUnits is 0", () => {
      const phase = { totalUnits: 0, availableUnits: 0 };
      expect(computePhaseSoldPercentage(phase)).toBe(0);
    });

    it("should round the percentage to nearest integer", () => {
      const phase = { totalUnits: 3, availableUnits: 1 };
      // sold = 2, percentage = 66.666... -> 67
      expect(computePhaseSoldPercentage(phase)).toBe(67);
    });

    it("should handle fractional percentages correctly", () => {
      const phase = { totalUnits: 7, availableUnits: 3 };
      // sold = 4, percentage = 57.142857... -> 57
      expect(computePhaseSoldPercentage(phase)).toBe(57);
    });
  });

  // ─── getProjectStatusColor ──────────────────────────────────────

  describe("getProjectStatusColor", () => {
    it("should return correct color for pre-selling status", () => {
      const color = getProjectStatusColor("pre-selling");
      expect(color).toContain("bg-blue-100");
    });

    it("should return correct color for ongoing status", () => {
      const color = getProjectStatusColor("ongoing");
      expect(color).toContain("bg-green-100");
    });

    it("should return correct color for completed status", () => {
      const color = getProjectStatusColor("completed");
      expect(color).toContain("bg-purple-100");
    });

    it("should return correct color for on-hold status", () => {
      const color = getProjectStatusColor("on-hold");
      expect(color).toContain("bg-yellow-100");
    });

    it("should fall back to ongoing color for unknown status", () => {
      const color = getProjectStatusColor("unknown" as ProjectStatus);
      expect(color).toContain("bg-green-100");
    });
  });

  // ─── getProjectStatusLabel ──────────────────────────────────────

  describe("getProjectStatusLabel", () => {
    it("should return 'Pre-Selling' for pre-selling status", () => {
      expect(getProjectStatusLabel("pre-selling")).toBe("Pre-Selling");
    });

    it("should return 'Ongoing' for ongoing status", () => {
      expect(getProjectStatusLabel("ongoing")).toBe("Ongoing");
    });

    it("should return 'Completed' for completed status", () => {
      expect(getProjectStatusLabel("completed")).toBe("Completed");
    });

    it("should return 'On Hold' for on-hold status", () => {
      expect(getProjectStatusLabel("on-hold")).toBe("On Hold");
    });

    it("should return raw status for unknown status", () => {
      expect(getProjectStatusLabel("unknown" as ProjectStatus)).toBe("unknown");
    });
  });

  // ─── getMilestoneStatusColor ────────────────────────────────────

  describe("getMilestoneStatusColor", () => {
    it("should return correct color for pending status", () => {
      const color = getMilestoneStatusColor("pending");
      expect(color).toContain("bg-gray-100");
    });

    it("should return correct color for paid status", () => {
      const color = getMilestoneStatusColor("paid");
      expect(color).toContain("bg-green-100");
    });

    it("should return correct color for overdue status", () => {
      const color = getMilestoneStatusColor("overdue");
      expect(color).toContain("bg-red-100");
    });

    it("should return correct color for waived status", () => {
      const color = getMilestoneStatusColor("waived");
      expect(color).toContain("bg-yellow-100");
    });

    it("should fall back to pending color for unknown status", () => {
      const color = getMilestoneStatusColor("unknown" as PaymentMilestone["status"]);
      expect(color).toContain("bg-gray-100");
    });
  });

  // ─── getMilestoneStatusLabel ────────────────────────────────────

  describe("getMilestoneStatusLabel", () => {
    it("should return 'Pending' for pending status", () => {
      expect(getMilestoneStatusLabel("pending")).toBe("Pending");
    });

    it("should return 'Paid' for paid status", () => {
      expect(getMilestoneStatusLabel("paid")).toBe("Paid");
    });

    it("should return 'Overdue' for overdue status", () => {
      expect(getMilestoneStatusLabel("overdue")).toBe("Overdue");
    });

    it("should return 'Waived' for waived status", () => {
      expect(getMilestoneStatusLabel("waived")).toBe("Waived");
    });

    it("should return raw status for unknown status", () => {
      expect(getMilestoneStatusLabel("unknown" as PaymentMilestone["status"])).toBe("unknown");
    });
  });
});
