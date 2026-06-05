import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRoutingConfig,
  saveRoutingConfig,
  findNextAgent,
  autoAssignLead,
  type RoutingConfig,
  type LeadRoutingRule,
} from "@/services/leadRoutingService";
import type { Lead, AppUser } from "@/types";

// ─── Mock firebase/firestore ─────────────────────────────────────────────

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, _coll, id) => ({ id })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

const { getDoc, setDoc, updateDoc } = await import("firebase/firestore");

// ─── Tests ────────────────────────────────────────────────────────────────

describe("leadRoutingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Helpers ─────────────────────────────────────────────────────────

  const mockAgents: AppUser[] = [
    { id: "agent-1", displayName: "Alice", role: "agent", isActive: true, email: "alice@test.com", createdAt: 100 } as AppUser,
    { id: "agent-2", displayName: "Bob", role: "agent", isActive: true, email: "bob@test.com", createdAt: 200 } as AppUser,
    { id: "agent-3", displayName: "Charlie", role: "agent", isActive: true, email: "charlie@test.com", createdAt: 300 } as AppUser,
  ];

  function mockConfigDoc(config: RoutingConfig | null): void {
    if (config === null) {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);
    } else {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => config,
      } as any);
    }
  }

  // ─── getRoutingConfig ────────────────────────────────────────────

  describe("getRoutingConfig", () => {
    it("should return routing config when document exists", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [{ type: "round-robin", agentIds: ["agent-1", "agent-2"], currentIndex: 0 }],
      };
      mockConfigDoc(config);

      const result = await getRoutingConfig();
      expect(result).toEqual(config);
    });

    it("should return null when document does not exist", async () => {
      mockConfigDoc(null);

      const result = await getRoutingConfig();
      expect(result).toBeNull();
    });

    it("should return config with no rules when saved with empty rules", async () => {
      const config: RoutingConfig = { enabled: true, rules: [] };
      mockConfigDoc(config);

      const result = await getRoutingConfig();
      expect(result).toEqual(config);
      expect(result!.rules).toHaveLength(0);
    });

    it("should return disabled config", async () => {
      const config: RoutingConfig = { enabled: false, rules: [] };
      mockConfigDoc(config);

      const result = await getRoutingConfig();
      expect(result).toEqual(config);
      expect(result!.enabled).toBe(false);
    });

    it("should call doc with the correct collection and document id", async () => {
      const { doc } = await import("firebase/firestore");
      mockConfigDoc({ enabled: true, rules: [] });

      await getRoutingConfig();

      expect(doc).toHaveBeenCalledWith(expect.anything(), "routingConfigs", "leadRoutingConfig");
    });

    it("should propagate Firestore errors", async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error("Firestore permission denied"));

      await expect(getRoutingConfig()).rejects.toThrow("Firestore permission denied");
    });
  });

  // ─── saveRoutingConfig ───────────────────────────────────────────

  describe("saveRoutingConfig", () => {
    it("should call setDoc with config data", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [],
      };

      await saveRoutingConfig(config);
      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "leadRoutingConfig" }),
        config,
      );
    });

    it("should save config with round-robin rule", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1", "agent-2", "agent-3"], currentIndex: 0 },
        ],
      };

      await saveRoutingConfig(config);
      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "leadRoutingConfig" }),
        config,
      );
    });

    it("should save config with specialty rule", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "specialty", specialtyMap: { condo: "agent-1", "house-lot": "agent-2" } },
        ],
      };

      await saveRoutingConfig(config);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          enabled: true,
          rules: expect.arrayContaining([
            expect.objectContaining({ type: "specialty" }),
          ]),
        }),
      );
    });

    it("should save config with location rule", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "location", locationMap: { makati: "agent-1", quezon: "agent-2" } },
        ],
      };

      await saveRoutingConfig(config);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({ type: "location" }),
          ]),
        }),
      );
    });

    it("should propagate Firestore errors", async () => {
      vi.mocked(setDoc).mockRejectedValue(new Error("SetDoc failed"));

      await expect(saveRoutingConfig({ enabled: true, rules: [] })).rejects.toThrow("SetDoc failed");
    });
  });

  // ─── findNextAgent ───────────────────────────────────────────────

  describe("findNextAgent", () => {
    it("should return null when routing is disabled", async () => {
      const config: RoutingConfig = { enabled: false, rules: [] };
      const result = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(result).toBeNull();
    });

    it("should return null when there are no rules", async () => {
      const config: RoutingConfig = { enabled: true, rules: [] };
      const result = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(result).toBeNull();
    });

    // ── Specialty rule ──────────────────────────────────────────────

    it("should match specialty rule based on property interest", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "specialty",
            specialtyMap: {
              condo: "agent-1",
              "house and lot": "agent-2",
            },
          },
        ],
      };

      const result = await findNextAgent(
        config,
        { propertyInterest: "Condo near BGC" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-1");
    });

    it("should match specialty rule case-insensitively", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "specialty",
            specialtyMap: { condo: "agent-1" },
          },
        ],
      };

      const result = await findNextAgent(
        config,
        { propertyInterest: "CONDO unit" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-1");
    });

    it("should match specialty rule with partial keyword in property interest", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "specialty",
            specialtyMap: { condo: "agent-1", commercial: "agent-2" },
          },
        ],
      };

      const result = await findNextAgent(
        config,
        { propertyInterest: "Looking for a 2BR Condo" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-1");
    });

    it("should not match specialty rule when propertyInterest is undefined", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "specialty", specialtyMap: { condo: "agent-1" } },
          { type: "round-robin", agentIds: ["agent-2"], currentIndex: 0 },
        ],
      };

      const result = await findNextAgent(
        config,
        {} as Partial<Lead>,
        mockAgents,
      );
      // specialty doesn't match because propertyInterest is undefined, falls to round-robin
      expect(result).toBe("agent-2");
    });

    it("should skip specialty rule when specialtyMap is undefined", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "specialty" as any },
          { type: "round-robin", agentIds: ["agent-1"], currentIndex: 0 },
        ],
      };

      const result = await findNextAgent(
        config,
        { propertyInterest: "Condo" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-1");
    });

    // ── Location rule ───────────────────────────────────────────────

    it("should match location rule", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "location",
            locationMap: {
              makati: "agent-1",
              quezon: "agent-2",
            },
          },
        ],
      };

      const result = await findNextAgent(
        config,
        { location: "Makati City" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-1");
    });

    it("should match location rule case-insensitively", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "location",
            locationMap: { makati: "agent-1" },
          },
        ],
      };

      const result = await findNextAgent(
        config,
        { location: "MAKATI CBD" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-1");
    });

    it("should match location rule with partial location string", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "location",
            locationMap: { quezon: "agent-2" },
          },
        ],
      };

      const result = await findNextAgent(
        config,
        { location: "Barangay Quezon City" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-2");
    });

    it("should skip location rule when locationMap is undefined", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "location" as any },
          { type: "round-robin", agentIds: ["agent-1"], currentIndex: 0 },
        ],
      };

      const result = await findNextAgent(
        config,
        { location: "Makati" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-1");
    });

    it("should skip location rule when lead location is undefined", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "location", locationMap: { makati: "agent-1" } },
          { type: "round-robin", agentIds: ["agent-2"], currentIndex: 0 },
        ],
      };

      const result = await findNextAgent(
        config,
        {} as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-2");
    });

    it("should match location rule when multiple location keywords exist", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "location",
            locationMap: {
              "taguig": "agent-1",
              "makati": "agent-2",
              "pasig": "agent-3",
            },
          },
        ],
      };

      const result = await findNextAgent(
        config,
        { location: "Bonifacio Global City, Taguig" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-1");
    });

    // ── Rule priority and ordering ──────────────────────────────────

    it("should return first matching rule (specialty before location)", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "specialty",
            specialtyMap: { condo: "agent-1" },
          },
          {
            type: "location",
            locationMap: { taguig: "agent-2" },
          },
        ],
      };

      // Both match — specialty is first so it wins
      const result = await findNextAgent(
        config,
        { propertyInterest: "Condo", location: "Taguig" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-1");
    });

    it("should return second rule when first does not match", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "specialty", specialtyMap: { condo: "agent-1" } },
          { type: "location", locationMap: { taguig: "agent-2" } },
        ],
      };

      const result = await findNextAgent(
        config,
        { propertyInterest: "House", location: "Taguig" } as Partial<Lead>,
        mockAgents,
      );
      // specialty doesn't match "House", falls to location which matches
      expect(result).toBe("agent-2");
    });

    it("should fallback to round-robin when no specialty/location match", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "specialty", specialtyMap: { condo: "agent-1" } },
          { type: "location", locationMap: { taguig: "agent-2" } },
          { type: "round-robin", agentIds: ["agent-3", "agent-4"], currentIndex: 0 },
        ],
      };

      const result = await findNextAgent(
        config,
        { propertyInterest: "Lot", location: "Cebu" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBe("agent-3");
    });

    // ── Round-robin ─────────────────────────────────────────────────

    it("should increment round-robin index and save config", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "round-robin",
            agentIds: ["agent-1", "agent-2"],
            currentIndex: 0,
          },
        ],
      };

      const result1 = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(result1).toBe("agent-1");
      expect(config.rules[0].currentIndex).toBe(1);

      const result2 = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(result2).toBe("agent-2");
      expect(config.rules[0].currentIndex).toBe(0); // wraps around
    });

    it("should return null if round-robin rule has no agents", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "round-robin",
            agentIds: [],
            currentIndex: 0,
          },
        ],
      };

      const result = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(result).toBeNull();
    });

    it("should default currentIndex to 0 when undefined", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "round-robin",
            agentIds: ["agent-1", "agent-2"],
          },
        ],
      };

      const result = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(result).toBe("agent-1");
      expect(config.rules[0].currentIndex).toBe(1); // was undefined, treated as 0, then incremented
    });

    it("should handle round-robin with a single agent", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "round-robin",
            agentIds: ["agent-1"],
            currentIndex: 0,
          },
        ],
      };

      const result1 = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(result1).toBe("agent-1");
      expect(config.rules[0].currentIndex).toBe(0); // (0+1)%1 = 0

      const result2 = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(result2).toBe("agent-1");
      expect(config.rules[0].currentIndex).toBe(0);
    });

    it("should skip round-robin when agentIds is undefined", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "round-robin" as any },
        ],
      };

      const result = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(result).toBeNull();
    });

    it("should cycle through all agents in round-robin order", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "round-robin",
            agentIds: ["agent-1", "agent-2", "agent-3"],
            currentIndex: 0,
          },
        ],
      };

      // Sequential round-robin calls
      const r1 = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(r1).toBe("agent-1");

      const r2 = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(r2).toBe("agent-2");

      const r3 = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(r3).toBe("agent-3");

      const r4 = await findNextAgent(config, {} as Partial<Lead>, mockAgents);
      expect(r4).toBe("agent-1"); // wraps around
    });

    // ── No match ────────────────────────────────────────────────────

    it("should return null when no rule matches and no round-robin fallback", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "specialty", specialtyMap: { condo: "agent-1" } },
          { type: "location", locationMap: { taguig: "agent-2" } },
        ],
      };

      const result = await findNextAgent(
        config,
        { propertyInterest: "House", location: "Cebu" } as Partial<Lead>,
        mockAgents,
      );
      expect(result).toBeNull();
    });

    // ── _allAgents param (unused but accepted) ──────────────────────

    it("should work with empty agents array", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1"], currentIndex: 0 },
        ],
      };

      const result = await findNextAgent(config, {} as Partial<Lead>, []);
      expect(result).toBe("agent-1");
    });

    it("should work with null agents (edge case)", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1"], currentIndex: 0 },
        ],
      };

      const result = await findNextAgent(config, {} as Partial<Lead>, null as unknown as AppUser[]);
      expect(result).toBe("agent-1");
    });
  });

  // ─── autoAssignLead ──────────────────────────────────────────────

  describe("autoAssignLead", () => {
    it("should assign lead to matched agent from round-robin", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1", "agent-2"], currentIndex: 0 },
        ],
      });

      await autoAssignLead("lead-1", {}, mockAgents);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-1" }),
        expect.objectContaining({ assignedTo: "agent-1" }),
      );
    });

    it("should assign lead to matched agent from specialty rule", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          {
            type: "specialty",
            specialtyMap: { condo: "agent-2" },
          },
        ],
      });

      await autoAssignLead(
        "lead-condo",
        { propertyInterest: "Condo in Makati" } as Partial<Lead>,
        mockAgents,
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-condo" }),
        expect.objectContaining({ assignedTo: "agent-2" }),
      );
    });

    it("should assign lead to matched agent from location rule", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          {
            type: "location",
            locationMap: { makati: "agent-3" },
          },
        ],
      });

      await autoAssignLead(
        "lead-loc",
        { location: "Makati City" } as Partial<Lead>,
        mockAgents,
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-loc" }),
        expect.objectContaining({ assignedTo: "agent-3" }),
      );
    });

    it("should not assign if routing is not enabled", async () => {
      mockConfigDoc({ enabled: false, rules: [] });

      await autoAssignLead("lead-1", {}, mockAgents);
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("should not assign if config does not exist", async () => {
      mockConfigDoc(null);

      await autoAssignLead("lead-1", {}, mockAgents);
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("should not assign if no agent matches the rules", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "specialty", specialtyMap: { condo: "agent-1" } },
          { type: "location", locationMap: { taguig: "agent-2" } },
        ],
      });

      await autoAssignLead(
        "lead-unmatched",
        { propertyInterest: "House", location: "Cebu" } as Partial<Lead>,
        mockAgents,
      );

      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("should call getRoutingConfig and findNextAgent with correct arguments", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1"], currentIndex: 0 },
        ],
      });

      await autoAssignLead("lead-99", { propertyInterest: "Condo" } as Partial<Lead>, mockAgents);

      expect(getDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-99" }),
        expect.objectContaining({ assignedTo: "agent-1" }),
      );
    });

    it("should handle empty allAgents array gracefully", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1"], currentIndex: 0 },
        ],
      });

      // The service doesn't use allAgents in findNextAgent, so this should still work
      await autoAssignLead("lead-1", {}, []);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-1" }),
        expect.objectContaining({ assignedTo: "agent-1" }),
      );
    });

    it("should handle undefined leadData gracefully", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1"], currentIndex: 0 },
        ],
      });

      await autoAssignLead("lead-1", undefined as unknown as Partial<Lead>, mockAgents);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-1" }),
        expect.objectContaining({ assignedTo: "agent-1" }),
      );
    });

    it("should handle null allAgents gracefully", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1"], currentIndex: 0 },
        ],
      });

      await autoAssignLead("lead-1", {}, null as unknown as AppUser[]);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-1" }),
        expect.objectContaining({ assignedTo: "agent-1" }),
      );
    });

    it("should propagate errors from getRoutingConfig", async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error("Network error"));

      await expect(
        autoAssignLead("lead-1", {}, mockAgents),
      ).rejects.toThrow("Network error");
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("should propagate errors from updateDocument (updateDoc)", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1"], currentIndex: 0 },
        ],
      });
      vi.mocked(updateDoc).mockRejectedValue(new Error("Update failed"));

      await expect(
        autoAssignLead("lead-1", {}, mockAgents),
      ).rejects.toThrow("Update failed");
    });
  });

  // ─── Integration: autoAssignLead with various configurations ─────

  describe("autoAssignLead integration scenarios", () => {
    it("should route a condo lead to the condo specialist", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "specialty", specialtyMap: { condo: "agent-1", "house-lot": "agent-2" } },
          { type: "location", locationMap: { makati: "agent-3" } },
          { type: "round-robin", agentIds: ["agent-1", "agent-2", "agent-3"], currentIndex: 0 },
        ],
      });

      await autoAssignLead(
        "lead-condo-1",
        { propertyInterest: "2BR Condo in Makati", location: "Makati" } as Partial<Lead>,
        mockAgents,
      );

      // Specialty matches first, so agent-1 (condo specialist) gets it
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-condo-1" }),
        expect.objectContaining({ assignedTo: "agent-1" }),
      );
    });

    it("should route a Taguig location lead to the Taguig agent", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "specialty", specialtyMap: { condo: "agent-1" } },
          { type: "location", locationMap: { taguig: "agent-2", makati: "agent-3" } },
        ],
      });

      await autoAssignLead(
        "lead-bgc",
        { propertyInterest: "Lot", location: "BGC Taguig" } as Partial<Lead>,
        mockAgents,
      );

      // Specialty doesn't match "Lot", so location matches "Taguig" -> agent-2
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-bgc" }),
        expect.objectContaining({ assignedTo: "agent-2" }),
      );
    });

    it("should handle disabled config in the middle of the day (no-op)", async () => {
      mockConfigDoc({
        enabled: false,
        rules: [
          { type: "round-robin", agentIds: ["agent-1", "agent-2"], currentIndex: 0 },
        ],
      });

      await autoAssignLead("lead-1", {}, mockAgents);
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("should handle a lead with only minimal data (no interest, no location)", async () => {
      mockConfigDoc({
        enabled: true,
        rules: [
          { type: "round-robin", agentIds: ["agent-1", "agent-2"], currentIndex: 0 },
        ],
      });

      await autoAssignLead(
        "lead-minimal",
        { name: "John Doe" } as Partial<Lead>,
        mockAgents,
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-minimal" }),
        expect.objectContaining({ assignedTo: "agent-1" }),
      );
    });
  });
});
