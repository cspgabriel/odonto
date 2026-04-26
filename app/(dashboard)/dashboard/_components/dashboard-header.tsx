"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CurrencyShortcut } from "./currency-shortcut";
import { LanguageShortcut } from "./language-shortcut";
import { NavUser } from "./nav-user";
import { ThemeSwitcher } from "./theme-switcher";
import { FullScreenSwitcher } from "./fullscreen-switcher";
import { NotificationBell } from "./notification-bell";

const VALID_CLINIC_TYPES = ["dental", "general", "ophthalmology"] as const;

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
    role: "admin" | "doctor" | "receptionist" | "nurse";
  };
  clinicType?: string;
}

export function DashboardHeader({ user, clinicType }: DashboardHeaderProps) {
  const previewHref =
    clinicType && VALID_CLINIC_TYPES.includes(clinicType as (typeof VALID_CLINIC_TYPES)[number])
      ? `/?clinic=${clinicType}`
      : "/?preview=1";
  const t = useTranslations("header");
  return (
    <header className="bg-background flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] duration-300 ease-in-out group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 overflow-visible">
      <div className="flex w-full items-center justify-between px-4 lg:px-6 overflow-visible">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <CurrencyShortcut />
          <LanguageShortcut />
          <Separator orientation="vertical" className="h-4" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer rounded-xl transition-colors duration-200 hover:bg-muted/50 w-8 h-8 justify-center p-2"
                  asChild
                >
                  <Link href={previewHref} target="_blank" rel="noopener noreferrer" aria-label={t("previewWebsite")}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t("previewWebsite")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <NotificationBell />
          <ThemeSwitcher variant="header" />
          <FullScreenSwitcher variant="header" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center">
            <NavUser user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
