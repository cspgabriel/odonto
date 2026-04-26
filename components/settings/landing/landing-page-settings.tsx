"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslations } from "next-intl";
import { BrandingTab } from "./branding-tab";
import { ColorsTab } from "./colors-tab";
import { ContentTab } from "./content-tab";
import { SEOTab } from "./seo-tab";
import { TypographyTab } from "./typography-tab";
import { CTATab } from "./cta-tab";
import { ContactTab } from "./contact-tab";
import { SocialTab } from "./social-tab";
import { FooterTab } from "./footer-tab";
import { FeaturesTab } from "./features-tab";
import { Button } from "@/components/ui/button";
import { Loader2, Check, RotateCcw, Image, Palette, FileText, Search, Type, Phone, Share2, Link2, PanelBottom, Save, Settings2 } from "lucide-react";
import { getLandingSettings, resetLandingSettings, updateLandingSettingsFull } from "@/lib/actions/landing-settings-actions";
import { mergeWithLandingDefaults } from "@/lib/constants/landing-defaults";
import { toast } from "sonner";
import type { LandingSettings } from "@/lib/validations/landing-settings";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClinicType } from "@/lib/actions/clinic-actions";

interface LandingPageSettingsProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
  onSidebarHover?: (hovering: boolean) => void;
  forceClosed?: boolean;
  clinicType?: ClinicType;
}

const ALL_SIDEBAR_IDS = [
  "branding",
  "colors",
  "content",
  "seo",
  "typography",
  "features",
  "cta",
  "contact",
  "social",
  "footer",
] as const;
const SIDEBAR_ICONS = [Image, Palette, FileText, Search, Type, Settings2, Link2, Phone, Share2, PanelBottom] as const;

const TABS_BY_CLINIC_TYPE: Record<ClinicType, readonly string[]> = {
  dental: ALL_SIDEBAR_IDS,
  general: ["branding", "colors", "content", "seo", "typography", "features", "cta", "contact", "social", "footer"],
  ophthalmology: ["branding", "colors", "content", "seo", "typography", "features", "cta", "contact", "social", "footer"],
};

const TAB_ID_TO_ICON: Record<(typeof ALL_SIDEBAR_IDS)[number], typeof SIDEBAR_ICONS[number]> = {
  branding: Image,
  colors: Palette,
  content: FileText,
  seo: Search,
  typography: Type,
  features: Settings2,
  cta: Link2,
  contact: Phone,
  social: Share2,
  footer: PanelBottom,
};

/** Deep clone so form gets its own copy and RHF initializes correctly. */
function cloneLandingSettings(data: LandingSettings): LandingSettings {
  return JSON.parse(JSON.stringify(data)) as LandingSettings;
}

function LandingFormWithData({
  initialData,
  activeSubTab,
  onSubTabChange,
  onSidebarHover,
  forceClosed,
  clinicType = "dental",
}: LandingPageSettingsProps & { initialData: LandingSettings }) {
  const [saving, setSaving] = useState(false);
  const [internalHover, setInternalHover] = useState(false);
  const isExpanded = !forceClosed;

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultValues = useMemo(
    () => cloneLandingSettings(mergeWithLandingDefaults(initialData, clinicType)),
    [initialData, clinicType]
  );
  const form = useForm<LandingSettings>({
    defaultValues,
    mode: "onChange",
  });
  const { reset, getValues, formState: { isDirty } } = form;
  const watchValues = form.watch();

  const t = useTranslations("landingSettings");
  const sidebarIds = TABS_BY_CLINIC_TYPE[clinicType];
  const saveChanges = async () => {
    setSaving(true);
    try {
      const values = getValues();
      const result = await updateLandingSettingsFull(values);
      if (result.success) {
        reset(values);
        toast.success(t("toastSaved"));
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveChanges();
  };

  const handleReset = async () => {
    if (!confirm(t("resetConfirm"))) return;
    const result = await resetLandingSettings();
    if (result.success) {
      toast.success(t("toastReset"));
      const data = await getLandingSettings();
      const merged = mergeWithLandingDefaults(data, clinicType);
      reset(merged);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <FormProvider {...form}>
      <div className="dashboard-page">
        {/* Header: title + subtitle + actions */}
        <div className="dashboard-page-header">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-page-title font-heading">{t("title")}</h1>
              <p className="dashboard-page-description text-muted-foreground">
                {t("pageDescription")}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {saving ? (
                <span className="flex items-center gap-2 text-amber-600 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving")}
                </span>
              ) : isDirty ? (
                <span className="flex items-center gap-2 text-muted-foreground text-sm">
                  {t("unsavedChanges")}
                </span>
              ) : (
                <span className="flex items-center gap-2 text-green-600 text-sm">
                  <Check className="h-4 w-4" />
                  {t("allChangesSaved")}
                </span>
              )}
              <Button size="sm" onClick={handleManualSave} disabled={saving || !isDirty}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("save")}
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("reset")}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar + Content layout */}
        <div className="flex gap-6">
          <aside
            onMouseEnter={() => {
              setInternalHover(true);
              onSidebarHover?.(true);
            }}
            onMouseLeave={() => {
              setInternalHover(false);
              onSidebarHover?.(false);
            }}
            className={cn(
              "shrink-0 rounded-lg border bg-background transition-[width] duration-200 ease-out overflow-hidden shadow-sm",
              isExpanded ? "w-52" : "w-14"
            )}
          >
            <nav className="p-2 space-y-0.5">
              {sidebarIds.map((id) => {
                const Icon = TAB_ID_TO_ICON[id as keyof typeof TAB_ID_TO_ICON];
                const label = t(id);
                const isActive = activeSubTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSubTabChange(id)}
                    title={label}
                    className={cn(
                      "flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer",
                      isExpanded ? "gap-3 text-left" : "justify-center",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {isExpanded && <span className="truncate">{label}</span>}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 space-y-6">
            <div className="bg-background rounded-lg border p-6 shadow-sm">
              {activeSubTab === "branding" && <BrandingTab />}
              {activeSubTab === "colors" && <ColorsTab />}
              {activeSubTab === "content" && <ContentTab clinicType={clinicType} />}
              {activeSubTab === "seo" && <SEOTab />}
              {activeSubTab === "typography" && <TypographyTab />}
              {activeSubTab === "features" && <FeaturesTab />}
              {activeSubTab === "cta" && <CTATab />}
              {activeSubTab === "contact" && <ContactTab />}
              {activeSubTab === "social" && <SocialTab />}
              {activeSubTab === "footer" && <FooterTab />}
            </div>
          </main>
        </div>
      </div>
    </FormProvider>
  );
}

export function LandingPageSettings({ activeSubTab, onSubTabChange, onSidebarHover, clinicType = "dental" }: LandingPageSettingsProps) {
  const tLoadError = useTranslations("landingSettings");
  const [initialData, setInitialData] = useState<LandingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getLandingSettings();
        const merged = mergeWithLandingDefaults(data, clinicType);
        if (!cancelled) setInitialData(merged);
      } catch (e) {
        if (!cancelled) {
          toast.error(tLoadError("toastLoadFailed"));
          setInitialData(mergeWithLandingDefaults(null, clinicType));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || initialData === null) {
    return (
      <div className="flex min-h-[500px]">
        <Skeleton className="w-56 shrink-0 border-r" />
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const sidebarIds = TABS_BY_CLINIC_TYPE[clinicType];
  const safeSubTab = sidebarIds.includes(activeSubTab) ? activeSubTab : sidebarIds[0];

  return (
    <LandingFormWithData
      initialData={initialData}
      activeSubTab={safeSubTab}
      onSubTabChange={onSubTabChange}
      onSidebarHover={onSidebarHover}
      clinicType={clinicType}
    />
  );
}
