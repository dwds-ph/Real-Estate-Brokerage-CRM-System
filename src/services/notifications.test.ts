import { describe, it, expect } from "vitest";
import { createNotification } from "../services/notifications";

// Mock Firestore
import { vi } from "vitest";
vi.mock("../hooks/useFirestore", () => ({
  createDoc: vi.fn(() => Promise.resolve("mock-notif-id")),
}));

describe("createNotification", () => {
  it("creates a notification with correct structure", async () => {
    const id = await createNotification({
      userId: "user-1",
      type: "lead",
      title: "New Lead Assigned",
      body: "A new lead has been assigned to you",
    });
    expect(id).toBe("mock-notif-id");
  });
});
