/**
 * Shared display helpers for doctor/staff names across Patient Management and Operations.
 * Use everywhere a doctor's name appears (appointments, patient profile, notes, prescriptions, etc.).
 */

export function formatDoctorName(
  fullName: string | null,
  specialization: string | null
): string {
  if (!fullName) return "Unassigned";
  const spec = specialization?.trim() ? ` — ${specialization.trim()}` : "";
  return `Dr. ${fullName.trim()}${spec}`;
}
