import { getCachedClinic, getCachedLandingSettings } from "@/lib/cache";
import { getDefaultLandingSettingsForClinicType, mergeWithLandingDefaults } from "@/lib/constants/landing-defaults";
import { LANDING_CLINIC_DEMO_COOKIE } from "@/lib/preferences/constants";
import { cookies } from "next/headers";
import { DentalNavbar, DentalFooter, DentalBackToTop, DentalTopBar, DentalMakeAppointment } from "@/components/landing/dental";
import { AppointmentFeatures as DentalAppointmentFeatures } from "@/components/landing/dental/appointment-features";
import { DentalLocations } from "@/components/landing/dental/dental-locations";
import { DentalLandingGrid } from "@/components/landing/dental/dental-landing-grid";
import { LandingThemeProvider } from "@/components/landing/dental/landing-theme-provider";
import {
  OphthalmologyNavbar,
  OphthalmologyFooter,
  OphthalmologyBackToTop,
  OphthalmologyTopBar,
  OphthalmologyMakeAppointment,
  OphthalmologyLocations,
} from "@/components/landing/ophthalmology";
import { AppointmentFeatures as OphthalmologyAppointmentFeatures } from "@/components/landing/ophthalmology/appointment-features";
import { OphthalmologyThemeProvider } from "@/components/landing/ophthalmology/ophthalmology-theme-provider";
import {
  GeneralNavbar,
  GeneralFooter,
  GeneralBackToTop,
  GeneralTopBar,
  GeneralMakeAppointment,
  GeneralLocations,
} from "@/components/landing/general";
import { AppointmentFeatures as GeneralAppointmentFeatures } from "@/components/landing/general/appointment-features";
import { GeneralLandingGrid } from "@/components/landing/general/general-landing-grid";
import { GeneralThemeProvider } from "@/components/landing/general/general-theme-provider";
import type { Metadata } from "next";

const VALID_CLINIC_TYPES = ["dental", "ophthalmology", "general"] as const;
type ClinicType = (typeof VALID_CLINIC_TYPES)[number];
function getEffectiveClinicType(dbType: string | undefined, cookieValue: string | undefined): ClinicType {
  if (cookieValue && VALID_CLINIC_TYPES.includes(cookieValue as ClinicType)) return cookieValue as ClinicType;
  if (dbType === "ophthalmology" || dbType === "general") return dbType as ClinicType;
  return "dental";
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const [clinic, settingsRaw] = await Promise.all([
    getCachedClinic(),
    getCachedLandingSettings(),
  ]);
  const effectiveType = getEffectiveClinicType(clinic?.type, cookieStore.get(LANDING_CLINIC_DEMO_COOKIE)?.value);
  const settingsForType =
    effectiveType === "ophthalmology"
      ? await getCachedLandingSettings("ophthalmology")
      : effectiveType === "general"
        ? await getCachedLandingSettings("general")
        : settingsRaw;
  const settings = mergeWithLandingDefaults(settingsForType ?? {}, effectiveType) as {
    branding?: { faviconUrl?: string; brandName?: string };
  };
  const favicon = settings.branding?.faviconUrl || "/favicon.ico";
  return {
    title: `Book an Appointment | ${settings.branding?.brandName || "Clinic Master"}`,
    description: "Schedule your visit online. Choose your preferred service, date, and specialist.",
    icons: { icon: favicon, shortcut: favicon, apple: favicon },
  };
}

export default async function AppointmentPage() {
  const cookieStore = await cookies();
  const [clinic, settingsRaw] = await Promise.all([
    getCachedClinic(),
    getCachedLandingSettings(),
  ]);
  const effectiveType = getEffectiveClinicType(clinic?.type, cookieStore.get(LANDING_CLINIC_DEMO_COOKIE)?.value);
  const settingsForType =
    effectiveType === "ophthalmology"
      ? await getCachedLandingSettings("ophthalmology")
      : effectiveType === "general"
        ? await getCachedLandingSettings("general")
        : settingsRaw;
  const settings = mergeWithLandingDefaults(settingsForType ?? {}, effectiveType) as {
    colors?: Record<string, string>;
    typography?: { headingFont?: string | null; bodyFont?: string | null };
    contact?: Record<string, unknown>;
    social?: Record<string, unknown>;
    content?: { features?: { enableTopBar?: boolean } };
    branding?: Record<string, unknown>;
    footer?: Record<string, unknown>;
  };

  const isOphthalmology = effectiveType === "ophthalmology";
  const isGeneral = effectiveType === "general";

  const themeColors =
    settings.colors ?? getDefaultLandingSettingsForClinicType(effectiveType).colors ?? {};

  if (isOphthalmology) {
    const topBarOff = settings.content?.features?.enableTopBar === false;
    return (
      <div className="ophthalmology-landing relative min-h-screen flex flex-col bg-background">
        {Object.keys(themeColors).length > 0 && <OphthalmologyThemeProvider colors={themeColors} typography={settings.typography ?? undefined} />}
        <div className="absolute inset-0 -z-50 h-full w-full bg-[linear-gradient(to_right,#0D948805_1px,transparent_1px),linear-gradient(to_bottom,#0D948805_1px,transparent_1px)] bg-[size:40px_40px]" />
        <OphthalmologyTopBar
          contact={settings.contact as never}
          social={settings.social as never}
          features={settings.content?.features as never}
          colors={themeColors}
        />
        <OphthalmologyNavbar
          branding={settings.branding as never}
          features={settings.content?.features as never}
        />
        <OphthalmologyBackToTop />

        <main className={topBarOff ? "flex-1 pt-[calc(6rem+5px)] sm:pt-[calc(6.5rem+5px)]" : "flex-1 pt-[6rem] sm:pt-[6.5rem]"}>
          <OphthalmologyAppointmentFeatures />
          <div className="bg-white dark:bg-slate-950">
            <OphthalmologyMakeAppointment />
          </div>
          <OphthalmologyLocations />
        </main>

        <OphthalmologyFooter
          branding={settings.branding as never}
          footer={settings.footer as never}
          contact={settings.contact as never}
          social={settings.social as never}
        />
      </div>
    );
  }

  if (isGeneral) {
    const topBarOff = settings.content?.features?.enableTopBar === false;
    return (
      <div className="general-landing relative min-h-screen flex flex-col bg-background">
        {Object.keys(themeColors).length > 0 && <GeneralThemeProvider colors={themeColors} typography={settings.typography ?? undefined} />}
        <GeneralLandingGrid />
        <GeneralTopBar
          contact={settings.contact as never}
          social={settings.social as never}
          features={settings.content?.features as never}
          colors={themeColors}
        />
        <GeneralNavbar
          branding={settings.branding as never}
          features={settings.content?.features as never}
        />
        <GeneralBackToTop />

        <main className={topBarOff ? "flex-1 pt-[calc(6rem+5px)] sm:pt-[calc(6.5rem+5px)]" : "flex-1 pt-[6rem] sm:pt-[6.5rem]"}>
          <GeneralAppointmentFeatures />
          <div className="bg-white dark:bg-slate-950">
            <GeneralMakeAppointment />
          </div>
          <GeneralLocations />
        </main>

        <GeneralFooter
          branding={settings.branding as never}
          footer={settings.footer as never}
          contact={settings.contact as never}
          social={settings.social as never}
        />
      </div>
    );
  }

  return (
    <div className="dental-landing relative min-h-screen flex flex-col bg-background">
      <LandingThemeProvider colors={themeColors} typography={settings.typography ?? undefined} />
      <DentalLandingGrid />
      <DentalTopBar
        contact={settings.contact as never}
        social={settings.social as never}
        features={settings.content?.features as never}
        colors={themeColors as never}
      />
      <DentalNavbar
        branding={settings.branding as never}
        features={settings.content?.features as never}
      />
      <DentalBackToTop />

      <main className="flex-1 pt-[6rem] sm:pt-[6.5rem]">
        <DentalAppointmentFeatures />
        <div className="bg-white dark:bg-slate-950">
          <DentalMakeAppointment />
        </div>
        <DentalLocations />
      </main>

      <DentalFooter
        branding={settings.branding as never}
        footer={settings.footer as never}
        contact={settings.contact as never}
        social={settings.social as never}
      />
    </div>
  );
}
