/**
 * Ophthalmology Landing Page Configuration
 *
 * Branding tokens, design system constants, and configuration
 * specific to the ophthalmology landing page.
 */

/** Tailwind class for container max width – use on all ophthalmology LP sections */
export const OPHTHALMOLOGY_MAX_WIDTH = "max-w-7xl";

/** 1280px – same as max-w-7xl, for reference */
export const OPHTHALMOLOGY_MAX_WIDTH_PX = 1280;

/** Buttons: fully rounded in ophthalmology */
export const OPHTHALMOLOGY_RADIUS_BUTTON = "rounded-full";

/** Creative radius: cards, modals, large surfaces */
export const OPHTHALMOLOGY_RADIUS_CARD = "rounded-3xl";

/** Primary brand color – teal (CTAs, nav, accents) */
export const OPHTHALMOLOGY_COLOR_PRIMARY = "teal-600";

/** Secondary brand color */
export const OPHTHALMOLOGY_COLOR_SECONDARY = "teal-500";

/** Single brand gradient – hero / key CTAs (use as Tailwind class) */
export const OPHTHALMOLOGY_GRADIENT =
  "bg-gradient-to-br from-teal-50 via-white to-teal-50 dark:from-teal-950/50 dark:via-slate-900 dark:to-teal-950/30";

/** Primary CTA background (single color, no gradient) – Tailwind class */
export const OPHTHALMOLOGY_BUTTON_PRIMARY_BG = "bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500";

/** Secondary CTA – border + transparent */
export const OPHTHALMOLOGY_BUTTON_SECONDARY =
  "border-2 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/50";

/** Font family keys for Tailwind (configured in tailwind.config) */
export const OPHTHALMOLOGY_FONT_HEADING = "font-dental-heading";
export const OPHTHALMOLOGY_FONT_BODY = "font-dental-body";

/** All radius tokens in one object */
export const OPHTHALMOLOGY_RADIUS = {
  button: OPHTHALMOLOGY_RADIUS_BUTTON,
  card: OPHTHALMOLOGY_RADIUS_CARD,
} as const;

/** All branding tokens */
export const OPHTHALMOLOGY_BRANDING = {
  maxWidth: OPHTHALMOLOGY_MAX_WIDTH,
  maxWidthPx: OPHTHALMOLOGY_MAX_WIDTH_PX,
  radius: OPHTHALMOLOGY_RADIUS,
  colorPrimary: OPHTHALMOLOGY_COLOR_PRIMARY,
  colorSecondary: OPHTHALMOLOGY_COLOR_SECONDARY,
  gradient: OPHTHALMOLOGY_GRADIENT,
  fontHeading: OPHTHALMOLOGY_FONT_HEADING,
  fontBody: OPHTHALMOLOGY_FONT_BODY,
  buttonPrimaryBg: OPHTHALMOLOGY_BUTTON_PRIMARY_BG,
  buttonSecondary: OPHTHALMOLOGY_BUTTON_SECONDARY,
} as const;
