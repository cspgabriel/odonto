"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import type { UserRole } from "@/lib/auth";
import type { ClinicType } from "@/lib/actions/clinic-actions";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/contexts/preferences-context";
import { useTranslations } from "@/lib/i18n";

/** Badge colors must match clinic type: dental=rose, general=cyan (general landing primary #0cc0df), ophthalmology=teal */
const CATEGORY_BADGE_STYLE: Record<ClinicType, string> = {
  dental:
    "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
  ophthalmology:
    "border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-900/60 dark:text-teal-200",
  general:
    "border-cyan-200 bg-cyan-100 text-cyan-800 dark:border-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200",
};

export type SidebarPermissions = {
  appointments: boolean;
  patients: boolean;
  billing: boolean;
  inventory: boolean;
  staff: boolean;
  medicalRecords: boolean;
  prescriptions: boolean;
  testReports: boolean;
  services: boolean;
  departments: boolean;
  settings: boolean;
  odontogram: boolean;
};

interface AppSidebarProps {
  role: UserRole;
  clinicType?: ClinicType;
  permissions?: SidebarPermissions;
}

export function AppSidebar({ role, clinicType = "general", permissions }: AppSidebarProps) {
  const { state } = useSidebar();
  const { locale } = usePreferences();
  const t = useTranslations("nav");
  const isRtl = locale === "ar";
  const isCollapsed = state === "collapsed";

  const categoryLabel = clinicType === "dental" ? t("clinicCategoryDental") : clinicType === "ophthalmology" ? t("clinicCategoryOphthalmology") : t("clinicCategoryGeneral");
  const categoryLabelShort = clinicType === "dental" ? t("clinicCategoryDentalShort") : clinicType === "ophthalmology" ? t("clinicCategoryOphthalmologyShort") : t("clinicCategoryGeneralShort");

  return (
    <Sidebar side={isRtl ? "right" : "left"} variant="inset" collapsible="icon">
      <SidebarHeader
        className={cn(
          "pb-1",
          isCollapsed && "pb-3 mt-4"
        )}
      >
        <SidebarMenu className={cn(isCollapsed && "items-center w-full")}>
          <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
            <div className="relative w-fit">
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center rounded-xl transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed ? "w-full justify-center p-2" : "w-full justify-start p-2"
                )}
                aria-label={t("homeLabel")}
              >
                {/* When sidebar is closed: only symbol (public/symbol_light.svg, symbol_dark.svg) — never full logo */}
                {isCollapsed ? (
                  <>
                    <Image
                      src="/symbol_light.svg"
                      alt="CareNova"
                      width={32}
                      height={32}
                      className="dark:hidden size-8 shrink-0 p-0"
                      priority
                    />
                    <Image
                      src="/symbol_dark.svg"
                      alt="CareNova"
                      width={32}
                      height={32}
                      className="hidden dark:block size-8 shrink-0 p-0"
                      priority
                    />
                  </>
                ) : (
                  <>
                    <Image
                      src="/Logo_light.svg"
                      alt="CareNova"
                      width={160}
                      height={32}
                      className="dark:hidden h-8 w-auto shrink-0"
                      priority
                    />
                    <Image
                      src="/Logo_Dark.svg"
                      alt="CareNova"
                      width={160}
                      height={32}
                      className="hidden dark:block h-8 w-auto shrink-0"
                      priority
                    />
                  </>
                )}
              </Link>
              {/* Category badge over "Nova" when expanded; corner of icon when collapsed (short label so it fits) */}
              <div
                className={cn(
                  "pointer-events-none absolute z-10 rounded-md border px-1 py-0.5 text-[8px] font-medium uppercase tracking-wider shadow-sm backdrop-blur-sm whitespace-nowrap",
                  CATEGORY_BADGE_STYLE[clinicType],
                  isCollapsed
                    ? isRtl
                      ? "-top-1 -left-1"
                      : "-top-1 -right-1"
                    : isRtl
                      ? "top-0 left-0"
                      : "top-0 right-0"
                )}
              >
                {isCollapsed ? categoryLabelShort : categoryLabel}
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-1 mb-6" data-clinic-type={clinicType}>
        <NavMain role={role} clinicType={clinicType} permissions={permissions} />
      </SidebarContent>
    </Sidebar>
  );
}
