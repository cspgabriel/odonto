"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { UserRole } from "@/lib/auth";
import type { ClinicType } from "@/lib/actions/clinic-actions";
import { useTranslations } from "@/lib/i18n";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  Building2,
  Package,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Globe,
  Newspaper,
  FlaskConical,
  Settings,
  Clock,
  Droplet,
  Folder,
  ChevronDown,
  Activity,
  FileEdit,
  Tag,
  Paperclip,
  Shield,
} from "lucide-react";

// Native SVG Tooth icon since Lucide lacks one
const ToothIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15.4 3.7c-1-1-2.6-1.5-4-1C10 3.2 8.4 3.7 7.4 4.7 5.5 6.6 5 9.9 6.2 12c1.2 2.1 2.8 4.2 2.8 6.5v1A1.5 1.5 0 0 0 10.5 21h3a1.5 1.5 0 0 0 1.5-1.5v-1c0-2.3 1.6-4.4 2.8-6.5C19 9.9 18.5 6.6 16.6 4.7z" />
    <path d="M12 11v10" />
  </svg>
);

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  permissionKey?: keyof import("@/app/(dashboard)/dashboard/_components/app-sidebar").SidebarPermissions;
  adminOnly?: boolean;
  badge?: string;
}

export interface NavItemWithChildren {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  permissionKey?: keyof import("@/app/(dashboard)/dashboard/_components/app-sidebar").SidebarPermissions;
  adminOnly?: boolean;
  children?: NavItem[];
}

const overviewItems: NavItem[] = [
  {
    title: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "doctor", "receptionist", "nurse"],
  },
];

const websiteManagementItems: NavItem[] = [
  {
    title: "demos",
    href: "/",
    icon: Globe,
    roles: ["admin", "doctor", "receptionist", "nurse"],
    children: [
      { title: "dentalLanding", href: "/?clinic=dental", icon: Globe, roles: ["admin", "doctor", "receptionist", "nurse"] },
      { title: "generalLanding", href: "/?clinic=general", icon: Globe, roles: ["admin", "doctor", "receptionist", "nurse"] },
      { title: "ophthalmologyLanding", href: "/?clinic=ophthalmology", icon: Globe, roles: ["admin", "doctor", "receptionist", "nurse"] },
      { title: "loginPage", href: "/login", icon: Settings, roles: ["admin", "doctor", "receptionist", "nurse"] },
    ],
  },
  {
    title: "blogNews",
    href: "/dashboard/blog",
    icon: Newspaper,
    roles: ["admin", "doctor"],
  },
  {
    title: "landingSettings",
    href: "/dashboard/landing-settings",
    icon: Globe,
    roles: ["admin"],
    permissionKey: "settings",
  },
];

const patientManagementItems: (NavItem | NavItemWithChildren)[] = [
  {
    title: "patients",
    href: "/dashboard/patients",
    icon: Users,
    roles: ["admin", "doctor", "receptionist", "nurse"],
    permissionKey: "patients",
  },
  {
    title: "appointments",
    href: "/dashboard/appointments",
    icon: Calendar,
    roles: ["admin", "doctor", "receptionist", "nurse"],
    permissionKey: "appointments",
  },
  {
    title: "prescriptions",
    href: "/dashboard/prescriptions",
    icon: Stethoscope,
    roles: ["admin", "doctor", "receptionist", "nurse"],
    permissionKey: "prescriptions",
  },
  {
    title: "testReports",
    href: "/dashboard/test-reports",
    icon: FileText,
    roles: ["admin", "doctor", "receptionist", "nurse"],
    permissionKey: "testReports",
    children: [
      { title: "tests", href: "/dashboard/test-reports/tests", icon: FlaskConical, roles: ["admin", "doctor", "receptionist", "nurse"] },
      { title: "testReports", href: "/dashboard/test-reports", icon: FileText, roles: ["admin", "doctor", "receptionist", "nurse"] },
      { title: "methodology", href: "/dashboard/test-reports/methodologies", icon: Settings, roles: ["admin", "doctor", "receptionist", "nurse"] },
      { title: "turnaroundTime", href: "/dashboard/test-reports/turnaround-times", icon: Clock, roles: ["admin", "doctor", "receptionist", "nurse"] },
      { title: "sampleType", href: "/dashboard/test-reports/sample-types", icon: Droplet, roles: ["admin", "doctor", "receptionist", "nurse"] },
      { title: "category", href: "/dashboard/test-reports/categories", icon: Folder, roles: ["admin", "doctor", "receptionist", "nurse"] },
    ],
  },
];

const financialManagementItems: NavItem[] = [
  {
    title: "invoices",
    href: "/dashboard/invoices",
    icon: Receipt,
    roles: ["admin", "receptionist"],
    permissionKey: "billing",
  },
  {
    title: "payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    roles: ["admin", "receptionist"],
    permissionKey: "billing",
  },
  {
    title: "expenses",
    href: "/dashboard/expenses",
    icon: Wallet,
    roles: ["admin", "receptionist"],
    permissionKey: "billing",
  },
];

const operationsItems: NavItem[] = [
  {
    title: "services",
    href: "/dashboard/services",
    icon: Stethoscope,
    roles: ["admin", "doctor", "nurse", "receptionist"],
    permissionKey: "services",
  },
  {
    title: "departments",
    href: "/dashboard/departments",
    icon: Building2,
    roles: ["admin", "doctor", "nurse", "receptionist"],
    permissionKey: "departments",
  },
  {
    title: "inventory",
    href: "/dashboard/inventory",
    icon: Package,
    roles: ["admin", "doctor", "nurse"],
    permissionKey: "inventory",
  },
  {
    title: "staff",
    href: "/dashboard/staff",
    icon: Users,
    roles: ["admin"],
    permissionKey: "staff",
  },
  {
    title: "labVendors",
    href: "/dashboard/lab-vendors",
    icon: FlaskConical,
    roles: ["admin"],
    permissionKey: "testReports",
  },
  {
    title: "permissions",
    href: "/dashboard/permissions",
    icon: Shield,
    roles: ["admin"],
    adminOnly: true,
  },
];

/*
const analyticsItems: NavItem[] = [
  {
    title: "calendar",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    roles: ["admin", "doctor", "receptionist", "nurse"],
  },
  {
    title: "reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["admin", "doctor", "receptionist", "nurse"],
  },
];
*/
const analyticsItems: NavItem[] = []; // Temporary empty for MVP

function CollapsibleWithSidebar({
  defaultOpen,
  isSidebarExpanded,
  isParentActive,
  item,
  childrenItems,
  pathname,
  controlledOpen,
  onControlledOpenChange,
}: {
  defaultOpen: boolean;
  isSidebarExpanded: boolean;
  isParentActive: boolean;
  item: NavItem & Partial<NavItemWithChildren>;
  childrenItems: NavItem[];
  pathname: string;
  /** When provided, this collapsible is controlled (e.g. accordion: only one open). */
  controlledOpen?: boolean;
  onControlledOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  React.useEffect(() => {
    if (!isSidebarExpanded && onControlledOpenChange) onControlledOpenChange(false);
    else if (!isSidebarExpanded) setInternalOpen(false);
  }, [isSidebarExpanded, onControlledOpenChange]);

  const isControlled = controlledOpen !== undefined && onControlledOpenChange != null;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onControlledOpenChange! : setInternalOpen;
  const effectiveOpen = isSidebarExpanded && open;

  return (
    <Collapsible open={effectiveOpen} onOpenChange={setOpen} className="group">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isParentActive}
            tooltip={item.title}
            className="w-full [&>svg:last-child]:shrink-0"
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            <span>{item.title}</span>
            {isSidebarExpanded && (
              <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="grid grid-rows-[0fr] data-[state=open]:grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out overflow-hidden">
          <div className="min-h-0">
            <SidebarMenu className="mt-1 gap-1 border-l border-sidebar-border pl-2 ml-2 group-data-[collapsible=icon]:hidden opacity-0 group-data-[state=open]:opacity-100 transition-opacity duration-200 ease-out">
              {childrenItems.map((child) => (
                <NavItemRow key={`${child.href}-${child.title}`} item={child} pathname={pathname} indent />
              ))}
            </SidebarMenu>
          </div>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavItemRow({ item, pathname, indent }: { item: NavItem; pathname: string; indent?: boolean }) {
  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" &&
      pathname.startsWith(item.href) &&
      item.href !== "/dashboard/test-reports" &&
      item.href !== "/dashboard/medical-records" &&
      item.href !== "/dashboard/lab-vendors");
  return (
    <SidebarMenuItem key={`${item.href}-${item.title}`} className={indent ? "ml-4 pr-2" : undefined}>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link href={item.href}>
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{item.title}</span>
          {item.badge && (
            <span className="group-data-[collapsible=icon]:hidden rounded-md border px-1 py-0 text-[8px] font-medium uppercase tracking-wider shadow-sm backdrop-blur-sm border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-900/60 dark:text-rose-200 ml-auto flex-shrink-0 flex items-center justify-center h-[18px] leading-none">
              {item.badge}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavSection({
  label,
  items,
  role,
  pathname,
  isSidebarExpanded,
  accordion,
  permissions,
}: {
  label: string;
  items: (NavItem | NavItemWithChildren)[];
  role: UserRole;
  pathname: string;
  isSidebarExpanded: boolean;
  accordion?: boolean;
  permissions?: Record<string, boolean>;
}) {
  const showItem = (item: NavItem | NavItemWithChildren) => {
    if (item.adminOnly) return role === "admin";
    if (item.permissionKey && permissions) return permissions[item.permissionKey] === true;
    return item.roles.includes(role);
  };
  const filtered = items.filter(showItem);
  if (filtered.length === 0) return null;

  const itemsWithChildren = filtered.filter(
    (raw) => "children" in raw && Array.isArray((raw as NavItemWithChildren).children) && (raw as NavItemWithChildren).children!.length > 0
  );
  const initialOpenKey = accordion
    ? (itemsWithChildren.find((raw) => {
        const item = raw as NavItem & Partial<NavItemWithChildren>;
        return (
          pathname === item.href ||
          (pathname.startsWith(item.href) && (item.href === "/dashboard/test-reports" || item.href === "/dashboard/medical-records" || item.href === "/dashboard/odontograms"))
        );
      }) as NavItem & Partial<NavItemWithChildren> | undefined)?.href ?? null
    : null;

  const [openKey, setOpenKey] = React.useState<string | null>(initialOpenKey);

  React.useEffect(() => {
    if (!accordion) return;
    const roleFiltered = items.filter((it) => {
      if (it.adminOnly) return role === "admin";
      if (it.permissionKey && permissions) return permissions[it.permissionKey] === true;
      return it.roles.includes(role);
    });
    const withChildren = roleFiltered.filter(
      (raw) => "children" in raw && Array.isArray((raw as NavItemWithChildren).children) && (raw as NavItemWithChildren).children!.length > 0
    );
    const active = withChildren.find((raw) => {
      const it = raw as NavItem & Partial<NavItemWithChildren>;
      return (
        pathname === it.href ||
        (pathname.startsWith(it.href) && (it.href === "/dashboard/test-reports" || it.href === "/dashboard/medical-records" || it.href === "/dashboard/odontograms"))
      );
    }) as (NavItem & Partial<NavItemWithChildren>) | undefined;
    if (active?.href) setOpenKey(active.href);
  }, [pathname, accordion, items, role, permissions]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          {filtered.map((raw) => {
            const hasChildren = "children" in raw && Array.isArray(raw.children) && raw.children.length > 0;
            const item = raw as NavItem & Partial<NavItemWithChildren>;
            const childShow = (c: NavItem) => {
              if (c.adminOnly) return role === "admin";
              if (c.permissionKey && permissions) return permissions[c.permissionKey] === true;
              return c.roles.includes(role);
            };
            const children = hasChildren ? (item.children ?? []).filter(childShow) : [];
            const isParentActive =
              pathname === item.href ||
              (pathname.startsWith(item.href) && (item.href === "/dashboard/test-reports" || item.href === "/dashboard/medical-records" || item.href === "/dashboard/odontograms"));
            const defaultOpen = isParentActive;

            if (hasChildren && children.length > 0) {
              const controlledOpen = accordion ? openKey === item.href : undefined;
              const onControlledOpenChange = accordion
                ? (open: boolean) => setOpenKey(open ? item.href : null)
                : undefined;
              return (
                <CollapsibleWithSidebar
                  key={`${item.href}-${item.title}`}
                  defaultOpen={defaultOpen}
                  isSidebarExpanded={isSidebarExpanded}
                  isParentActive={isParentActive}
                  item={item}
                  childrenItems={children}
                  pathname={pathname}
                  controlledOpen={controlledOpen}
                  onControlledOpenChange={onControlledOpenChange}
                />
              );
            }
            return <NavItemRow key={`${item.href}-${item.title}`} item={raw as NavItem} pathname={pathname} />;
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function NavMain({
  role,
  clinicType = "general",
  permissions,
}: {
  role: UserRole;
  clinicType?: ClinicType;
  permissions?: Record<string, boolean>;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const overviewLabel =
    clinicType === "dental"
      ? t("overviewDental")
      : clinicType === "ophthalmology"
        ? t("overviewOphthalmology")
        : t("overview");

  // Translate nav items
  const translatedOverviewItems = overviewItems.map((item) => ({
    ...item,
    title: t(item.title),
  }));

  const translatedWebsiteItems = websiteManagementItems.map((item) => ({
    ...item,
    title: t(item.title),
  }));

  const translatedPatientManagementItems = [...patientManagementItems];
  const medicalOrDentalItem: NavItem | NavItemWithChildren =
    clinicType === "dental"
      ? {
          title: "odontograms",
          href: "/dashboard/odontograms",
          icon: ToothIcon,
          roles: ["admin", "doctor", "receptionist", "nurse"],
          permissionKey: "odontogram",
          badge: t("clinicCategoryDental"),
        }
      : {
          title: "medicalRecords",
          href: "/dashboard/medical-records",
          icon: ClipboardList,
          roles: ["admin", "doctor", "receptionist", "nurse"],
          permissionKey: "medicalRecords",
          children: [
            { title: "medicalRecordsOverview", href: "/dashboard/medical-records", icon: LayoutDashboard, roles: ["admin", "doctor", "receptionist", "nurse"] },
            { title: "medicalRecordsVitals", href: "/dashboard/medical-records/vitals", icon: Activity, roles: ["admin", "doctor", "receptionist", "nurse"] },
            { title: "medicalRecordsClinicalNotes", href: "/dashboard/medical-records/clinical-notes", icon: FileEdit, roles: ["admin", "doctor", "receptionist", "nurse"] },
            { title: "medicalRecordsDiagnoses", href: "/dashboard/medical-records/diagnoses", icon: Tag, roles: ["admin", "doctor", "receptionist", "nurse"] },
            { title: "medicalRecordsAttachments", href: "/dashboard/medical-records/attachments", icon: Paperclip, roles: ["admin", "doctor", "receptionist", "nurse"] },
            { title: "medicalRecordsVisitTimeline", href: "/dashboard/medical-records/visit-timeline", icon: CalendarDays, roles: ["admin", "doctor", "receptionist", "nurse"] },
          ],
        };
  translatedPatientManagementItems.splice(2, 0, medicalOrDentalItem);

  const finalPatientManagementItems = translatedPatientManagementItems.map((item) => {
    const base = { ...item, title: t(item.title) };
    if ("children" in base && Array.isArray(base.children)) {
      return {
        ...base,
        children: base.children.map((c) => ({ ...c, title: t(c.title) })),
      };
    }
    return base;
  });

  const translatedFinancialManagementItems = financialManagementItems.map((item) => ({
    ...item,
    title: t(item.title),
  }));

  const translatedOperationsItems = operationsItems.map((item) => ({
    ...item,
    title: t(item.title),
  }));

  const translatedAnalyticsItems = analyticsItems.map((item) => ({
    ...item,
    title: t(item.title),
  }));

  const showOverview = overviewItems.some((item) => item.roles.includes(role));
  const showWebsiteSection = websiteManagementItems.some((item) => item.roles.includes(role));
  const showPatientSection =
    patientManagementItems.some((item) => item.roles.includes(role));
  const showFinancialSection =
    financialManagementItems.some((item) => item.roles.includes(role));
  const showOperationsSection =
    operationsItems.some((item) => item.roles.includes(role));
  const showAnalyticsSection =
    analyticsItems.some((item) => item.roles.includes(role));

  const { state } = useSidebar();
  const isSidebarExpanded = state === "expanded";

  return (
    <>
      {showOverview && (
        <NavSection
          label={overviewLabel}
          items={translatedOverviewItems}
          role={role}
          pathname={pathname}
          isSidebarExpanded={isSidebarExpanded}
          permissions={permissions}
        />
      )}

      {showPatientSection && (
        <>
          <SidebarSeparator className="my-1" />
          <NavSection
            label={t("patientManagement")}
            items={finalPatientManagementItems}
            role={role}
            pathname={pathname}
            isSidebarExpanded={isSidebarExpanded}
            accordion
            permissions={permissions}
          />
        </>
      )}

      {showOperationsSection && (
        <>
          <SidebarSeparator className="my-1" />
          <NavSection
            label={t("operations")}
            items={translatedOperationsItems}
            role={role}
            pathname={pathname}
            isSidebarExpanded={isSidebarExpanded}
            permissions={permissions}
          />
        </>
      )}

      {showFinancialSection && (
        <>
          <SidebarSeparator className="my-1" />
          <NavSection
            label={t("financialManagement")}
            items={translatedFinancialManagementItems}
            role={role}
            pathname={pathname}
            isSidebarExpanded={isSidebarExpanded}
            permissions={permissions}
          />
        </>
      )}

      {/* 
          ANALYTICS & REPORTS 
          NOT ARRANGED IN THIS VERSION (MVP)
      */}
      {/* 
      {showAnalyticsSection && (
        <>
          <SidebarSeparator className="my-1" />
          <NavSection
            label={t("analyticsReports")}
            items={translatedAnalyticsItems}
            role={role}
            pathname={pathname}
          />
        </>
      )}
      */}

      {showWebsiteSection && (
        <>
          <SidebarSeparator className="my-1" />
          <NavSection
            label={t("websiteManagement")}
            items={translatedWebsiteItems}
            role={role}
            pathname={pathname}
            isSidebarExpanded={isSidebarExpanded}
            permissions={permissions}
          />
        </>
      )}
    </>
  );
}
