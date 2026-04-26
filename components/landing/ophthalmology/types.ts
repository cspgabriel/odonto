/**
 * Type definitions for Dental Landing Page
 */

export type DentalService = {
  title: string;
  tag: string;
  desc: string;
  icon?: string;
  image?: string;
  popular?: boolean;
  showCTA?: boolean;
};

export type DentalLocation = {
  country: string;
  flag: string;
  address: string;
  phone: string;
  hours: string;
};

export type DentalDoctor = {
  name: string;
  specialty: string;
  image: string;
};

export type DentalTestimonial = {
  name: string;
  role: string;
  content: string;
  rating: number;
};
