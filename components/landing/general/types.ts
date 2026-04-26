/**
 * Type definitions for General Landing Page
 */

export type GeneralService = {
  title: string;
  tag: string;
  desc: string;
  icon?: string;
  image?: string;
  popular?: boolean;
  showCTA?: boolean;
};

export type GeneralLocation = {
  country: string;
  flag: string;
  address: string;
  phone: string;
  hours: string;
};

export type GeneralDoctor = {
  name: string;
  specialty: string;
  image: string;
};

export type GeneralTestimonial = {
  name: string;
  role: string;
  content: string;
  rating: number;
};
