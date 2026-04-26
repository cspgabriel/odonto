/**
 * Default hex colors for blog category badges when admin leaves color empty.
 * Shiny primary colors: red, blue, pink, orange (and green/yellow for variety).
 */
export const BADGE_COLORS = [
  "#E53935", // red
  "#1E88E5", // blue
  "#EC407A", // pink
  "#FF7043", // orange
  "#43A047", // green
  "#FDD835", // yellow
  "#AB47BC", // purple
  "#00ACC1", // cyan
] as const;

/** Pick a stable "random" color for a category (by id or name) when color is null. */
export function getCategoryBadgeColor(
  idOrName: string | null,
  color: string | null | undefined
): string {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) return color;
  if (!idOrName) return BADGE_COLORS[0];
  let n = 0;
  for (let i = 0; i < idOrName.length; i++) n = (n * 31 + idOrName.charCodeAt(i)) >>> 0;
  return BADGE_COLORS[n % BADGE_COLORS.length];
}
