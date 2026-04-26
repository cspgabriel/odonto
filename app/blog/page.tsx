import { getCachedClinic, getCachedLandingSettings } from "@/lib/cache";
import { getDefaultLandingSettingsForClinicType, mergeWithLandingDefaults } from "@/lib/constants/landing-defaults";
import { DentalNavbar, DentalFooter, DentalTopBar, DentalBackToTop, DentalNews } from "@/components/landing/dental";
import { GeneralNavbar, GeneralFooter, GeneralTopBar, GeneralBackToTop, GeneralNews } from "@/components/landing/general";
import { OphthalmologyNavbar, OphthalmologyFooter, OphthalmologyTopBar, OphthalmologyBackToTop, OphthalmologyNews } from "@/components/landing/ophthalmology";
import { getBlogPosts } from "@/lib/actions/blog-actions";
import { LandingThemeProvider } from "@/components/landing/dental/landing-theme-provider";
import { GeneralThemeProvider } from "@/components/landing/general/general-theme-provider";
import { OphthalmologyThemeProvider } from "@/components/landing/ophthalmology/ophthalmology-theme-provider";
import { LANDING_CLINIC_DEMO_COOKIE } from "@/lib/preferences/constants";
import { cn } from "@/lib/utils";
import { DENTAL_MAX_WIDTH, DENTAL_BLOG_ACCENT_HIGHLIGHT, DENTAL_BLOG_ACCENT_PAGINATION } from "@/components/landing/dental/config";
import { GENERAL_MAX_WIDTH, GENERAL_BLOG_ACCENT_HIGHLIGHT, GENERAL_BLOG_ACCENT_PAGINATION } from "@/components/landing/general/config";
import { OPHTHALMOLOGY_MAX_WIDTH } from "@/components/landing/ophthalmology/config";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
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
  const [landingSettingsRaw, clinic] = await Promise.all([
    getCachedLandingSettings(),
    getCachedClinic(),
  ]);
  const effectiveType = getEffectiveClinicType(clinic?.type, cookieStore.get(LANDING_CLINIC_DEMO_COOKIE)?.value);
  const settingsForType =
    effectiveType === "ophthalmology"
      ? await getCachedLandingSettings("ophthalmology")
      : effectiveType === "general"
        ? await getCachedLandingSettings("general")
        : landingSettingsRaw;
  const settings = mergeWithLandingDefaults(settingsForType ?? {}, effectiveType);
  const favicon = settings.branding?.faviconUrl || "/favicon.ico";
  return {
    title: settings.seo?.metaTitle || "CareNova Blog | ClinicMaster",
    description: settings.seo?.metaDescription,
    icons: { icon: favicon, shortcut: favicon, apple: favicon },
  };
}

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 8;

  const cookieStore = await cookies();
  const [settingsRaw, postsData, clinic] = await Promise.all([
    getCachedLandingSettings(),
    getBlogPosts(page, pageSize, undefined, "published"),
    getCachedClinic(),
  ]);

  const effectiveType = getEffectiveClinicType(clinic?.type, cookieStore.get(LANDING_CLINIC_DEMO_COOKIE)?.value);
  const settingsForType =
    effectiveType === "ophthalmology"
      ? await getCachedLandingSettings("ophthalmology")
      : effectiveType === "general"
        ? await getCachedLandingSettings("general")
        : settingsRaw;
  const settings = mergeWithLandingDefaults(settingsForType ?? {}, effectiveType);
  const totalPages = Math.ceil(postsData.meta.total / pageSize);
  const t = await getTranslations("landing.blogPage");
  const isOphthalmology = effectiveType === "ophthalmology";
  const isGeneral = effectiveType === "general";

  const themeColors =
    settings.colors ?? getDefaultLandingSettingsForClinicType(effectiveType).colors ?? {};
  const accentHighlight = isOphthalmology ? "text-teal-500" : isGeneral ? GENERAL_BLOG_ACCENT_HIGHLIGHT : DENTAL_BLOG_ACCENT_HIGHLIGHT;
  const paginationHover = isOphthalmology
    ? "hover:bg-teal-500 hover:text-white hover:border-teal-500"
    : isGeneral
      ? GENERAL_BLOG_ACCENT_PAGINATION
      : DENTAL_BLOG_ACCENT_PAGINATION;

  if (isOphthalmology) {
    const topBarOff = settings.content?.features?.enableTopBar === false;
    return (
      <div className="ophthalmology-landing min-h-screen flex flex-col bg-white dark:bg-slate-950">
        {Object.keys(themeColors).length > 0 && <OphthalmologyThemeProvider colors={themeColors} typography={settings.typography ?? undefined} />}
        <OphthalmologyTopBar contact={settings.contact ?? undefined} social={settings.social ?? undefined} features={settings.content?.features} colors={themeColors} />
        <OphthalmologyNavbar branding={settings.branding ?? undefined} features={settings.content?.features ?? undefined} />
        <OphthalmologyBackToTop />

        <main className={cn("flex-1 pb-24", topBarOff ? "pt-[calc(12rem+5px)]" : "pt-[12rem]")}>
          <div>
            <div className={cn("max-w-3xl text-center mx-auto px-6", OPHTHALMOLOGY_MAX_WIDTH)}>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6">
                {t("pageTitle")} <span className={accentHighlight}>{t("pageTitleHighlight")}</span>
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {t("pageSubtitle")}
              </p>
            </div>

            <OphthalmologyNews initialPosts={postsData.data} hideHeader={true} hideButton={true} />

            {totalPages > 1 && (
              <div className={cn("mx-auto px-6", OPHTHALMOLOGY_MAX_WIDTH)}>
                <div className="mt-16 flex items-center justify-center gap-4">
                  {page > 1 ? (
                    <Link
                      href={`/blog?page=${page - 1}`}
                      className={cn("flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-95", paginationHover)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t("previous")}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/50 text-slate-300 dark:text-slate-700 font-black text-[11px] uppercase tracking-widest cursor-not-allowed">
                      <ArrowLeft className="w-4 h-4" />
                      {t("previous")}
                    </div>
                  )}

                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest">
                    {t("pageOf", { page, total: totalPages })}
                  </div>

                  {page < totalPages ? (
                    <Link
                      href={`/blog?page=${page + 1}`}
                      className={cn("flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-95", paginationHover)}
                    >
                      {t("next")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/50 text-slate-300 dark:text-slate-700 font-black text-[11px] uppercase tracking-widest cursor-not-allowed">
                      {t("next")}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <OphthalmologyFooter
          branding={settings.branding ?? undefined}
          footer={settings.footer ?? undefined}
          contact={settings.contact ?? undefined}
          social={settings.social ?? undefined}
        />
      </div>
    );
  }

  if (isGeneral) {
    const topBarOff = settings.content?.features?.enableTopBar === false;
    return (
      <div className="general-landing min-h-screen flex flex-col bg-white dark:bg-slate-950">
        {Object.keys(themeColors).length > 0 && <GeneralThemeProvider colors={themeColors} typography={settings.typography ?? undefined} />}
        <GeneralTopBar contact={settings.contact ?? undefined} social={settings.social ?? undefined} features={settings.content?.features} colors={themeColors} />
        <GeneralNavbar branding={settings.branding ?? undefined} features={settings.content?.features ?? undefined} />
        <GeneralBackToTop />

        <main className={cn("flex-1 pb-24", topBarOff ? "pt-[calc(12rem+5px)]" : "pt-[12rem]")}>
          <div>
            <div className={cn("max-w-3xl text-center mx-auto px-6 mb-12", GENERAL_MAX_WIDTH)}>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6">
                {t("pageTitle")} <span className={accentHighlight}>{t("pageTitleHighlight")}</span>
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {t("pageSubtitle")}
              </p>
            </div>

            <GeneralNews initialPosts={postsData.data} hideHeader={true} hideButton={true} blogPageLayout={true} />

            {totalPages > 1 && (
              <div className={cn("mx-auto px-6", GENERAL_MAX_WIDTH)}>
                <div className="mt-16 flex items-center justify-center gap-4">
                  {page > 1 ? (
                    <Link
                      href={`/blog?page=${page - 1}`}
                      className={cn("flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-95", paginationHover)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t("previous")}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/50 text-slate-300 dark:text-slate-700 font-black text-[11px] uppercase tracking-widest cursor-not-allowed">
                      <ArrowLeft className="w-4 h-4" />
                      {t("previous")}
                    </div>
                  )}

                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest">
                    {t("pageOf", { page, total: totalPages })}
                  </div>

                  {page < totalPages ? (
                    <Link
                      href={`/blog?page=${page + 1}`}
                      className={cn("flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-95", paginationHover)}
                    >
                      {t("next")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/50 text-slate-300 dark:text-slate-700 font-black text-[11px] uppercase tracking-widest cursor-not-allowed">
                      {t("next")}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <GeneralFooter
          branding={settings.branding ?? undefined}
          footer={settings.footer ?? undefined}
          contact={settings.contact ?? undefined}
          social={settings.social ?? undefined}
        />
      </div>
    );
  }

  return (
    <div className="dental-landing min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <LandingThemeProvider colors={themeColors} typography={settings.typography ?? undefined} />
      <DentalTopBar contact={settings.contact ?? undefined} social={settings.social ?? undefined} features={settings.content?.features} colors={themeColors} />
      <DentalNavbar branding={settings.branding ?? undefined} features={settings.content?.features ?? undefined} />
      <DentalBackToTop />

      <main className="flex-1 pt-[12rem] pb-24">
        <div>
          <div className={cn("max-w-3xl text-center mx-auto px-6", DENTAL_MAX_WIDTH)}>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6">
              {t("pageTitle")} <span className={accentHighlight}>{t("pageTitleHighlight")}</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {t("pageSubtitle")}
            </p>
          </div>

          <DentalNews initialPosts={postsData.data} hideHeader={true} hideButton={true} />

          {totalPages > 1 && (
            <div className={cn("mx-auto px-6", DENTAL_MAX_WIDTH)}>
              <div className="mt-16 flex items-center justify-center gap-4">
                {page > 1 ? (
                  <Link
                    href={`/blog?page=${page - 1}`}
                    className={cn("flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-95", paginationHover)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t("previous")}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/50 text-slate-300 dark:text-slate-700 font-black text-[11px] uppercase tracking-widest cursor-not-allowed">
                    <ArrowLeft className="w-4 h-4" />
                    {t("previous")}
                  </div>
                )}

                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest">
                  {t("pageOf", { page, total: totalPages })}
                </div>

                {page < totalPages ? (
                  <Link
                    href={`/blog?page=${page + 1}`}
                    className={cn("flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-95", paginationHover)}
                  >
                    {t("next")}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/50 text-slate-300 dark:text-slate-700 font-black text-[11px] uppercase tracking-widest cursor-not-allowed">
                    {t("next")}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <DentalFooter
        branding={settings.branding ?? undefined}
        footer={settings.footer ?? undefined}
        contact={settings.contact ?? undefined}
        social={settings.social ?? undefined}
      />
    </div>
  );
}
