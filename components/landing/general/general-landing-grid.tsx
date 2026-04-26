/**
 * General landing background grid (primary brand tint).
 * Used by appointment and other shared pages when clinic is general.
 */
export function GeneralLandingGrid() {
  return (
    <div
      className="absolute inset-0 -z-50 h-full w-full bg-[size:40px_40px]"
      style={{
        backgroundImage: `linear-gradient(to right, #0cc0df05 1px, transparent 1px), linear-gradient(to bottom, #0cc0df05 1px, transparent 1px)`,
      }}
    />
  );
}
