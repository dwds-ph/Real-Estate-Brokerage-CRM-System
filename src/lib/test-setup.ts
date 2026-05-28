import "@testing-library/jest-dom";
import { vi } from "vitest";

// ─── React 19 + jsdom compatibility ─────────────────────────────────────
// Prevent ReferenceError: window is not defined from react-dom
if (typeof globalThis.window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis.window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
  };
}

// Mock Firebase to avoid requiring env variables in tests
vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
  storage: {},
  messaging: {},
  default: {},
}));
