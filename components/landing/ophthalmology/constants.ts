/**
 * Constants for Ophthalmology Landing Page
 *
 * This file contains all static data, image paths, and constants
 * used across the ophthalmology landing page components.
 */

import { LANDING_IMAGES } from "@/lib/landing-images";

export const OPHTHALMOLOGY_IMAGES = {
  hero: LANDING_IMAGES.heroDoctor,
  aboutDoctor: LANDING_IMAGES.aboutDoctor,
  weCarePatient: LANDING_IMAGES.weCarePatient,
  teamDoctor: LANDING_IMAGES.teamDoctor,
  service1: LANDING_IMAGES.service1,
  service2: LANDING_IMAGES.service2,
  service3: LANDING_IMAGES.service3,
  service4: LANDING_IMAGES.service4,
  doctor1: LANDING_IMAGES.doctor1,
  doctor2: LANDING_IMAGES.doctor2,
  doctor3: LANDING_IMAGES.doctor3,
  doctor4: LANDING_IMAGES.doctor4,
} as const;

export const OPHTHALMOLOGY_SOCIAL_LINKS = {
  facebook: "#",
  twitter: "#",
  linkedin: "#",
  instagram: "#",
} as const;

export const OPHTHALMOLOGY_CONTACT_INFO = {
  phone: "+1 123 456 7890",
  email: "info@example.com",
} as const;
