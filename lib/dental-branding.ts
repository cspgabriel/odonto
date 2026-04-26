/**
 * Dental / Clinical landing page branding (design system).
 * 
 * ⚠️ DEPRECATED: This file is kept for backward compatibility.
 * 
 * For new dental components, import directly from:
 * @/components/landing/dental/config
 * 
 * This file re-exports from the new location to maintain compatibility
 * with shared components (landing-button, language-switcher, etc.)
 * 
 * Defines:
 * - 2 fonts (heading + body)
 * - 2 colors (primary + secondary)
 * - 1 gradient
 * - Max width (site-wide)
 * - Creative radius (not full – rounded-xl / rounded-2xl)
 */

// Re-export from the new location for backward compatibility
export {
  DENTAL_MAX_WIDTH,
  DENTAL_MAX_WIDTH_PX,
  DENTAL_RADIUS_BUTTON,
  DENTAL_RADIUS_CARD,
  DENTAL_COLOR_PRIMARY,
  DENTAL_COLOR_SECONDARY,
  DENTAL_GRADIENT,
  DENTAL_BUTTON_PRIMARY_BG,
  DENTAL_BUTTON_SECONDARY,
  DENTAL_FONT_HEADING,
  DENTAL_FONT_BODY,
  DENTAL_RADIUS,
  DENTAL_BRANDING,
} from "@/components/landing/dental/config";
