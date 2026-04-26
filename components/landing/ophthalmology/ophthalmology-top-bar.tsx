"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { OPHTHALMOLOGY_MAX_WIDTH } from "./config";
import { cn } from "@/lib/utils";
import { Phone, Mail, Facebook, Instagram, Linkedin } from "lucide-react";
import type { LandingSettings } from "@/lib/validations/landing-settings";

/**
 * Dental landing only: thin strip above navbar with contact + socials.
 * Reads from settings when available, falls back to i18n.
 */
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);

type Props = {
  contact?: LandingSettings["contact"];
  social?: LandingSettings["social"];
  features?: any;
  colors?: any;
};

export function OphthalmologyTopBar({ contact, social, features, colors }: Props) {
  const t = useTranslations("landing.topBar");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/" || pathname === "/en" || pathname === "/fr" || pathname === "/ar" || pathname === "/es";
  /** Only content darker on non-home for readability; bar stays transparent until scroll */
  const useDarkTopBarContent = scrolled || !isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const phone = contact?.phone || t("phone");
  const email = contact?.email || t("email");

  const socials = [
    { Icon: Linkedin, href: social?.linkedin || "#", label: "LinkedIn", enabled: social?.enabled?.linkedin ?? true },
    { Icon: Instagram, href: social?.instagram || "#", label: "Instagram", enabled: social?.enabled?.instagram ?? true },
    { Icon: Facebook, href: social?.facebook || "#", label: "Facebook", enabled: social?.enabled?.facebook ?? true },
    { Icon: XIcon, href: social?.twitter || "#", label: "X", enabled: social?.enabled?.twitter ?? true },
  ];

  if (features?.enableTopBar === false) return null;

  const customBg = features?.topBarType === "custom" ? (features?.topBarCustomBgColor || colors?.primary || "#000000") : undefined;

  const linkCls = (c: string) =>
    cn(
      "flex items-center gap-1.5 shrink-0 transition-colors hover:text-teal-400",
      !useDarkTopBarContent ? "text-white" : c
    );

  return (
    <div
      className={cn(
        "left-0 right-0 top-0 z-[60] flex min-h-9 sm:h-10 items-center transition-all duration-500 ease-in-out",
        scrolled ? "fixed" : "absolute",
        !customBg && !scrolled && "bg-transparent",
        !customBg && scrolled && "bg-white dark:bg-slate-950"
      )}
      style={customBg ? { backgroundColor: customBg } : undefined}
      aria-label={features?.topBarType === "custom" ? "Top Banner" : "Contact and social links"}
    >
      <div className={cn("mx-auto flex w-full min-w-0 items-center justify-between gap-2 px-3 sm:px-6 text-[10px] sm:text-xs", OPHTHALMOLOGY_MAX_WIDTH)}>
        {(features?.topBarType === "custom") ? (
          <div className="w-full min-w-0 truncate text-center text-white font-medium">
            {features?.topBarCustomText || "Custom Banner Text"}
          </div>
        ) : (
          <>
            <div className="flex min-w-0 shrink items-center gap-2 sm:gap-6 overflow-hidden">
              <a href={`tel:${phone.replace(/\s/g, "")}`} className={linkCls("text-slate-600 dark:text-slate-300 dark:hover:text-teal-500")}>
                <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="truncate max-sm:max-w-[100px] sm:max-w-none">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className={cn(linkCls("text-slate-600 dark:text-slate-300 dark:hover:text-teal-500"), "max-md:hidden")}>
                <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{email}</span>
              </a>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              {socials.filter(s => s.enabled).map(({ Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "transition-colors hover:text-teal-400 shrink-0 p-0.5",
                    !useDarkTopBarContent ? "text-white" : "text-slate-500 dark:text-slate-400 dark:hover:text-teal-500"
                  )}
                  aria-label={label}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
