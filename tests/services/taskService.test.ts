import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  subscribeTasks,
  subscribeTasksByAssignee,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
} from "@/services/taskService";
import type { Task, TaskStatus, ChecklistItem } from "@/types";

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

// @/lib/firebase is already mocked in test-setup.ts with db: {},
// but re-declaring avoids reliance on order-of-setup.
vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// ─── Helpers ─────────────────────────────────────────────────────────

const now = Date.now();

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

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Follow up with client",
    description: "Call to discuss property options",
    status: "todo",
    priority: "high",
    assignedTo: "user-1",
    assignedName: "Alice",
    createdBy: "user-1",
    createdByName: "Alice",
    dueDate: now + 86400000,
    brokerId: "broker-1",
    checklist: [
      { id: "c1", text: "Prepare documents", checked: false },
      { id: "c2", text: "Send contract", checked: true },
    ],
    tags: ["urgent", "follow-up"],
    recurring: "none",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("taskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeTasks ─────────────────────────────────────────────

  describe("subscribeTasks", () => {
    it("should return a noop unsubscribe when brokerId is undefined", () => {
      const unsub = subscribeTasks(undefined);
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should subscribe to tasks for the given brokerId without filters", () => {
      const callback = vi.fn();
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      const unsub = subscribeTasks("broker-1", undefined, callback);

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "tasks");
      expect(mockWhere).toHaveBeenCalledWith("brokerId", "==", "broker-1");
      // After brokerId where, we add orderBy as a second constraint
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "tasks-collection",
        expect.any(Object),
        "orderBy-createdAt-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
      );
      expect(unsub).toBeInstanceOf(Function);
    });

    it("should include assignedTo filter when provided", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeTasks("broker-1", { assignedTo: "user-2" }, vi.fn());

      // brokerId where is in the initial array, then assignedTo is unshifted
      expect(mockWhere).toHaveBeenNthCalledWith(
        1,
        "brokerId",
        "==",
        "broker-1",
      );
      expect(mockWhere).toHaveBeenNthCalledWith(
        2,
        "assignedTo",
        "==",
        "user-2",
      );
    });

    it("should include status filter when provided", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeTasks("broker-1", { status: "in_progress" }, vi.fn());

      // brokerId where in initial array, then status is unshifted
      expect(mockWhere).toHaveBeenNthCalledWith(
        1,
        "brokerId",
        "==",
        "broker-1",
      );
      expect(mockWhere).toHaveBeenNthCalledWith(
        2,
        "status",
        "==",
        "in_progress",
      );
    });

    it("should include both assignedTo and status filters when both provided", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeTasks(
        "broker-1",
        { assignedTo: "user-3", status: "done" },
        vi.fn(),
      );

      // brokerId is 1st (initial array), assignedTo is 2nd (first unshift), status is 3rd (second unshift)
      expect(mockWhere).toHaveBeenNthCalledWith(
        1,
        "brokerId",
        "==",
        "broker-1",
      );
      expect(mockWhere).toHaveBeenNthCalledWith(
        2,
        "assignedTo",
        "==",
        "user-3",
      );
      expect(mockWhere).toHaveBeenNthCalledWith(3, "status", "==", "done");
    });

    it("should map snapshot docs to Task objects and invoke callback", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        { id: "t1", data: () => ({ title: "Task A", status: "todo" }) },
        { id: "t2", data: () => ({ title: "Task B", status: "in_progress" }) },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeTasks("broker-1", undefined, callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "t1", title: "Task A", status: "todo" },
        { id: "t2", title: "Task B", status: "in_progress" },
      ]);
    });

    it("should not invoke callback if none provided", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        { id: "t1", data: () => ({ title: "Task A" }) },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      // Should not throw when callback is undefined
      expect(() => {
        subscribeTasks("broker-1");
      }).not.toThrow();
    });

    it("should handle empty snapshot gracefully", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeTasks("broker-1", undefined, callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should return the unsubscribe function from onSnapshot", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribeTasks("broker-1", undefined, vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── subscribeTasksByAssignee ───────────────────────────────────

  describe("subscribeTasksByAssignee", () => {
    it("should return a noop unsubscribe when userId is undefined", () => {
      const unsub = subscribeTasksByAssignee(undefined);
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should query tasks assigned to the given userId", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeTasksByAssignee("user-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "tasks");
      expect(mockWhere).toHaveBeenCalledWith("assignedTo", "==", "user-1");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "tasks-collection",
        expect.any(Object),
        "orderBy-createdAt-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        { id: "t1", data: () => ({ title: "My Task", status: "todo" }) },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeTasksByAssignee("user-1", callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "t1", title: "My Task", status: "todo" },
      ]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeTasksByAssignee("user-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should not throw when callback is undefined", () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      expect(() => {
        subscribeTasksByAssignee("user-1");
      }).not.toThrow();
    });
  });

  // ─── createTask ─────────────────────────────────────────────────

  describe("createTask", () => {
    const taskInput = {
      title: "New task",
      description: "Do the thing",
      status: "todo" as TaskStatus,
      priority: "medium" as const,
      assignedTo: "user-2",
      assignedName: "Bob",
      createdBy: "user-1",
      createdByName: "Alice",
      dueDate: now + 172800000,
      brokerId: "broker-1",
      checklist: [] as ChecklistItem[],
      tags: ["general"] as string[],
      recurring: "none" as const,
    };

    it("should add a document with timestamps and return the new id", async () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockAddDoc.mockResolvedValue({ id: "new-task-id" });

      const id = await createTask(taskInput);

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "tasks");
      expect(mockAddDoc).toHaveBeenCalledWith(
        "tasks-collection",
        expect.objectContaining({
          ...taskInput,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      );
      expect(id).toBe("new-task-id");
    });

    it("should set createdAt and updatedAt to the same timestamp", async () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockAddDoc.mockImplementation((_col, data: Record<string, unknown>) => {
        // The implementation under test calls Date.now() once and destructures into both fields
        expect(data.createdAt).toEqual(data.updatedAt);
        expect(data.createdAt).toEqual(expect.any(Number));
        return { id: "task-123" };
      });

      await createTask(taskInput);
      // The assertion inside the mock runs during execution
    });

    it("should pass all provided fields to addDoc", async () => {
      mockCollection.mockReturnValue("tasks-collection");
      mockAddDoc.mockResolvedValue({ id: "task-1" });

      await createTask(taskInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.title).toBe("New task");
      expect(data.description).toBe("Do the thing");
      expect(data.status).toBe("todo");
      expect(data.priority).toBe("medium");
      expect(data.assignedTo).toBe("user-2");
      expect(data.assignedName).toBe("Bob");
      expect(data.createdBy).toBe("user-1");
      expect(data.createdByName).toBe("Alice");
      expect(data.brokerId).toBe("broker-1");
      expect(data.checklist).toEqual([]);
      expect(data.tags).toEqual(["general"]);
      expect(data.recurring).toBe("none");
    });
  });

  // ─── updateTask ─────────────────────────────────────────────────

  describe("updateTask", () => {
    it("should update the document with partial data and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "task-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTask("task-1", {
        title: "Updated title",
        priority: "urgent",
      });

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "tasks",
        "task-1",
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "task-1" },
        expect.objectContaining({
          title: "Updated title",
          priority: "urgent",
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should merge data without removing existing fields", async () => {
      mockDoc.mockReturnValue({ id: "task-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTask("task-1", { status: "done" });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toHaveProperty("status", "done");
      expect(data).toHaveProperty("updatedAt");
      expect(Object.keys(data)).toEqual(["status", "updatedAt"]);
    });

    it("should allow empty partial update", async () => {
      mockDoc.mockReturnValue({ id: "task-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTask("task-1", {});

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toEqual({ updatedAt: expect.any(Number) });
    });
  });

  // ─── deleteTask ─────────────────────────────────────────────────

  describe("deleteTask", () => {
    it("should delete the document by taskId", async () => {
      mockDoc.mockReturnValue({ id: "task-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteTask("task-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "tasks",
        "task-to-delete",
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "task-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });

  // ─── updateTaskStatus ───────────────────────────────────────────

  describe("updateTaskStatus", () => {
    it.each([
      ["todo", "in_progress"],
      ["todo", "done"],
      ["in_progress", "done"],
      ["in_progress", "todo"],
      ["done", "todo"],
      ["done", "in_progress"],
    ] as Array<[TaskStatus, TaskStatus]>)(
      "should transition from %s to %s",
      async (from, to) => {
        mockDoc.mockReturnValue({ id: "task-1" });
        mockUpdateDoc.mockResolvedValue(undefined);

        await updateTaskStatus("task-1", to);

        expect(mockDoc).toHaveBeenCalledWith(
          expect.anything(),
          "tasks",
          "task-1",
        );
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          { id: "task-1" },
          expect.objectContaining({
            status: to,
            updatedAt: expect.any(Number),
          }),
        );
      },
    );

    it("should only set status and updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "task-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTaskStatus("task-1", "done");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(Object.keys(data)).toEqual(["status", "updatedAt"]);
    });
  });

  // ─── updateTaskChecklist ────────────────────────────────────────

  describe("updateTaskChecklist", () => {
    const checklist: ChecklistItem[] = [
      { id: "c1", text: "Step 1", checked: true },
      { id: "c2", text: "Step 2", checked: false },
      { id: "c3", text: "Step 3", checked: false },
    ];

    it("should update the checklist and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "task-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTaskChecklist("task-1", checklist);

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "tasks",
        "task-1",
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "task-1" },
        expect.objectContaining({
          checklist,
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should accept an empty checklist", async () => {
      mockDoc.mockReturnValue({ id: "task-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTaskChecklist("task-1", []);

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.checklist).toEqual([]);
    });

    it("should only set checklist and updatedAt fields", async () => {
      mockDoc.mockReturnValue({ id: "task-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTaskChecklist("task-1", checklist);

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(Object.keys(data)).toEqual(["checklist", "updatedAt"]);
    });

    it("should preserve checkbox states in checklist items", async () => {
      mockDoc.mockReturnValue({ id: "task-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      const mixedChecklist: ChecklistItem[] = [
        { id: "c1", text: "Done item", checked: true },
        { id: "c2", text: "Pending item", checked: false },
      ];

      await updateTaskChecklist("task-1", mixedChecklist);

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.checklist).toHaveLength(2);
      expect(data.checklist[0]).toEqual({
        id: "c1",
        text: "Done item",
        checked: true,
      });
      expect(data.checklist[1]).toEqual({
        id: "c2",
        text: "Pending item",
        checked: false,
      });
    });
  });
});
