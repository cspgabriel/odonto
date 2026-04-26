/**
 * Placeholder for dynamically loaded below-fold sections (Task 7).
 * Prevents layout shift while the section chunk loads.
 */
export function SectionSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-muted ${className}`}
      aria-hidden
    />
  );
}
