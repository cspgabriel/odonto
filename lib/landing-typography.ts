/**
 * Maps landing typography font names (from settings) to CSS variable names
 * used by next/font in app/fonts.ts. Used by landing theme providers to
 * inject --font-dental-heading and --font-dental-body overrides.
 */
const FONT_NAME_TO_VAR: Record<string, string> = {
  Inter: "var(--font-inter)",
  Outfit: "var(--font-outfit)",
  Poppins: "var(--font-poppins)",
  Roboto: "var(--font-roboto)",
  "Open Sans": "var(--font-open-sans)",
};

export type TypographySettings = {
  headingFont?: string | null;
  bodyFont?: string | null;
};

/**
 * Returns CSS fragment to set --font-dental-heading and --font-dental-body
 * for a given selector (e.g. ".dental-landing"). Empty string if no overrides.
 */
export function getTypographyCss(
  selector: string,
  typography: TypographySettings | null | undefined
): string {
  if (!typography) return "";
  const headingVar = typography.headingFont?.trim()
    ? FONT_NAME_TO_VAR[typography.headingFont.trim()]
    : null;
  const bodyVar = typography.bodyFont?.trim()
    ? FONT_NAME_TO_VAR[typography.bodyFont.trim()]
    : null;
  if (!headingVar && !bodyVar) return "";
  let css = `${selector} {`;
  if (headingVar) css += `--font-dental-heading: ${headingVar};`;
  if (bodyVar) css += `--font-dental-body: ${bodyVar};`;
  css += "}";
  return css;
}
