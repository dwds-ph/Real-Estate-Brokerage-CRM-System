import type React from "react";

/**
 * Returns CSS properties for content-visibility optimization.
 * Apply this style to each list item to let the browser skip
 * rendering off-screen content automatically.
 *
 * @param index     Item index (unused but kept for future extensibility)
 * @param itemHeight Estimated height in px for containIntrinsicSize
 */
export function getVirtualListStyle(
  _index: number,
  itemHeight: number = 72,
): React.CSSProperties {
  return {
    contentVisibility: "auto",
    containIntrinsicSize: `${itemHeight}px`,
    contain: "content",
  };
}

/**
 * Calculates which items should be rendered given a scroll position.
 * Useful for windowed rendering (if you move beyond pure CSS).
 *
 * @param totalItems       Total number of list items
 * @param scrollTop        Current scroll position
 * @param containerHeight  Visible height of the scroll container
 * @param itemHeight       Estimated item height in px
 * @param overscan         Extra items to render above/below viewport
 */
export function createListRange(
  totalItems: number,
  scrollTop: number,
  containerHeight: number,
  itemHeight: number = 72,
  overscan: number = 5,
): { start: number; end: number } {
  const start = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - overscan,
  );
  const end = Math.min(
    totalItems,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );
  return { start, end };
}
