import type { CurrentClinic } from "@/lib/actions/clinic-actions";
import { getCachedClinic, getCachedLandingSettings } from "@/lib/cache";
import { SITE_URL } from "@/lib/config";
import { getDefaultLandingSettingsForClinicType } from "@/lib/constants/landing-defaults";
import type { LandingSettings } from "@/lib/validations/landing-settings";
import { cookies } from "next/headers";
import { LANDING_CLINIC_DEMO_COOKIE, LANDING_DOCTORS_COOKIE } from "@/lib/preferences/constants";
import dynamic from "next/dynamic";
import {
  GeneralTopBar,
  GeneralNavbar,
  GeneralBackToTop,
  GeneralHero,
  GeneralPatientFacilities,
  GeneralStatsBar,
  GeneralWeCare,
  GeneralHighlyQualified,
  GeneralServices,
  GeneralSmileComparison,
  GeneralAboutDoctor,
  GeneralFooter,
} from "@/components/landing/general";
import { GeneralThemeProvider } from "@/components/landing/general/general-theme-provider";
import {
  OphthalmologyTopBar,
  OphthalmologyNavbar,
  OphthalmologyBackToTop,
  OphthalmologyHero,
  OphthalmologyWeCare,
  OphthalmologyHighlyQualified,
  OphthalmologyServices,
  OphthalmologyAboutDoctor,
  OphthalmologyFooter,
} from "@/components/landing/ophthalmology";
import { OphthalmologyThemeProvider } from "@/components/landing/ophthalmology/ophthalmology-theme-provider";
import {
  DentalTopBar,
  DentalNavbar,
  DentalBackToTop,
  DentalHero,
  DentalWeCare,
  DentalHighlyQualified,
  DentalServices,
  DentalSmileComparison,
  DentalAboutDoctor,
  DentalFooter,
} from "@/components/landing/dental";
import { LandingThemeProvider } from "@/components/landing/dental/landing-theme-provider";
import { getBlogPosts } from "@/lib/actions/blog-actions";
import { CookieNotice } from "@/components/ui/cookie-notice";
import { LocalBusinessSchema } from "@/components/landing/structured-data";
import { SectionSkeleton } from "@/components/landing/section-skeleton";
import SalesLandingPage from "./landing/page";

/** Below-fold sections: lazy-loaded for smaller initial bundle and better LCP. */
const DentalPricing = dynamic(
  () => import("@/components/landing/dental").then((m) => ({ default: m.DentalPricing })),
  { loading: () => <SectionSkeleton className="h-96" />, ssr: true }
);
const DentalNews = dynamic(
  () => import("@/components/landing/dental").then((m) => ({ default: m.DentalNews })),
  { loading: () => <SectionSkeleton className="h-[420px]" />, ssr: true }
);
const DentalTestimonials = dynamic(
  () => import("@/components/landing/dental").then((m) => ({ default: m.DentalTestimonials })),
  { loading: () => <SectionSkeleton className="h-96" />, ssr: true }
);
const DentalWhyChoose = dynamic(
  () => import("@/components/landing/dental").then((m) => ({ default: m.DentalWhyChoose })),
  { loading: () => <SectionSkeleton className="h-96" />, ssr: true }
);
const DentalContact = dynamic(
  () => import("@/components/landing/dental").then((m) => ({ default: m.DentalContact })),
  { loading: () => <SectionSkeleton className="h-[480px]" />, ssr: true }
);

const OphthalmologyPricing = dynamic(
  () => import("@/components/landing/ophthalmology").then((m) => ({ default: m.OphthalmologyPricing })),
  { loading: () => <SectionSkeleton className="h-96" />, ssr: true }
);
const OphthalmologyNews = dynamic(
  () => import("@/components/landing/ophthalmology").then((m) => ({ default: m.OphthalmologyNews })),
  { loading: () => <SectionSkeleton className="h-[420px]" />, ssr: true }
);
const OphthalmologyTestimonials = dynamic(
  () => import("@/components/landing/ophthalmology").then((m) => ({ default: m.OphthalmologyTestimonials })),
  { loading: () => <SectionSkeleton className="h-96" />, ssr: true }
);
const OphthalmologyWhyChoose = dynamic(
  () => import("@/components/landing/ophthalmology").then((m) => ({ default: m.OphthalmologyWhyChoose })),
  { loading: () => <SectionSkeleton className="h-96" />, ssr: true }
);
const OphthalmologyContact = dynamic(
  () => import("@/components/landing/ophthalmology").then((m) => ({ default: m.OphthalmologyContact })),
  { loading: () => <SectionSkeleton className="h-[480px]" />, ssr: true }
);

const GeneralNews = dynamic(
  () => import("@/components/landing/general").then((m) => ({ default: m.GeneralNews })),
  { loading: () => <SectionSkeleton className="h-[420px]" />, ssr: true }
);
const GeneralFaq = dynamic(
  () => import("@/components/landing/general").then((m) => ({ default: m.GeneralFaq })),
  { loading: () => <SectionSkeleton className="h-[400px]" />, ssr: true }
);
const GeneralTestimonials = dynamic(
  () => import("@/components/landing/general").then((m) => ({ default: m.GeneralTestimonials })),
  { loading: () => <SectionSkeleton className="h-96" />, ssr: true }
);
const GeneralAwards = dynamic(
  () => import("@/components/landing/general").then((m) => ({ default: m.GeneralAwards })),
  { loading: () => <SectionSkeleton className="h-96" />, ssr: true }
);
const GeneralContact = dynamic(
  () => import("@/components/landing/general").then((m) => ({ default: m.GeneralContact })),
  { loading: () => <SectionSkeleton className="h-[480px]" />, ssr: true }
);

const LANDING_BY_TYPE = {
  general: {
    tagline: "Complete Clinic Management System",
    subtitle:
      "Patients, appointments, billing, and analytics in one place. SaaS-ready, multi-clinic architecture. Built on Supabase.",
  },
  dental: {
    tagline: "Dental Practice Management",
    subtitle:
      "Patients, appointments, billing, and analytics for your dental practice. Built on Supabase.",
  },
  ophthalmology: {
    tagline: "Ophthalmology Clinic Management",
    subtitle:
      "Patients, appointments, billing, and analytics for eye care. Built on Supabase.",
  },
} as const;

const VALID_DEMO_TYPES = ["dental", "general", "ophthalmology"] as const;
type DemoClinicType = (typeof VALID_DEMO_TYPES)[number];

interface HomePageProps {
  searchParams: Promise<{ clinic?: string; preview?: string }>;
}

import type { Metadata } from "next";

const DEFAULT_CLINIC = {
  id: "",
  name: "Clinic",
  type: "general" as const,
  heroTagline: null,
  heroSubtitle: null,
  keyBenefitsLine: null,
  logoUrl: null,
  siteName: null,
  primaryColor: null,
  accentColor: null,
  heroBgColor: null,
  footerText: null,
};

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const params = await searchParams;
  const isDemoMode = !!params.clinic;

  if (!params.clinic) {
    return {
      title: "AgenciAR Med - Sistema de gestao para clinicas",
      description:
        "Sistema completo para clinicas medicas, odontologicas e oftalmologicas: pacientes, agenda, prontuario, faturamento e site publico integrado.",
      robots: { index: true, follow: true },
      alternates: { canonical: SITE_URL },
      openGraph: {
        type: "website",
        url: SITE_URL,
        title: "AgenciAR Med - Sistema de gestao para clinicas",
        description:
          "Sistema completo para clinicas medicas, odontologicas e oftalmologicas.",
        siteName: "AgenciAR Med",
        locale: "pt_BR",
      },
      twitter: {
        card: "summary_large_image",
        title: "AgenciAR Med - Sistema de gestao para clinicas",
        description:
          "Sistema completo para clinicas medicas, odontologicas e oftalmologicas.",
      },
    };
  }

  try {
    const demoParam = params.clinic?.toLowerCase().trim();
    const demoType =
      demoParam && VALID_DEMO_TYPES.includes(demoParam as DemoClinicType)
        ? (demoParam as DemoClinicType)
        : null;
    const clinic = demoType
      ? { ...(await getCachedClinic()), type: demoType }
      : await getCachedClinic();
    const landingSettingsRaw = await getCachedLandingSettings(
      demoType ? clinic.type : undefined
    );
    const landingSettings = landingSettingsRaw ?? {};
    const seo = landingSettings.seo as { metaTitle?: string; metaDescription?: string; metaKeywords?: string; ogImageUrl?: string; robots?: string } | undefined;
    const branding = landingSettings.branding as { brandName?: string } | undefined;
    const siteName = clinic.siteName?.trim() || branding?.brandName || "CareNova";
    const title = seo?.metaTitle || siteName;
    const description =
      seo?.metaDescription || "Professional clinic management and patient care.";
    const canonicalUrl = `${SITE_URL}/`;
    const faviconPath = (landingSettings.branding as { faviconUrl?: string } | undefined)?.faviconUrl || "/favicon.ico";

    return {
      title,
      description,
      keywords: seo?.metaKeywords || "clinic, medical, healthcare, appointment",
      alternates: { canonical: canonicalUrl },
      robots: isDemoMode
        ? { index: false, follow: false, noarchive: true }
        : {
            index: seo?.robots !== "noindex",
            follow: true,
            googleBot: {
              index: seo?.robots !== "noindex",
              follow: true,
            },
          },
      openGraph: {
        type: "website",
        url: canonicalUrl,
        title,
        description,
        siteName,
        images: seo?.ogImageUrl
          ? [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: title }]
          : [],
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: seo?.ogImageUrl ? [seo.ogImageUrl] : [],
      },
      icons: {
        icon: faviconPath,
        shortcut: faviconPath,
        apple: faviconPath,
      },
    };
  } catch {
    return {
      title: "CareNova",
      description: "Clinic management",
      robots: isDemoMode ? { index: false, follow: false } : undefined,
    };
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  if (!params.clinic) {
    return <SalesLandingPage />;
  }

  const demoParam = params.clinic?.toLowerCase().trim();
  const cookieStore = await cookies();
  const cookieClinic = cookieStore.get(LANDING_CLINIC_DEMO_COOKIE)?.value?.toLowerCase().trim();
  const effectiveDemoParam =
    demoParam && VALID_DEMO_TYPES.includes(demoParam as DemoClinicType)
      ? demoParam
      : cookieClinic && VALID_DEMO_TYPES.includes(cookieClinic as DemoClinicType)
        ? cookieClinic
        : null;
  const isDemoMode = !!effectiveDemoParam;

  let clinic: CurrentClinic = DEFAULT_CLINIC;
  let landingSettings: Partial<LandingSettings> = {};
  try {
    const dbClinic = await getCachedClinic();

    if (isDemoMode) {
      clinic = { ...dbClinic, type: effectiveDemoParam as DemoClinicType };
      landingSettings = (await getCachedLandingSettings(clinic.type)) ?? {};
    } else {
      clinic = dbClinic;
      landingSettings = (await getCachedLandingSettings(clinic.type)) ?? {};
    }
  } catch {
    // DB timeout or connection error: use defaults so page still renders
  }

  const landing = LANDING_BY_TYPE[clinic.type] ?? LANDING_BY_TYPE.general;
  const tagline = clinic.heroTagline?.trim() || landing.tagline;
  const subtitle = clinic.heroSubtitle?.trim() || landing.subtitle;

  // Derive siteName and colors as before
  const siteName = clinic.siteName?.trim() || "CareNova";
  const primaryColor = clinic.primaryColor?.trim();
  const accentColor = clinic.accentColor?.trim();
  const heroBgColor = clinic.heroBgColor?.trim();
  const isValidHex = (c: string | undefined) => c && /^#[0-9A-Fa-f]{6}$/.test(c);
  const resolvedPrimary = primaryColor ?? (landingSettings.colors as { primary?: string } | undefined)?.primary;
  const primaryStyle = isValidHex(resolvedPrimary)
    ? { backgroundColor: resolvedPrimary!, color: "#fff" }
    : undefined;
  const accentStyle = isValidHex(accentColor) ? { color: accentColor! } : undefined;
  const heroBgStyle =
    isValidHex(heroBgColor)
      ? { background: heroBgColor }
      : undefined;

  const showMultiDoctors = cookieStore.get(LANDING_DOCTORS_COOKIE)?.value === "true";

  const contact = landingSettings.contact as { phone?: string; address?: string } | undefined;
  const metaDescription = (landingSettings.seo as { metaDescription?: string } | undefined)?.metaDescription ?? "";

  const themeColors =
    landingSettings.colors ?? getDefaultLandingSettingsForClinicType(clinic.type).colors ?? undefined;

  if (clinic.type === "dental") {
    const c = landingSettings.content ?? undefined;
    return (
      <div className="dental-landing min-h-screen flex flex-col bg-background">
        <LocalBusinessSchema
          name={siteName}
          description={metaDescription}
          phone={contact?.phone}
          address={contact?.address}
          url={SITE_URL}
          clinicType="dental"
        />
        {themeColors && <LandingThemeProvider colors={themeColors} typography={landingSettings.typography ?? undefined} />}
        <DentalTopBar contact={landingSettings.contact ?? undefined} social={landingSettings.social ?? undefined} features={c?.features} colors={themeColors} />
        <DentalNavbar showDoctors={showMultiDoctors} branding={landingSettings.branding} features={c?.features} />
        <DentalBackToTop />
        <main className="flex-1">
          <DentalHero hero={c?.hero ?? undefined} />
          <DentalServices services={c?.services ?? undefined} />
          {!showMultiDoctors ? (
            <DentalAboutDoctor aboutDoctor={c?.aboutDoctor ?? undefined} />
          ) : (
            <DentalHighlyQualified />
          )}
          <DentalWeCare dentalHealth={c?.dentalHealth ?? undefined} />
          <DentalSmileComparison smileComparison={c?.smileComparison ?? undefined} />
          <DentalPricing pricing={c?.pricing ?? undefined} />
          <DentalNews initialPosts={(await getBlogPosts(1, 4, undefined, "published")).data} />

          <DentalTestimonials testimonials={c?.testimonials ?? undefined} />
          <DentalWhyChoose whyChooseUs={c?.whyChooseUs ?? undefined} />
          <DentalContact contact={landingSettings.contact ?? undefined} cta={landingSettings.cta ?? undefined} />
        </main>
        <CookieNotice 
          enabled={c?.cookieNotice?.enabled ?? true}
          message={c?.cookieNotice?.message ?? undefined}
          linkUrl={c?.cookieNotice?.linkUrl ?? undefined}
          linkText={c?.cookieNotice?.linkText ?? undefined}
        />
        <DentalFooter
          branding={landingSettings.branding ?? undefined}
          footer={landingSettings.footer ?? undefined}
          contact={landingSettings.contact ?? undefined}
          social={landingSettings.social ?? undefined}
        />
      </div>
    );
  }

  if (clinic.type === "ophthalmology") {
    const c = landingSettings.content ?? undefined;
    const topBarOff = c?.features?.enableTopBar === false;
    return (
      <div className="ophthalmology-landing flex flex-col min-h-screen bg-background">
        <LocalBusinessSchema
          name={siteName}
          description={metaDescription}
          phone={contact?.phone}
          address={contact?.address}
          url={SITE_URL}
          clinicType="ophthalmology"
        />
        {themeColors && <OphthalmologyThemeProvider colors={themeColors} typography={landingSettings.typography ?? undefined} />}
        <OphthalmologyTopBar contact={landingSettings.contact ?? undefined} social={landingSettings.social ?? undefined} features={c?.features} colors={themeColors} />
        <OphthalmologyNavbar showDoctors={showMultiDoctors} branding={landingSettings.branding} features={c?.features} />
        <OphthalmologyBackToTop />
        <main className={topBarOff ? "pt-[5px]" : ""}>
          <OphthalmologyHero hero={c?.hero ?? undefined} />
          <OphthalmologyServices services={c?.services ?? undefined} />
          {!showMultiDoctors ? (
            <OphthalmologyAboutDoctor aboutDoctor={c?.aboutDoctor ?? undefined} />
          ) : (
            <OphthalmologyHighlyQualified />
          )}
          <OphthalmologyWeCare dentalHealth={c?.dentalHealth ?? undefined} />
          <OphthalmologyPricing pricing={c?.pricing ?? undefined} />
          <OphthalmologyNews initialPosts={(await getBlogPosts(1, 4, undefined, "published")).data} />

          <OphthalmologyTestimonials testimonials={c?.testimonials ?? undefined} />
          <OphthalmologyWhyChoose whyChooseUs={c?.whyChooseUs ?? undefined} />
          <OphthalmologyContact contact={landingSettings.contact ?? undefined} cta={landingSettings.cta ?? undefined} />
        </main>
        <CookieNotice 
          enabled={c?.cookieNotice?.enabled ?? true}
          message={c?.cookieNotice?.message ?? undefined}
          linkUrl={c?.cookieNotice?.linkUrl ?? undefined}
          linkText={c?.cookieNotice?.linkText ?? undefined}
        />
        <OphthalmologyFooter
          branding={landingSettings.branding ?? undefined}
          footer={landingSettings.footer ?? undefined}
          contact={landingSettings.contact ?? undefined}
          social={landingSettings.social ?? undefined}
        />
      </div>
    );
  }

  const c = landingSettings.content ?? undefined;
  return (
    <div className="general-landing min-h-screen flex flex-col bg-background min-w-0 overflow-x-hidden">
      <LocalBusinessSchema
        name={siteName}
        description={metaDescription}
        phone={contact?.phone}
        address={contact?.address}
        url={SITE_URL}
        clinicType="general"
      />
      {themeColors && <GeneralThemeProvider colors={themeColors} typography={landingSettings.typography ?? undefined} />}
      <GeneralTopBar contact={landingSettings.contact ?? undefined} social={landingSettings.social ?? undefined} features={c?.features} colors={themeColors} />
      <GeneralNavbar showDoctors={showMultiDoctors} branding={landingSettings.branding} features={c?.features} />
      <GeneralBackToTop />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <GeneralHero hero={c?.hero ?? undefined} />
        <GeneralPatientFacilities />
        <GeneralStatsBar />
        <GeneralServices services={c?.services ?? undefined} />
        {!showMultiDoctors ? (
          <GeneralAboutDoctor aboutDoctor={c?.aboutDoctor ?? undefined} />
        ) : (
          <GeneralHighlyQualified />
        )}
        <GeneralWeCare dentalHealth={c?.dentalHealth ?? undefined} />
        <GeneralSmileComparison smileComparison={c?.smileComparison ?? undefined} />
        <GeneralTestimonials testimonials={c?.testimonials ?? undefined} />
        <GeneralNews initialPosts={(await getBlogPosts(1, 4, undefined, "published")).data} />
        <GeneralFaq />
        <GeneralAwards />
        <GeneralContact contact={landingSettings.contact ?? undefined} cta={landingSettings.cta ?? undefined} />
      </main>
      <CookieNotice 
        enabled={c?.cookieNotice?.enabled ?? true}
        message={c?.cookieNotice?.message ?? undefined}
        linkUrl={c?.cookieNotice?.linkUrl ?? undefined}
        linkText={c?.cookieNotice?.linkText ?? undefined}
      />
      <GeneralFooter
        branding={landingSettings.branding ?? undefined}
        footer={landingSettings.footer ?? undefined}
        contact={landingSettings.contact ?? undefined}
        social={landingSettings.social ?? undefined}
      />
    </div>
  );
}
