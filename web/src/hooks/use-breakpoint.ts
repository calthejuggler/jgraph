import { useSyncExternalStore } from "react";

/** Tailwind `md` breakpoint (768px). */
const mdMediaQuery = window.matchMedia("(min-width: 768px)");

const mdSubscribe = (callback: () => void) => {
  mdMediaQuery.addEventListener("change", callback);
  return () => mdMediaQuery.removeEventListener("change", callback);
};

const mdGetSnapshot = () => mdMediaQuery.matches;

/**
 * Returns `true` when the viewport is at or above the Tailwind `md` breakpoint.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(mdSubscribe, mdGetSnapshot);
}
