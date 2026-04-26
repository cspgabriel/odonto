/**
 * Dental Landing Page Configuration
 * 
 * Branding tokens, design system constants, and configuration
 * specific to the dental landing page.
 * 
 * This replaces lib/dental-branding.ts for better organization.
 */

/** Tailwind class for container max width – use on all dental LP sections */
export const DENTAL_MAX_WIDTH = "max-w-7xl";

/** 1280px – same as max-w-7xl, for reference */
export const DENTAL_MAX_WIDTH_PX = 1280;

/** Creative radius: not full. Buttons and small elements */
export const DENTAL_RADIUS_BUTTON = "rounded-xl";

/** Creative radius: cards, modals, large surfaces */
export const DENTAL_RADIUS_CARD = "rounded-2xl";

/** Primary brand color – pink (CTAs, nav, accents) */
export const DENTAL_COLOR_PRIMARY = "rose-600";

/** Secondary brand color – pink-500 (highlights, hover, badges) */
export const DENTAL_COLOR_SECONDARY = "pink-500";

/** Single brand gradient – hero / key CTAs (use as Tailwind class) */
export const DENTAL_GRADIENT =
  "bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-rose-950/50 dark:via-slate-900 dark:to-pink-950/30";

/** Primary CTA background (single color, no gradient) – Tailwind class */
export const DENTAL_BUTTON_PRIMARY_BG = "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500";

/** Secondary CTA – border + transparent */
export const DENTAL_BUTTON_SECONDARY =
  "border-2 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/50";

/** Font family keys for Tailwind (configured in tailwind.config) */
export const DENTAL_FONT_HEADING = "font-dental-heading";
export const DENTAL_FONT_BODY = "font-dental-body";

/** All radius tokens in one object */
export const DENTAL_RADIUS = {
  button: DENTAL_RADIUS_BUTTON,
  card: DENTAL_RADIUS_CARD,
} as const;

/** Blog list page accent (title highlight, pagination) – used by app/blog */
export const DENTAL_BLOG_ACCENT_HIGHLIGHT = "text-rose-500";
export const DENTAL_BLOG_ACCENT_PAGINATION = "hover:bg-rose-500 hover:text-white hover:border-rose-500";

/** Policy 404 link – used by app/policies */
export const DENTAL_POLICY_HOME_LINK = "text-rose-500 font-bold hover:underline";

/** All branding tokens */
export const DENTAL_BRANDING = {
  maxWidth: DENTAL_MAX_WIDTH,
  maxWidthPx: DENTAL_MAX_WIDTH_PX,
  radius: DENTAL_RADIUS,
  colorPrimary: DENTAL_COLOR_PRIMARY,
  colorSecondary: DENTAL_COLOR_SECONDARY,
  gradient: DENTAL_GRADIENT,
  fontHeading: DENTAL_FONT_HEADING,
  fontBody: DENTAL_FONT_BODY,
  buttonPrimaryBg: DENTAL_BUTTON_PRIMARY_BG,
  buttonSecondary: DENTAL_BUTTON_SECONDARY,
} as const;
