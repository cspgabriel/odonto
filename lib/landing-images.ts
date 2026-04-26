/**
 * Landing images — all local paths (no external URLs).
 * Dental assets live under public/landing/dental/images/.
 * Ophthalmology components that reference these use the same paths until
 * clinic-specific assets are added.
 */
const DENTAL = "/landing/dental/images";

export const LANDING_IMAGES = {
  /** Hero: doctor with denture model */
  heroDoctor: `${DENTAL}/img1.8b16f2f2.webp`,
  /** We Care / About: female patient in chair (circular) */
  weCarePatient: `${DENTAL}/img5.a7625e9b.webp`,
  /** Services: dental / procedure images */
  service1: `${DENTAL}/img1.67e33eb7.webp`,
  service2: `${DENTAL}/img2.a0813f1e.webp`,
  service3: `${DENTAL}/img3.98c7b0a7.webp`,
  service4: `${DENTAL}/img4.d55cf6fd.webp`,
  /** Reuse for extra service cards */
  service5: `${DENTAL}/img1.67e33eb7.webp`,
  service6: `${DENTAL}/img2.a0813f1e.webp`,
  /** Make Appointment: three doctors */
  makeAppointmentDoctors: `${DENTAL}/img2.a0813f1e.webp`,
  /** Highly Qualified: main doctor (large left image) */
  teamDoctor: `${DENTAL}/img1.8b16f2f2.webp`,
  /** Doctor grid avatars (4 cards) */
  doctor1: `${DENTAL}/img1.8b16f2f2.webp`,
  doctor2: `${DENTAL}/img5.a7625e9b.webp`,
  doctor3: `${DENTAL}/img2.a0813f1e.webp`,
  doctor4: `${DENTAL}/img3.98c7b0a7.webp`,
  /** About Doctor profile */
  aboutDoctor: `${DENTAL}/dr.png`,
  /** Smile comparison / why choose / contact / news placeholders */
  smileComparison: `${DENTAL}/img5.a7625e9b.webp`,
  whyChoose: `${DENTAL}/img1.67e33eb7.webp`,
  contactMap: `${DENTAL}/img4.d55cf6fd.webp`,
  news1: `${DENTAL}/img1.67e33eb7.webp`,
  news2: `${DENTAL}/img2.a0813f1e.webp`,
  news3: `${DENTAL}/img3.98c7b0a7.webp`,
  /** Pricing card hero images (Basic = male, Premium = female) */
  pricingBasic: `${DENTAL}/img1.8b16f2f2.webp`,
  pricingPremium: `${DENTAL}/img5.a7625e9b.webp`,
  /** Detailed comparison images */
  comparisonBefore: `${DENTAL}/before1.9fedb002.webp`,
  comparisonAfter: `${DENTAL}/after1.7b5d308a.webp`,
} as const;
