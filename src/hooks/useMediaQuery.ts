import { useState, useEffect } from "react";

/**
 * Track a CSS media query match.
 * Returns true when the query matches, false otherwise.
 * Useful for responsive component logic.
 *
 * @example
 *   const isMobile = useMediaQuery("(max-width: 768px)");
 *   const isDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
