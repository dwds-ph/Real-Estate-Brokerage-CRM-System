import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useDebounce } from "./useDebounce";
import { useAsync } from "./useAsync";
import { useLocalStorage } from "./useLocalStorage";
import { useMediaQuery } from "./useMediaQuery";

// ─── useDebounce ─────────────────────────────────────────────────────────

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("updates after delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "hello" } },
    );

    rerender({ value: "world" });

    // Value should still be old value before timeout
    expect(result.current).toBe("hello");

    // Fast-forward past the debounce delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("world");
  });
});

// ─── useAsync ───────────────────────────────────────────────────────────

describe("useAsync", () => {
  it("starts in pending state when immediate is true", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAsync(async () => "data", [], { immediate: true }),
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.status).toBe("pending");
    vi.useRealTimers();
  });

  it("starts in idle state when immediate is false", () => {
    const { result } = renderHook(() =>
      useAsync(async () => "data", [], { immediate: false }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.status).toBe("idle");
  });

  it("resolves with data on success", async () => {
    const fn = vi.fn().mockResolvedValue("test-data");
    const { result } = renderHook(() => useAsync(fn));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe("test-data");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("sets error on failure", async () => {
    const error = new Error("test error");
    const fn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useAsync(fn));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("test error");
    expect(result.current.data).toBeNull();
  });

  it("calls onSuccess callback when provided", async () => {
    const onSuccess = vi.fn();
    const fn = vi.fn().mockResolvedValue("data");
    const { result } = renderHook(() =>
      useAsync(fn, [], { onSuccess }),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(onSuccess).toHaveBeenCalledWith("data");
  });

  it("calls onError callback when provided", async () => {
    const onError = vi.fn();
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() =>
      useAsync(fn, [], { onError }),
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(onError).toHaveBeenCalled();
  });
});

// ─── useLocalStorage ────────────────────────────────────────────────────

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the initial value when storage is empty", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("stores and retrieves a value", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));

    act(() => {
      result.current[1]("stored-value");
    });

    expect(result.current[0]).toBe("stored-value");
    expect(localStorage.getItem("test-key")).toBe('"stored-value"');
  });

  it("removes a value and resets to default", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));

    act(() => {
      result.current[1]("stored");
    });
    expect(result.current[0]).toBe("stored");

    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe("default");
    expect(localStorage.getItem("test-key")).toBeNull();
  });

  it("reads existing value from localStorage", () => {
    localStorage.setItem("test-key", '"existing"');
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("existing");
  });
});

// ─── useMediaQuery ──────────────────────────────────────────────────────

describe("useMediaQuery", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 768px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("returns true when query matches", () => {
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("returns false when query does not match", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 1200px)"));
    expect(result.current).toBe(false);
  });
});
