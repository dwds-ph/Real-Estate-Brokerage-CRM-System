import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRoutingConfig,
  saveRoutingConfig,
  findNextAgent,
  autoAssignLead,
  type RoutingConfig,
} from "@/services/leadRoutingService";
import type { Lead } from "@/types";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, _coll, id) => ({ id })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

const { getDoc, setDoc, updateDoc } = await import("firebase/firestore");

describe("leadRoutingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAgents = [
    { id: "agent-1", displayName: "Alice", role: "agent" } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    { id: "agent-2", displayName: "Bob", role: "agent" } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ];

  describe("getRoutingConfig", () => {
    it("should return routing config when document exists", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [{ type: "round-robin", agentIds: ["agent-1", "agent-2"], currentIndex: 0 }],
      };
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => config,
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await getRoutingConfig();
      expect(result).toEqual(config);
    });

    it("should return null when document does not exist", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await getRoutingConfig();
      expect(result).toBeNull();
    });
  });

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
  });

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
            specialtyMap: {
              condo: "agent-1",
            },
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

    it("should fallback to round-robin when no specialty/location match", async () => {
      const config: RoutingConfig = {
        enabled: true,
        rules: [
          {
            type: "specialty",
            specialtyMap: { condo: "agent-1" },
          },
          {
            type: "round-robin",
            agentIds: ["agent-2", "agent-3"],
            currentIndex: 0,
          },
        ],
      };

      const result = await findNextAgent(
        config,
        { propertyInterest: "Lot" } as Partial<Lead>, // no match for specialty
        mockAgents,
      );
      expect(result).toBe("agent-2"); // first in round-robin
    });

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
  });

  describe("autoAssignLead", () => {
    it("should assign lead to matched agent", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () =>
          ({
            enabled: true,
            rules: [
              {
                type: "round-robin",
                agentIds: ["agent-1", "agent-2"],
                currentIndex: 0,
              },
            ],
          }) as RoutingConfig,
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      await autoAssignLead("lead-1", {}, mockAgents);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "lead-1" }),
        expect.objectContaining({ assignedTo: "agent-1" }),
      );
    });

    it("should not assign if routing is not enabled", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ enabled: false, rules: [] }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      await autoAssignLead("lead-1", {}, mockAgents);
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("should not assign if config does not exist", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      await autoAssignLead("lead-1", {}, mockAgents);
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
});
