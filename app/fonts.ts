/**
 * next/font/google — self-hosted fonts, no layout shift, optimal LCP.
 * CSS variables are set by the .variable class and referenced in tailwind.config (fontFamily).
 */
import {
  Inter,
  Noto_Sans_Arabic,
  Plus_Jakarta_Sans,
  DM_Sans,
  Outfit,
  Poppins,
  Roboto,
  Open_Sans,
} from "next/font/google";

export const fontInter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

export const fontArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-arabic",
  preload: true,
});

export const fontDentalHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-dental-heading",
  preload: true,
});

export const fontDentalBody = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-dental-body",
  preload: true,
});

/** Landing typography options (must match lib/validations/landing-settings.ts enum) */
export const fontOutfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-outfit",
  preload: true,
});

export const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
  preload: true,
});

export const fontRoboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
  preload: true,
});

export const fontOpenSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-open-sans",
  preload: true,
});

/** Single className string to apply all font CSS variables (use on body/html). */
export const fontVariablesClassName = [
  fontInter.variable,
  fontArabic.variable,
  fontDentalHeading.variable,
  fontDentalBody.variable,
  fontOutfit.variable,
  fontPoppins.variable,
  fontRoboto.variable,
  fontOpenSans.variable,
].join(" ");
