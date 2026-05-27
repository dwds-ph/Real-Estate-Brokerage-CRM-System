import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createNotification,
  notifyUsers,
  notifyBroker,
  notifyAgent,
} from "@/services/notifications";

// Mock useFirestore's createDoc
const mockCreateDoc = vi.fn();
vi.mock("@/hooks/useFirestore", () => ({
  createDoc: (...args: unknown[]) => mockCreateDoc(...args),
}));

describe("notifications service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotification", () => {
    it("creates a notification with correct structure", async () => {
      mockCreateDoc.mockResolvedValue("notif-1");

      const id = await createNotification({
        userId: "user-1",
        type: "lead",
        title: "New Lead Assigned",
        body: "A new lead has been assigned to you",
      });

      expect(id).toBe("notif-1");
      expect(mockCreateDoc).toHaveBeenCalledWith("notifications", {
        userId: "user-1",
        type: "lead",
        title: "New Lead Assigned",
        body: "A new lead has been assigned to you",
        read: false,
        data: {},
        createdAt: expect.any(Number),
      });
    });

    it("creates a notification with data/link", async () => {
      mockCreateDoc.mockResolvedValue("notif-2");

      const id = await createNotification({
        userId: "user-2",
        type: "deal",
        title: "Deal Closed",
        body: "Deal #123 has been closed",
        data: {
          link: "/deals/123",
          relatedId: "deal-123",
        },
      });

      expect(id).toBe("notif-2");
      expect(mockCreateDoc).toHaveBeenCalledWith("notifications", {
        userId: "user-2",
        type: "deal",
        title: "Deal Closed",
        body: "Deal #123 has been closed",
        read: false,
        data: { link: "/deals/123", relatedId: "deal-123" },
        createdAt: expect.any(Number),
      });
    });

    it("creates a notification with type 'viewing'", async () => {
      mockCreateDoc.mockResolvedValue("notif-3");

      const id = await createNotification({
        userId: "user-3",
        type: "viewing",
        title: "Viewing Scheduled",
        body: "Viewing at 3pm tomorrow",
      });

      expect(id).toBe("notif-3");
      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          type: "viewing",
          title: "Viewing Scheduled",
        }),
      );
    });

    it("creates a notification with type 'commission'", async () => {
      mockCreateDoc.mockResolvedValue("notif-4");

      const id = await createNotification({
        userId: "user-4",
        type: "commission",
        title: "Commission Approved",
        body: "Your commission has been approved",
      });

      expect(id).toBe("notif-4");
      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          type: "commission",
          title: "Commission Approved",
        }),
      );
    });

    it("creates a notification with type 'task'", async () => {
      mockCreateDoc.mockResolvedValue("notif-5");

      const id = await createNotification({
        userId: "user-5",
        type: "task",
        title: "Task Due",
        body: "Your task is due today",
      });

      expect(id).toBe("notif-5");
      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          type: "task",
          title: "Task Due",
        }),
      );
    });

    it("creates a notification with type 'mention'", async () => {
      mockCreateDoc.mockResolvedValue("notif-6");

      const id = await createNotification({
        userId: "user-6",
        type: "mention",
        title: "You were mentioned",
        body: "Alice mentioned you in a comment",
      });

      expect(id).toBe("notif-6");
      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          type: "mention",
          title: "You were mentioned",
        }),
      );
    });

    it("creates a notification with type 'general'", async () => {
      mockCreateDoc.mockResolvedValue("notif-7");

      const id = await createNotification({
        userId: "user-7",
        type: "general",
        title: "System Update",
        body: "The system will be updated tonight",
      });

      expect(id).toBe("notif-7");
      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          type: "general",
          title: "System Update",
        }),
      );
    });

    it("sets data as empty object when not provided", async () => {
      mockCreateDoc.mockResolvedValue("notif-8");

      await createNotification({
        userId: "user-8",
        type: "general",
        title: "Test",
        body: "Test body",
      });

      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          data: {},
        }),
      );
    });
  });

  describe("notifyUsers", () => {
    it("creates notifications for multiple users", async () => {
      mockCreateDoc
        .mockResolvedValueOnce("notif-1")
        .mockResolvedValueOnce("notif-2")
        .mockResolvedValueOnce("notif-3");

      const ids = await notifyUsers(
        ["user-1", "user-2", "user-3"],
        "lead",
        "New Lead",
        "A new lead arrived",
      );

      expect(ids).toEqual(["notif-1", "notif-2", "notif-3"]);
      expect(mockCreateDoc).toHaveBeenCalledTimes(3);
    });

    it("passes data/link to each notification", async () => {
      mockCreateDoc.mockResolvedValue("notif-x");

      await notifyUsers(
        ["user-1", "user-2"],
        "deal",
        "Deal Update",
        "Deal updated",
        { link: "/deals/1", relatedId: "deal-1" },
      );

      expect(mockCreateDoc).toHaveBeenCalledTimes(2);
      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          userId: "user-1",
          data: { link: "/deals/1", relatedId: "deal-1" },
        }),
      );
      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          userId: "user-2",
          data: { link: "/deals/1", relatedId: "deal-1" },
        }),
      );
    });

    it("handles empty user list", async () => {
      const ids = await notifyUsers([], "general", "Test", "Test");
      expect(ids).toEqual([]);
      expect(mockCreateDoc).not.toHaveBeenCalled();
    });

    it("handles single user", async () => {
      mockCreateDoc.mockResolvedValue("notif-1");

      const ids = await notifyUsers(
        ["user-1"],
        "task",
        "Task Reminder",
        "Task due soon",
      );

      expect(ids).toEqual(["notif-1"]);
      expect(mockCreateDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe("notifyBroker", () => {
    it("creates a notification for a broker", async () => {
      mockCreateDoc.mockResolvedValue("notif-broker");

      const id = await notifyBroker(
        "broker-1",
        "commission",
        "Commission Request",
        "Agent requested commission payout",
      );

      expect(id).toBe("notif-broker");
      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          userId: "broker-1",
          type: "commission",
          title: "Commission Request",
          body: "Agent requested commission payout",
        }),
      );
    });

    it("accepts optional data parameter", async () => {
      mockCreateDoc.mockResolvedValue("notif-broker");

      await notifyBroker(
        "broker-1",
        "deal",
        "Deal Update",
        "Deal #123 needs approval",
        { link: "/deals/123", relatedId: "deal-123" },
      );

      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          userId: "broker-1",
          data: { link: "/deals/123", relatedId: "deal-123" },
        }),
      );
    });
  });

  describe("notifyAgent", () => {
    it("creates a notification for an agent", async () => {
      mockCreateDoc.mockResolvedValue("notif-agent");

      const id = await notifyAgent(
        "agent-1",
        "viewing",
        "Viewing Reminder",
        "You have a viewing at 2pm",
      );

      expect(id).toBe("notif-agent");
      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          userId: "agent-1",
          type: "viewing",
          title: "Viewing Reminder",
          body: "You have a viewing at 2pm",
        }),
      );
    });

    it("accepts optional data parameter", async () => {
      mockCreateDoc.mockResolvedValue("notif-agent");

      await notifyAgent(
        "agent-1",
        "lead",
        "Lead Assigned",
        "New lead assigned to you",
        { link: "/leads/456", relatedId: "lead-456" },
      );

      expect(mockCreateDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          userId: "agent-1",
          data: { link: "/leads/456", relatedId: "lead-456" },
        }),
      );
    });
  });
});
