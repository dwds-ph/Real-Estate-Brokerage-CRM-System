import { describe, it, expect } from "vitest";

describe("test setup", () => {
  it("should import test setup module without error", async () => {
    // The test setup is loaded via vitest.config.ts setupFiles.
    // We verify it runs correctly by checking that the firebase mock
    // is properly applied (importing @/lib/firebase returns mocked exports).
    const firebaseModule = await import("@/lib/firebase");

    expect(firebaseModule).toHaveProperty("auth");
    expect(firebaseModule).toHaveProperty("db");
    expect(firebaseModule).toHaveProperty("storage");
    expect(firebaseModule).toHaveProperty("getMessagingInstance");
    expect(firebaseModule.default).toBeDefined();
  });
});
