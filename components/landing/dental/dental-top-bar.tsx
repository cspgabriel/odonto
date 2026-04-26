"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { DENTAL_MAX_WIDTH } from "./config";
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

export function DentalTopBar({ contact, social, features, colors }: Props) {
  const t = useTranslations("landing.topBar");

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

  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-0 z-[60] flex h-10 items-center px-4",
        !customBg && "bg-transparent"
      )}
      style={customBg ? { backgroundColor: customBg } : undefined}
      aria-label={features?.topBarType === "custom" ? "Top Banner" : "Contact and social links"}
    >
      <div className={cn("mx-auto flex w-full items-center justify-between text-xs", DENTAL_MAX_WIDTH)}>
        {(features?.topBarType === "custom") ? (
          <div className="w-full text-center text-white font-medium">
            {features?.topBarCustomText || "Custom Banner Text"}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-6">
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="flex items-center gap-1.5 text-slate-600 transition-colors hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-500"
              >
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 text-slate-600 transition-colors hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-500"
              >
                <Mail className="h-3.5 w-3.5" />
                {email}
              </a>
            </div>
            <div className="flex items-center gap-4">
              {socials.filter(s => s.enabled).map(({ Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-slate-500 transition-colors hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-500"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
