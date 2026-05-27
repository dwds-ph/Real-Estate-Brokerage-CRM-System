import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { useKeyboardShortcuts, ShortcutDef } from "./useKeyboardShortcuts";
import React from "react";

function createWrapper(
  initialEntries: string[] = ["/leads"],
): React.ComponentType<{ children: React.ReactNode }> {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      MemoryRouter,
      { initialEntries } as MemoryRouterProps,
      children,
    );
}

function renderShortcutHook(customShortcuts: ShortcutDef[] = []) {
  return renderHook(() => useKeyboardShortcuts(customShortcuts), {
    wrapper: createWrapper(["/leads"]),
  });
}

function fireKeyDown(key: string) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

/**
 * Dispatch a keydown event on an element of the given tag,
 * letting it bubble up to window. The element is temporarily
 * attached to document.body so tagName checks work.
 */
function fireKeyDownOnTag(key: string, tagName: string) {
  const el = document.createElement(tagName.toLowerCase());
  document.body.appendChild(el);
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  document.body.removeChild(el);
}

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/leads");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns helpOpen false by default", () => {
    const { result } = renderShortcutHook();
    expect(result.current.helpOpen).toBe(false);
  });

  it("toggles helpOpen on ? key press", () => {
    const { result } = renderShortcutHook();

    act(() => {
      fireKeyDown("?");
    });
    expect(result.current.helpOpen).toBe(true);

    act(() => {
      fireKeyDown("?");
    });
    expect(result.current.helpOpen).toBe(false);
  });

  it("ignores key presses when target is INPUT", () => {
    const customAction = vi.fn();
    const custom: ShortcutDef[] = [
      {
        keys: ["N"],
        label: "N",
        description: "New",
        action: { type: "action", handler: customAction },
      },
    ];
    renderShortcutHook(custom);

    act(() => {
      fireKeyDownOnTag("n", "INPUT");
    });
    expect(customAction).not.toHaveBeenCalled();
  });

  it("ignores key presses when target is TEXTAREA", () => {
    const customAction = vi.fn();
    const custom: ShortcutDef[] = [
      {
        keys: ["N"],
        label: "N",
        description: "New",
        action: { type: "action", handler: customAction },
      },
    ];
    renderShortcutHook(custom);

    act(() => {
      fireKeyDownOnTag("n", "TEXTAREA");
    });
    expect(customAction).not.toHaveBeenCalled();
  });

  it("ignores key presses when target is SELECT", () => {
    const customAction = vi.fn();
    const custom: ShortcutDef[] = [
      {
        keys: ["N"],
        label: "N",
        description: "New",
        action: { type: "action", handler: customAction },
      },
    ];
    renderShortcutHook(custom);

    act(() => {
      fireKeyDownOnTag("n", "SELECT");
    });
    expect(customAction).not.toHaveBeenCalled();
  });

  it("fires a single-key custom action shortcut", () => {
    const customAction = vi.fn();
    const custom: ShortcutDef[] = [
      {
        keys: ["N"],
        label: "N",
        description: "New lead",
        action: { type: "action", handler: customAction },
      },
    ];
    renderShortcutHook(custom);

    act(() => {
      fireKeyDown("n");
    });
    expect(customAction).toHaveBeenCalledTimes(1);
  });

  it("fires action-type shortcuts correctly", () => {
    const customAction = vi.fn();
    const custom: ShortcutDef[] = [
      {
        keys: ["N"],
        label: "N",
        description: "New",
        action: { type: "action", handler: customAction },
      },
    ];
    renderShortcutHook(custom);

    act(() => {
      fireKeyDown("n");
    });
    expect(customAction).toHaveBeenCalledOnce();
  });

  it("respects pagePattern and fires shortcut on matching page", () => {
    const customAction = vi.fn();
    const custom: ShortcutDef[] = [
      {
        keys: ["N"],
        label: "N",
        description: "New",
        action: { type: "action", handler: customAction },
        pagePattern: /^\/leads/,
      },
    ];
    renderShortcutHook(custom);

    act(() => {
      fireKeyDown("n");
    });
    expect(customAction).toHaveBeenCalledOnce();
  });
});
