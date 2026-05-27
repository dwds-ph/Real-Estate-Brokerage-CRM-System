import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

export type ShortcutAction =
  | { type: "navigate"; path: string }
  | { type: "action"; handler: () => void };

export interface ShortcutDef {
  keys: string[];
  label: string;
  description: string;
  action: ShortcutAction;
  /** If set, shortcut only fires when pathname matches this regex */
  pagePattern?: RegExp;
}

const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  {
    keys: ["G", "D"],
    label: "G + D",
    description: "Go to Dashboard",
    action: { type: "navigate", path: "/dashboard" },
  },
  {
    keys: ["G", "L"],
    label: "G + L",
    description: "Go to Leads",
    action: { type: "navigate", path: "/leads" },
  },
  {
    keys: ["G", "I"],
    label: "G + I",
    description: "Go to Listings",
    action: { type: "navigate", path: "/listings" },
  },
  {
    keys: ["?"],
    label: "?",
    description: "Toggle shortcuts help",
    action: { type: "action", handler: () => {} },
  },
];

export function useKeyboardShortcuts(customShortcuts: ShortcutDef[] = []) {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const allShortcuts = [...DEFAULT_SHORTCUTS, ...customShortcuts];

  // Find the ? shortcut and wire it to toggle help
  const helpShortcut = allShortcuts.find(
    (s) => s.keys.length === 1 && s.keys[0] === "?",
  );
  if (helpShortcut) {
    helpShortcut.action = {
      type: "action",
      handler: () => setHelpOpen((p) => !p),
    };
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key === "?" ? "?" : e.key.toUpperCase();
      const newPressed = new Set(pressedKeys);
      newPressed.add(key);
      setPressedKeys(newPressed);

      // Check if any shortcut matches
      for (const shortcut of allShortcuts) {
        if (shortcut.keys.length === 1 && shortcut.keys[0] === key) {
          e.preventDefault();
          if (shortcut.action.type === "navigate") {
            navigate(shortcut.action.path);
          } else {
            shortcut.action.handler();
          }
          setPressedKeys(new Set());
          return;
        }

        // Multi-key shortcuts: check if pressed keys match all shortcut keys in order
        if (shortcut.keys.length > 1) {
          const allPressed = shortcut.keys.every((k) => newPressed.has(k));
          if (allPressed) {
            // Check page pattern if defined
            if (
              shortcut.pagePattern &&
              !shortcut.pagePattern.test(window.location.pathname)
            ) {
              continue;
            }
            e.preventDefault();
            if (shortcut.action.type === "navigate") {
              navigate(shortcut.action.path);
            } else {
              shortcut.action.handler();
            }
            setPressedKeys(new Set());
            return;
          }
        }
      }
    },
    [navigate, pressedKeys, allShortcuts],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key === "?" ? "?" : e.key.toUpperCase();
    setPressedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return { helpOpen, setHelpOpen, shortcuts: allShortcuts };
}
