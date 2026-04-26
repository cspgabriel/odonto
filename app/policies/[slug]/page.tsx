import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { DENTAL_MAX_WIDTH } from "@/lib/dental-branding";
import { DentalNavbar, DentalFooter, DentalTopBar } from "@/components/landing/dental";
import { DENTAL_POLICY_HOME_LINK } from "@/components/landing/dental/config";
import { LandingThemeProvider } from "@/components/landing/dental/landing-theme-provider";
import {
  OphthalmologyTopBar,
  OphthalmologyNavbar,
  OphthalmologyFooter,
  OphthalmologyBackToTop,
} from "@/components/landing/ophthalmology";
import { OPHTHALMOLOGY_MAX_WIDTH } from "@/components/landing/ophthalmology/config";
import { OphthalmologyThemeProvider } from "@/components/landing/ophthalmology/ophthalmology-theme-provider";
import { getCachedClinic, getCachedLandingSettings } from "@/lib/cache";
import { getDefaultLandingSettingsForClinicType, mergeWithLandingDefaults } from "@/lib/constants/landing-defaults";
import { LANDING_CLINIC_DEMO_COOKIE, LANDING_LOCALE_COOKIE } from "@/lib/preferences/constants";
import type { Metadata } from "next";

const VALID_CLINIC_TYPES = ["dental", "ophthalmology", "general"] as const;
type ClinicType = (typeof VALID_CLINIC_TYPES)[number];
function getEffectiveClinicType(dbType: string | undefined, cookieValue: string | undefined): ClinicType {
  if (cookieValue && VALID_CLINIC_TYPES.includes(cookieValue as ClinicType)) return cookieValue as ClinicType;
  if (dbType === "ophthalmology" || dbType === "general") return dbType as ClinicType;
  return "dental";
}

const VALID_LOCALES = ["en", "fr", "ar", "es"] as const;

function getPolicySlugs(): string[] {
  const policiesDir = path.join(process.cwd(), "content/policies");
  if (!fs.existsSync(policiesDir)) return [];
  return fs
    .readdirSync(policiesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export async function generateStaticParams() {
  const slugs = getPolicySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LANDING_LOCALE_COOKIE)?.value;
  const locale = VALID_LOCALES.includes(cookieLocale as (typeof VALID_LOCALES)[number])
    ? (cookieLocale as (typeof VALID_LOCALES)[number])
    : "en";

  // Load messages for policy title (static imports so bundler can resolve).
  // Message files are deeply nested; we only need footer strings for policy titles.
  type PolicyMessages = { footer?: Record<string, string> };
  const messagesEn = (await import("@/messages/landing/dental/en.json")).default as PolicyMessages;
  const messagesFr = (await import("@/messages/landing/dental/fr.json")).default as PolicyMessages;
  const messagesAr = (await import("@/messages/landing/dental/ar.json")).default as PolicyMessages;
  const messagesEs = (await import("@/messages/landing/dental/es.json")).default as PolicyMessages;
  const messagesByLocale: Record<string, PolicyMessages> = {
    en: messagesEn,
    fr: messagesFr,
    ar: messagesAr,
    es: messagesEs,
  };
  const messages = messagesByLocale[locale] ?? messagesEn;
  const footer = messages?.footer ?? {};
  const titleMap: Record<string, string> = {
    "privacy-policy": footer.privacyPolicy ?? "Privacy Policy",
    "refund-policy": footer.refundPolicy ?? "Refund Policy",
    "terms-of-service": footer.termsOfService ?? "Terms of Service",
    "cookie-settings": footer.cookieSettings ?? "Cookie Settings",
  };
  const title = titleMap[slug] ?? slug;

  const cookieClinic = cookieStore.get(LANDING_CLINIC_DEMO_COOKIE)?.value;
  const [clinic, settingsRaw] = await Promise.all([
    getCachedClinic(),
    getCachedLandingSettings(),
  ]);
  const effectiveType = getEffectiveClinicType(clinic?.type, cookieClinic);
  const settingsForType =
    effectiveType === "ophthalmology"
      ? await getCachedLandingSettings("ophthalmology")
      : settingsRaw;
  const settings = mergeWithLandingDefaults(settingsForType ?? {}, effectiveType);
  const favicon = (settings as { branding?: { faviconUrl?: string } }).branding?.faviconUrl || "/favicon.ico";

  return {
    title: `${title} | Clinic Master`,
    icons: { icon: favicon, shortcut: favicon, apple: favicon },
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LANDING_LOCALE_COOKIE)?.value;
  const locale = VALID_LOCALES.includes(cookieLocale as (typeof VALID_LOCALES)[number])
    ? (cookieLocale as (typeof VALID_LOCALES)[number])
    : "en";

  const policyDir = path.join(process.cwd(), "content/policies", slug);
  const localePath = path.join(policyDir, `${locale}.md`);
  const fallbackPath = path.join(policyDir, "en.md");

  const filePath = fs.existsSync(localePath) ? localePath : fallbackPath;

  const clinic = await getCachedClinic();
  const effectiveType = getEffectiveClinicType(clinic?.type, cookieStore.get(LANDING_CLINIC_DEMO_COOKIE)?.value);
  const settingsForType =
    effectiveType === "ophthalmology"
      ? await getCachedLandingSettings("ophthalmology")
      : await getCachedLandingSettings();
  const settings = mergeWithLandingDefaults(settingsForType, effectiveType);

  const themeColors =
    (settings as { colors?: Record<string, string> }).colors ??
    getDefaultLandingSettingsForClinicType(effectiveType).colors ??
    {};

  const isOphthalmology = effectiveType === "ophthalmology";
  const homeLinkClass = isOphthalmology
    ? "text-teal-500 font-bold hover:underline"
    : DENTAL_POLICY_HOME_LINK;

  if (!fs.existsSync(filePath)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 - Policy Not Found</h1>
          <Link href="/?preview=1" className={homeLinkClass}>
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const content = fs.readFileSync(filePath, "utf8");

  const settingsTyped = settings as {
    contact?: Record<string, unknown>;
    social?: Record<string, unknown>;
    content?: { features?: { enableTopBar?: boolean } };
    branding?: Record<string, unknown>;
    footer?: Record<string, unknown>;
    colors?: Record<string, string>;
    typography?: { headingFont?: string | null; bodyFont?: string | null };
  };
  const maxWidth = isOphthalmology ? OPHTHALMOLOGY_MAX_WIDTH : DENTAL_MAX_WIDTH;
  const topBarOff = isOphthalmology && settingsTyped.content?.features?.enableTopBar === false;
  const proseHeadingStrong = isOphthalmology
    ? "prose-headings:text-black dark:prose-headings:text-white prose-strong:text-black dark:prose-strong:text-white"
    : "prose-headings:text-[#2D2D5F] dark:prose-headings:text-white prose-strong:text-[#2D2D5F] dark:prose-strong:text-white";

  return (
    <main className={cn("min-h-screen bg-slate-50 dark:bg-slate-950", isOphthalmology ? "ophthalmology-landing" : "dental-landing")}>
      {isOphthalmology && Object.keys(themeColors).length > 0 ? (
        <OphthalmologyThemeProvider colors={themeColors} typography={settingsTyped.typography ?? undefined} />
      ) : (
        <LandingThemeProvider colors={themeColors} typography={settingsTyped.typography ?? undefined} />
      )}
      {isOphthalmology ? (
        <>
          <OphthalmologyTopBar contact={settingsTyped.contact as never} social={settingsTyped.social as never} features={settingsTyped.content?.features} colors={themeColors} />
          <OphthalmologyNavbar branding={settingsTyped.branding as never} features={settingsTyped.content?.features} />
          <OphthalmologyBackToTop />
        </>
      ) : (
        <>
          <DentalTopBar contact={settingsTyped.contact as never} social={settingsTyped.social as never} features={settingsTyped.content?.features} colors={themeColors} />
          <DentalNavbar branding={settingsTyped.branding as never} features={settingsTyped.content?.features} />
        </>
      )}

      <div className={cn("pb-24 px-4", topBarOff ? "pt-[calc(10rem+5px)]" : "pt-40")}>
        <div className={cn("mx-auto", maxWidth)}>
          <div
            className={cn(
              "bg-white dark:bg-[#0B0B1E] rounded-[40px] border border-slate-200/60 dark:border-slate-800/60 p-8 md:p-12",
              locale === "ar" && "text-right"
            )}
          >
            <article
              className={cn(
                "prose prose-slate dark:prose-invert max-w-none",
                "prose-headings:font-black lg:prose-headings:text-4xl prose-strong:font-black",
                proseHeadingStrong,
                "prose-p:text-slate-500 dark:prose-p:text-slate-400 prose-p:font-medium prose-p:leading-relaxed",
                "prose-li:text-slate-500 dark:prose-li:text-slate-400 prose-li:font-medium",
                locale === "ar" && "prose:text-right"
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          </div>
        </div>
      </div>

      {isOphthalmology ? (
        <OphthalmologyFooter branding={settingsTyped.branding as never} footer={settingsTyped.footer as never} contact={settingsTyped.contact as never} social={settingsTyped.social as never} />
      ) : (
        <DentalFooter branding={settingsTyped.branding as never} footer={settingsTyped.footer as never} contact={settingsTyped.contact as never} social={settingsTyped.social as never} />
      )}
    </main>
  );
}
