import { z } from "zod";

// ─── Branding Schema ──────────────────────────────────────────────────────────

const urlOrPath = z.union([
  z.string().url(),
  z.string().regex(/^\/[^/]/), // relative path e.g. /Logo_light.svg
  z.literal(""),
  z.null(),
]);

/** Image/avatar URLs: full URL, relative path (/landing/...), or empty/null so save never fails */
const imageUrlOrPath = z.union([
  z.string().url(),
  z.string().regex(/^\//),
  z.literal(""),
  z.null(),
]).optional();
export const brandingSchema = z.object({
  primaryLogoUrl: z.union([urlOrPath, z.null()]).optional(),
  darkLogoUrl: z.union([urlOrPath, z.null()]).optional(),
  faviconUrl: z.union([urlOrPath, z.null()]).optional(),
  brandName: z.string().min(1).max(100).nullable().optional(),
});

// ─── Colors Schema ─────────────────────────────────────────────────────────────

export const colorsSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  textPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  textSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  buttonHover: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  success: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  error: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
});

// ─── Content Schemas ──────────────────────────────────────────────────────────

export const heroContentSchema = z.object({
  headline: z.string().min(10).max(100).nullable().optional(),
  subtitle: z.string().min(20).max(300).nullable().optional(),
  ctaPrimary: z.string().min(3).max(30).nullable().optional(),
  ctaSecondary: z.string().min(3).max(30).nullable().optional(),
  imageUrl: imageUrlOrPath,
  rating: z.number().min(0).max(5).nullable().optional(),
  reviewCount: z.number().min(0).nullable().optional(),
  patientCount: z.number().min(0).nullable().optional(),
});

export const serviceSchema = z.object({
  title: z.string().min(3).max(100).nullable().optional(),
  description: z.string().min(10).max(500).nullable().optional(),
  iconUrl: imageUrlOrPath,
});

export const aboutDoctorSchema = z.object({
  sectionTitle: z.string().min(5).max(100).nullable().optional(),
  doctorName: z.string().min(2).max(100).nullable().optional(),
  doctorTitle: z.string().min(2).max(100).nullable().optional(),
  doctorImageUrl: imageUrlOrPath,
  paragraph1: z.string().min(20).max(1000).nullable().optional(),
  paragraph2: z.string().min(20).max(1000).nullable().optional(),
  checkmark1: z.string().min(3).max(200).nullable().optional(),
  checkmark2: z.string().min(3).max(200).nullable().optional(),
  checkmark3: z.string().min(3).max(200).nullable().optional(),
  checkmark4: z.string().min(3).max(200).nullable().optional(),
  yearsOfExperience: z.number().min(0).max(100).nullable().optional(),
  totalPatients: z.number().min(0).nullable().optional(),
});

export const dentalHealthSchema = z.object({
  sectionTitle: z.string().min(5).max(100).nullable().optional(),
  mainParagraph: z.string().min(20).max(1000).nullable().optional(),
  stat1Number: z.number().min(0).nullable().optional(),
  stat1Label: z.string().min(2).max(50).nullable().optional(),
  stat2Number: z.number().min(0).nullable().optional(),
  stat2Label: z.string().min(2).max(50).nullable().optional(),
  stat3Number: z.number().min(0).nullable().optional(),
  stat3Label: z.string().min(2).max(50).nullable().optional(),
  imageUrl: imageUrlOrPath,
});

export const smileComparisonSchema = z.object({
  sectionTitle: z.string().min(5).max(100).nullable().optional(),
  beforeImageUrl: imageUrlOrPath,
  afterImageUrl: imageUrlOrPath,
});

export const pricingPlanSchema = z.object({
  name: z.string().min(3).max(100).nullable().optional(),
  price: z.number().min(0).nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
  ctaText: z.string().min(3).max(30).nullable().optional(),
  featured: z.boolean().nullable().optional(),
});

export const pricingSchema = z.object({
  sectionTitle: z.string().min(5).max(100).nullable().optional(),
  plans: z.array(pricingPlanSchema).max(10).nullable().optional(),
});

export const testimonialSchema = z.object({
  name: z.string().min(2).max(100).nullable().optional(),
  role: z.string().min(2).max(100).nullable().optional(),
  text: z.string().min(20).max(1000).nullable().optional(),
  avatarUrl: imageUrlOrPath,
  rating: z.number().min(0).max(5).nullable().optional(),
});

export const testimonialsSchema = z.object({
  sectionTitle: z.string().min(5).max(100).nullable().optional(),
  reviews: z.array(testimonialSchema).max(6).nullable().optional(),
});

export const whyChooseReasonSchema = z.object({
  title: z.string().min(3).max(100).nullable().optional(),
  description: z.string().min(10).max(500).nullable().optional(),
  iconUrl: imageUrlOrPath,
});

export const whyChooseUsSchema = z.object({
  sectionTitle: z.string().min(5).max(100).nullable().optional(),
  reasons: z.array(whyChooseReasonSchema).max(10).nullable().optional(),
});

export const cookieNoticeSchema = z.object({
  enabled: z.boolean().nullable().optional(),
  message: z.string().max(300).nullable().optional(),
  linkUrl: z.string().max(200).nullable().optional(),
  linkText: z.string().max(50).nullable().optional(),
});

export const featuresSchema = z.object({
  enableDarkModeToggle: z.boolean().nullable().optional(),
  enableLanguageSwitcher: z.boolean().nullable().optional(),
  enableStickyNavbar: z.boolean().nullable().optional(),
  supportedLanguages: z.array(z.string()).nullable().optional(),
  enableTopBar: z.boolean().nullable().optional(),
  topBarType: z.enum(["info", "custom"]).nullable().optional(),
  topBarCustomText: z.string().nullable().optional(),
  topBarCustomBgColor: z.string().nullable().optional(),
});

export const contentSchema = z.object({
  hero: heroContentSchema.nullable().optional(),
  cookieNotice: cookieNoticeSchema.nullable().optional(),
  features: featuresSchema.nullable().optional(),
  services: z.array(serviceSchema).max(20).nullable().optional(),
  aboutDoctor: aboutDoctorSchema.nullable().optional(),
  dentalHealth: dentalHealthSchema.nullable().optional(),
  smileComparison: smileComparisonSchema.nullable().optional(),
  pricing: pricingSchema.nullable().optional(),
  testimonials: testimonialsSchema.nullable().optional(),
  whyChooseUs: whyChooseUsSchema.nullable().optional(),
});

// ─── SEO Schema ────────────────────────────────────────────────────────────────

export const seoSchema = z.object({
  metaTitle: z.string().max(60).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
  metaKeywords: z.string().max(500).nullable().optional(),
  ogImageUrl: z.string().url().optional().or(z.literal("")).nullish(),
  ogTitle: z.string().max(100).nullable().optional(),
  ogDescription: z.string().max(200).nullable().optional(),
  twitterCardType: z.enum(["summary", "summary_large_image"]).nullable().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")).nullish(),
  robots: z.enum(["index", "noindex"]).nullable().optional(),
});

// ─── Typography Schema ────────────────────────────────────────────────────────

export const typographySchema = z.object({
  headingFont: z.enum(["Inter", "Outfit", "Poppins", "Roboto", "Open Sans"]).nullable().optional(),
  bodyFont: z.enum(["Inter", "Outfit", "Poppins", "Roboto", "Open Sans"]).nullable().optional(),
  fontSize: z.enum(["small", "medium", "large"]).nullable().optional(),
  lineHeight: z.enum(["tight", "normal", "relaxed"]).nullable().optional(),
});

// ─── CTA Schema ───────────────────────────────────────────────────────────────

export const ctaSchema = z.object({
  sectionTitle: z.string().min(5).max(100).nullable().optional(),
  description: z.string().min(10).max(500).nullable().optional(),
  formFields: z.object({
    name: z.boolean().nullable().optional(),
    email: z.boolean().nullable().optional(),
    phone: z.boolean().nullable().optional(),
    service: z.boolean().nullable().optional(),
    message: z.boolean().nullable().optional(),
  }).nullable().optional(),
  submitButtonText: z.string().min(3).max(30).nullable().optional(),
  successMessage: z.string().min(10).max(200).nullable().optional(),
  errorMessage: z.string().min(10).max(200).nullable().optional(),
  emailNotifications: z.boolean().nullable().optional(),
});

// ─── Contact Schema ───────────────────────────────────────────────────────────

export const openingHoursSchema = z.object({
  day: z.string().min(3).max(20).nullable().optional(),
  time: z.string().min(5).max(50).nullable().optional(),
});

export const contactSchema = z.object({
  phone: z.union([z.string().min(5).max(50), z.literal(""), z.null()]).optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  address: z.union([z.string().min(10).max(500), z.literal(""), z.null()]).optional(),
  mapsUrl: z.string().url().optional().or(z.literal("")).nullish(),
  openingHours: z.array(openingHoursSchema).max(7).nullable().optional(),
  whatsappNumber: z.union([z.string().min(5).max(50), z.literal(""), z.null()]).optional(),
  emergencyContact: z.union([z.string().min(5).max(50), z.literal(""), z.null()]).optional(),
});

// ─── Social Schema ────────────────────────────────────────────────────────────

export const socialSchema = z.object({
  facebook: z.string().url().optional().or(z.literal("")).nullish(),
  instagram: z.string().url().optional().or(z.literal("")).nullish(),
  twitter: z.string().url().optional().or(z.literal("")).nullish(),
  linkedin: z.string().url().optional().or(z.literal("")).nullish(),
  youtube: z.string().url().optional().or(z.literal("")).nullish(),
  tiktok: z.string().url().optional().or(z.literal("")).nullish(),
  enabled: z.object({
    facebook: z.boolean().nullable().optional(),
    instagram: z.boolean().nullable().optional(),
    twitter: z.boolean().nullable().optional(),
    linkedin: z.boolean().nullable().optional(),
    youtube: z.boolean().nullable().optional(),
    tiktok: z.boolean().nullable().optional(),
  }).nullable().optional(),
});

// ─── Footer Schema ────────────────────────────────────────────────────────────

// url accepts: full https URLs, relative paths (/appointment), hash anchors (#hero), or empty
const footerLinkUrl = z.union([
  z.string().url(),                             // https://example.com/...
  z.string().regex(/^\//, "Must start with /"), // /appointment, /policies/privacy-policy
  z.string().regex(/^#/, "Must start with #"),  // #hero, #services
  z.literal(""),
]).nullable().optional();

export const footerLinkSchema = z.object({
  label: z.string().min(1).max(100).nullable().optional(),
  url: footerLinkUrl,
  openInNewTab: z.boolean().nullable().optional(),
});

// Allow empty string for logoUrl (cleared field); normalize to null so url() is not run on ""
const footerLogoUrl = z.preprocess(
  (val) => (val === "" ? null : val),
  z.union([z.string().url(), z.string().regex(/^\//), z.null()]).optional()
);

export const footerSchema = z.object({
  logoUrl: footerLogoUrl,
  companyDescription: z.string().min(10).max(500).nullable().optional(),
  quickLinks: z.array(footerLinkSchema).max(20).nullable().optional(),
  serviceLinks: z.array(footerLinkSchema).max(20).nullable().optional(),
  copyrightText: z.string().min(5).max(200).nullable().optional(),
  privacyPolicyLink: footerLinkUrl,
  termsLink: footerLinkUrl,
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
});

// ─── Main Landing Settings Schema ─────────────────────────────────────────────

export const landingSettingsSchema = z.object({
  branding: brandingSchema.nullable().optional(),
  colors: colorsSchema.nullable().optional(),
  content: contentSchema.nullable().optional(),
  seo: seoSchema.nullable().optional(),
  typography: typographySchema.nullable().optional(),
  cta: ctaSchema.nullable().optional(),
  contact: contactSchema.nullable().optional(),
  social: socialSchema.nullable().optional(),
  footer: footerSchema.nullable().optional(),
});

export type LandingSettings = z.infer<typeof landingSettingsSchema>;
export type BrandingSettings = z.infer<typeof brandingSchema>;
export type ColorsSettings = z.infer<typeof colorsSchema>;
export type ContentSettings = z.infer<typeof contentSchema>;
export type SEOSettings = z.infer<typeof seoSchema>;
export type TypographySettings = z.infer<typeof typographySchema>;
export type CTASettings = z.infer<typeof ctaSchema>;
export type ContactSettings = z.infer<typeof contactSchema>;
export type SocialSettings = z.infer<typeof socialSchema>;
export type FooterSettings = z.infer<typeof footerSchema>;
