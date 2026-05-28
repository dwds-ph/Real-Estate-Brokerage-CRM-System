import "@testing-library/jest-dom";
import { vi } from "vitest";

// ─── React 19 + jsdom compatibility ─────────────────────────────────────
if (typeof globalThis.window !== "undefined") {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  (globalThis.window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
  };
}

// ─── Firebase mock ─────────────────────────────────────────────────────
// Provides a lightweight stub so tests don't need env variables or a
// real Firebase project. The mock intercepts @/lib/firebase imports,
// and services that import from @/lib/firestore will resolve their
// @/lib/firebase import through this mock automatically.
vi.mock("@/lib/firebase", () => {
  const mockDoc = vi.fn(() => ({
    id: "generated-mock-id-12345",
  }));

  return {
    auth: {
      onAuthStateChanged: vi.fn(() => vi.fn()),
      currentUser: null,
      signInWithEmailAndPassword: vi.fn(() => Promise.reject(new Error("mock"))),
      signOut: vi.fn(() => Promise.resolve()),
    },
    db: {
      collection: vi.fn(() => ({
        id: "mock-collection-ref",
        path: "/",
      })),
      doc: mockDoc,
      runTransaction: vi.fn(),
    },
    storage: {
      ref: vi.fn(() => ({ bucket: "mock", name: "mock" })),
      getDownloadURL: vi.fn(() => Promise.resolve("https://mock.url")),
      uploadBytesResumable: vi.fn(() => ({
        on: vi.fn(),
        snapshot: { ref: { getDownloadURL: vi.fn() } },
      })),
    },
    getMessagingInstance: vi.fn(() => Promise.resolve(null)),
    default: {},
  };
});
