/**
 * Dental landing background grid (rose tint).
 * Used by appointment and other shared pages when clinic is dental
 * so that app/appointment does not contain rose hex literals.
 */
export function DentalLandingGrid() {
  return (
    <div
      className="absolute inset-0 -z-50 h-full w-full bg-[size:40px_40px]"
      style={{
        backgroundImage: `linear-gradient(to right, #e11d4805 1px, transparent 1px), linear-gradient(to bottom, #e11d4805 1px, transparent 1px)`,
      }}
    />
  );
}
