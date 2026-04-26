"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { GENERAL_MAX_WIDTH } from "./config";
import { cn } from "@/lib/utils";
import { Phone, Mail, Facebook, Instagram, Linkedin, X } from "lucide-react";
import type { LandingSettings } from "@/lib/validations/landing-settings";

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

export function GeneralTopBar({ contact, social, features, colors }: Props) {
  const t = useTranslations("landing.topBar");
  const [dismissed, setDismissed] = useState(false);
  const handleDismiss = useCallback(() => {
    setDismissed(true);
    typeof window !== "undefined" && window.dispatchEvent(new CustomEvent("general-topbar-dismissed"));
  }, []);

  const phone = contact?.phone || t("phone");
  const email = contact?.email || t("email");

  const socials = [
    { Icon: Linkedin, href: social?.linkedin || "#", label: "LinkedIn", enabled: social?.enabled?.linkedin ?? true },
    { Icon: Instagram, href: social?.instagram || "#", label: "Instagram", enabled: social?.enabled?.instagram ?? true },
    { Icon: Facebook, href: social?.facebook || "#", label: "Facebook", enabled: social?.enabled?.facebook ?? true },
    { Icon: XIcon, href: social?.twitter || "#", label: "X", enabled: social?.enabled?.twitter ?? true },
  ];

  if (features?.enableTopBar === false || dismissed) return null;

  const isCustomText = features?.topBarType === "custom";
  const offerText = features?.topBarCustomText || t("offer");

  return (
    <div className="absolute left-0 right-0 top-0 z-[50] px-4 pt-2" aria-label={isCustomText ? "Top Banner" : "Contact and social links"}>
      <div
        className={cn(
          "mx-auto flex h-auto min-h-8 w-full max-w-[calc(80rem-2rem)] flex-wrap items-center justify-between gap-2 rounded-xl pl-4 pr-1 py-2 text-xs sm:flex-nowrap sm:py-0 sm:pl-4 sm:pr-1 sm:h-8",
          "bg-gradient-to-r from-[#0aa5c4] via-[#0cc0df] to-[#2dd4f0]",
          "dark:from-[#0891b2] dark:via-[#0cc0df] dark:to-[#22d3ee]"
        )}
      >
        {isCustomText ? (
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 font-medium text-white">
            <span>{offerText}</span>
            <Link
              href="/appointment"
              className="shrink-0 font-semibold text-white underline underline-offset-2 decoration-white/70 transition-colors hover:decoration-white"
            >
              {t("bookNow")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:flex-initial sm:flex-nowrap sm:justify-start sm:gap-6">
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="flex shrink-0 items-center gap-1.5 text-white/90 transition-colors hover:text-white"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{phone}</span>
              </a>
              <a
                href={`mailto:${email}`}
                className="flex shrink-0 items-center gap-1.5 text-white/90 transition-colors hover:text-white min-w-0 max-w-full"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              {socials.filter((s) => s.enabled).map(({ Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-white/80 transition-colors hover:text-white"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/25 hover:text-white"
          aria-label={t("close") || "Close banner"}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
