import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  subscribeTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "@/services/teamService";

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
  COLLECTIONS: { TEAMS: "teams" },
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

// ─── Tests ────────────────────────────────────────────────────────────

describe("teamService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeTeams ─────────────────────────────────────────────

  describe("subscribeTeams", () => {
    it("should return a noop unsubscribe when brokerId is undefined", () => {
      const unsub = subscribeTeams(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockSubscribeToQuery).not.toHaveBeenCalled();
    });

    it("should subscribe to teams collection with a callback", () => {
      subscribeTeams("broker-1", vi.fn());

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "teams",
        expect.any(Array),
        expect.any(Function),
      );
    });

    it("should pass a non-empty constraints array", () => {
      subscribeTeams("broker-1", vi.fn());

      const constraints = mockSubscribeToQuery.mock.calls[0][1];
      expect(Array.isArray(constraints)).toBe(true);
      expect(constraints.length).toBeGreaterThan(0);
    });

    it("should pass the callback to subscribeToQuery", () => {
      const callback = vi.fn();
      subscribeTeams("broker-1", callback);

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "teams",
        expect.any(Array),
        callback,
      );
    });

    it("should return the unsubscribe function from subscribeToQuery", () => {
      const mockUnsub = vi.fn();
      mockSubscribeToQuery.mockReturnValue(mockUnsub);

      const unsub = subscribeTeams("broker-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });

    it("should handle empty brokerId gracefully", () => {
      const unsub = subscribeTeams(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
    });
  });

  // ─── createTeam ─────────────────────────────────────────────────

  describe("createTeam", () => {
    const teamInput = {
      name: "Alpha Squad",
      description: "Top-performing residential team",
      teamLeadId: "agent-1",
      teamLeadName: "Juan Dela Cruz",
      memberIds: ["agent-1", "agent-2", "agent-3"],
      brokerId: "broker-1",
    };

    it("should create a document and return the new id", async () => {
      mockCreateDocument.mockResolvedValue("new-team-id");

      const id = await createTeam(teamInput);

      expect(mockCreateDocument).toHaveBeenCalledWith("teams", teamInput);
      expect(id).toBe("new-team-id");
    });

    it("should pass all fields to createDocument", async () => {
      mockCreateDocument.mockResolvedValue("id");

      await createTeam(teamInput);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data).toMatchObject(teamInput);
      expect(data.memberIds).toHaveLength(3);
    });

    it("should handle minimal team without description", async () => {
      mockCreateDocument.mockResolvedValue("id");

      const minimal = {
        name: "Minimal Team",
        teamLeadId: "agent-1",
        memberIds: ["agent-1"],
        brokerId: "broker-1",
      };

      await createTeam(minimal);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data.name).toBe("Minimal Team");
      expect(data.description).toBeUndefined();
    });

    it("should handle empty memberIds array", async () => {
      mockCreateDocument.mockResolvedValue("id");

      const emptyTeam = {
        name: "Empty Team",
        teamLeadId: "agent-1",
        memberIds: [],
        brokerId: "broker-1",
      };

      await createTeam(emptyTeam);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data.memberIds).toEqual([]);
    });

    it("should handle error from createDocument", async () => {
      mockCreateDocument.mockRejectedValue(new Error("Firestore error"));

      await expect(createTeam(teamInput)).rejects.toThrow("Firestore error");
    });
  });

  // ─── updateTeam ─────────────────────────────────────────────────

  describe("updateTeam", () => {
    it("should update the document with partial data", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateTeam("team-1", {
        name: "Beta Squad",
        description: "Updated description",
      });

      expect(mockUpdateDocument).toHaveBeenCalledWith("teams", "team-1", {
        name: "Beta Squad",
        description: "Updated description",
      });
    });

    it("should allow updating memberIds only", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateTeam("team-1", {
        memberIds: ["agent-1", "agent-4"],
      });

      expect(mockUpdateDocument).toHaveBeenCalledWith("teams", "team-1", {
        memberIds: ["agent-1", "agent-4"],
      });
    });

    it("should handle error from updateDocument", async () => {
      mockUpdateDocument.mockRejectedValue(new Error("Update failed"));

      await expect(
        updateTeam("team-1", { name: "New Name" }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ─── deleteTeam ─────────────────────────────────────────────────

  describe("deleteTeam", () => {
    it("should delete the document by id", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await deleteTeam("team-to-delete");

      expect(mockDeleteDocument).toHaveBeenCalledWith("teams", "team-to-delete");
    });

    it("should resolve successfully on deletion", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await expect(deleteTeam("team-1")).resolves.toBeUndefined();
    });

    it("should handle error from deleteDocument", async () => {
      mockDeleteDocument.mockRejectedValue(new Error("Delete failed"));

      await expect(deleteTeam("team-1")).rejects.toThrow("Delete failed");
    });
  });
});
