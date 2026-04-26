/**
 * Constants for General Landing Page
 *
 * This file contains all static data, image paths, and constants
 * used across the general landing page components.
 */

const GENERAL = "/landing/general/images";

import { LANDING_IMAGES } from "@/lib/landing-images";

export const GENERAL_IMAGES = {
  hero: LANDING_IMAGES.heroDoctor,
  /** About section: doctor portrait (Meet Dr. Natali Jackson) */
  aboutDoctor: `${GENERAL}/img1.9e846f12.png`,
  /** Accreditation card logos */
  aboutLogo1: `${GENERAL}/logo1.49b1511b.png`,
  aboutLogo2: `${GENERAL}/logo2.237435fd.png`,
  aboutDoctorFallback: LANDING_IMAGES.aboutDoctor,
  weCarePatient: LANDING_IMAGES.weCarePatient,
  teamDoctor: LANDING_IMAGES.teamDoctor,
  service1: LANDING_IMAGES.service1,
  service2: LANDING_IMAGES.service2,
  service3: LANDING_IMAGES.service3,
  service4: LANDING_IMAGES.service4,
  /** Specialists section – img1.32061dff and img2.9d11c9c8 used in duplicate for 4 cards */
  doctor1: `${GENERAL}/img1.32061dff.png`,
  doctor2: `${GENERAL}/img2.9d11c9c8.png`,
  doctor3: `${GENERAL}/img1.32061dff.png`,
  doctor4: `${GENERAL}/img2.9d11c9c8.png`,
} as const;

export const GENERAL_SOCIAL_LINKS = {
  facebook: "#",
  twitter: "#",
  linkedin: "#",
  instagram: "#",
} as const;

export const GENERAL_CONTACT_INFO = {
  phone: "+1 123 456 7890",
  email: "info@example.com",
} as const;
