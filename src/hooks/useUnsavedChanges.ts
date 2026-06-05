import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────

/**
 * Options for configuring unsaved changes behavior.
 */
export interface UnsavedChangesOptions {
  /** Optional callback fired when the user is warned (beforeunload fires) */
  onWarn?: () => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────

/**
 * `useUnsavedChanges` – warns users about unsaved form changes before
 * navigation (browser close/refresh via `beforeunload`, or client-side
 * route transitions via a `shouldBlockRef` passed to react-router's
 * `useBlocker`).
 *
 * @param isDirty – Whether the form currently has unsaved changes.
 * @param options – Optional configuration (see `UnsavedChangesOptions`).
 *
 * @returns An object with:
 *  - `isDirty`   – Current dirty state (boolean).
 *  - `setDirty`  – Manually set the dirty flag.
 *  - `resetDirty`– Clear the dirty flag (call after successful save).
 *  - `shouldBlockRef` – A `MutableRefObject<boolean>` that react-router's
 *    `useBlocker(() => shouldBlockRef.current)` can consume to block
 *    client-side navigation.
 *
 * @example
 * ```tsx
 * const { isDirty, setDirty, resetDirty, shouldBlockRef } =
 *   useUnsavedChanges(false);
 *
 * // Wire up react-router blocker (v6+)
 * useBlocker(() => shouldBlockRef.current);
 *
 * // Mark dirty on field change
 * <input onChange={() => setDirty(true)} />
 *
 * // Mark clean after save
 * <button onClick={() => { save(); resetDirty(); }}>Save</button>
 * ```
 */
export function useUnsavedChanges(
  isDirty: boolean,
  options: UnsavedChangesOptions = {},
) {
  const { onWarn } = options;

  const [dirty, setDirty] = useState(isDirty);

  // Refs keep values stable across renders without re-creating the blocker.
  const shouldBlockRef = useRef(isDirty);
  const onWarnRef = useRef(onWarn);

  // Sync refs when deps change
  useEffect(() => {
    shouldBlockRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    onWarnRef.current = onWarn;
  }, [onWarn]);

  // --------------------------------------------------
  // beforeunload listener – warns on browser close/refresh
  // --------------------------------------------------
  useEffect(() => {
    if (!dirty) {return;}

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Modern browsers ignore custom messages; setting returnValue is
      // required by the spec to trigger the native confirmation dialog.
      event.returnValue = "";
      onWarnRef.current?.();
    };

    window.addEventListener("beforeunload", handler);

    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [dirty]);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const resetDirty = useCallback(() => {
    setDirty(false);
  }, []);

  return {
    isDirty: dirty,
    setDirty,
    resetDirty,
    shouldBlockRef,
  } as const;
}
