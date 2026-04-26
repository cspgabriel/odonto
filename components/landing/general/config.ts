/**
 * General Landing Page Configuration
 *
 * Branding tokens, design system constants, and configuration
 * specific to the general (clinic) landing page.
 */

/** Tailwind class for container max width – use on all general LP sections */
export const GENERAL_MAX_WIDTH = "max-w-7xl";

/** 1280px – same as max-w-7xl, for reference */
export const GENERAL_MAX_WIDTH_PX = 1280;

/** Radius: buttons, nav links, CTAs */
export const GENERAL_RADIUS_BUTTON = "rounded-2xl";

/** Radius: cards, modals, large surfaces */
export const GENERAL_RADIUS_CARD = "rounded-3xl";

/** Radius: inputs, small surfaces, icon containers */
export const GENERAL_RADIUS_SMALL = "rounded-xl";

/** Radius: hero cards, extra large surfaces */
export const GENERAL_RADIUS_LARGE = "rounded-[32px]";

/** Primary brand color – #0cc0df (CTAs, nav, accents) */
export const GENERAL_COLOR_PRIMARY = "#0cc0df";

/** Secondary brand color (highlights, hover, badges) */
export const GENERAL_COLOR_SECONDARY = "#0aa5c4";

/** Single brand gradient – hero / key CTAs (use as Tailwind class) */
export const GENERAL_GRADIENT =
  "bg-gradient-to-br from-[#0cc0df]/5 via-white to-[#0cc0df]/5 dark:from-[#0cc0df]/10 dark:via-slate-900 dark:to-[#0cc0df]/10";

/** Primary CTA – solid main color, flat (no shadow), continuous radius (use with GENERAL_RADIUS_BUTTON) */
export const GENERAL_BUTTON_PRIMARY =
  "bg-primary text-primary-foreground shadow-none hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90";

/** Secondary CTA – border + transparent (use on all general landing secondary buttons) */
export const GENERAL_BUTTON_SECONDARY =
  "border-2 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/50";

/** @deprecated Use GENERAL_BUTTON_PRIMARY */
export const GENERAL_BUTTON_PRIMARY_BG = "bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90";

/** Font family keys for Tailwind (configured in tailwind.config) */
export const GENERAL_FONT_HEADING = "font-dental-heading";
export const GENERAL_FONT_BODY = "font-dental-body";

/** Section title – same size and style for all general landing section headings (h2) */
export const GENERAL_SECTION_TITLE =
  "text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] break-words " +
  GENERAL_FONT_HEADING;

/** Section description – same size and style for intro paragraph under section titles */
export const GENERAL_SECTION_DESCRIPTION =
  "text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium";

/** Section vertical padding – same between all general landing sections (extra top/bottom for clean spacing) */
export const GENERAL_SECTION_PADDING = "py-14 lg:py-20";

/** Section border + background – consistent for content sections */
export const GENERAL_SECTION_BORDER = "border-t border-slate-200/60 dark:border-slate-800/60";
export const GENERAL_SECTION_BG = "bg-white dark:bg-slate-950";

/** Gap between section title and description (when both present) */
export const GENERAL_TITLE_DESCRIPTION_GAP = "mb-4 md:mb-6";

/** Gap between header block (title + description) and section content */
export const GENERAL_HEADER_CONTENT_GAP = "mb-8 md:mb-10";

/** All radius tokens in one object */
export const GENERAL_RADIUS = {
  button: GENERAL_RADIUS_BUTTON,
  card: GENERAL_RADIUS_CARD,
  small: GENERAL_RADIUS_SMALL,
  large: GENERAL_RADIUS_LARGE,
} as const;

/** Blog list page accent (title highlight, pagination) – used by app/blog */
export const GENERAL_BLOG_ACCENT_HIGHLIGHT = "text-primary";
export const GENERAL_BLOG_ACCENT_PAGINATION = "hover:bg-primary hover:text-primary-foreground hover:border-primary";

/** Policy 404 link – used by app/policies */
export const GENERAL_POLICY_HOME_LINK = "text-primary font-bold hover:underline";

/** All branding tokens */
export const GENERAL_BRANDING = {
  maxWidth: GENERAL_MAX_WIDTH,
  maxWidthPx: GENERAL_MAX_WIDTH_PX,
  radius: GENERAL_RADIUS,
  colorPrimary: GENERAL_COLOR_PRIMARY,
  colorSecondary: GENERAL_COLOR_SECONDARY,
  gradient: GENERAL_GRADIENT,
  fontHeading: GENERAL_FONT_HEADING,
  fontBody: GENERAL_FONT_BODY,
  buttonPrimary: GENERAL_BUTTON_PRIMARY,
  buttonSecondary: GENERAL_BUTTON_SECONDARY,
} as const;
