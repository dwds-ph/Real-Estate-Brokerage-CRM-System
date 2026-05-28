import { describe, it, expect, vi } from "vitest";

// Mock the entire firebase/app and firebase sub-modules
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({ name: "mock-app" })),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({ name: "mock-auth" })),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({ name: "mock-db" })),
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => ({ name: "mock-storage" })),
}));

vi.mock("firebase/messaging", () => ({
  getMessaging: vi.fn(() => ({ name: "mock-messaging" })),
  isSupported: vi.fn(() => Promise.resolve(true)),
}));

describe("firebase config", () => {
  it("exports auth, db, storage, and default", async () => {
    // Dynamic import so mocks are applied
    const firebaseModule = await import("@/lib/firebase");

    expect(firebaseModule).toHaveProperty("auth");
    expect(firebaseModule).toHaveProperty("db");
    expect(firebaseModule).toHaveProperty("storage");
    expect(firebaseModule).toHaveProperty("getMessagingInstance");
    expect(firebaseModule.default).toBeDefined();
  });
});
