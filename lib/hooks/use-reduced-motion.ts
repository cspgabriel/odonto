"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Respects prefers-reduced-motion (accessibility and performance on mobile).
 * Use in landing components that use Framer Motion: when true, use no-op initial/animate/transition
 * so animations are skipped.
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}

/** Variants that are no-op when reduced motion is preferred (for initial/animate). */
export function getReducedMotionVariants(reduced: boolean) {
  return {
    hidden: reduced ? {} : { opacity: 0, y: 10 },
    visible: reduced ? {} : { opacity: 1, y: 0 },
    transition: reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 100, damping: 20 },
  };
}
