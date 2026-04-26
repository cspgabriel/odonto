"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Facebook, Instagram, Linkedin, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_MAX_WIDTH } from "./config";
import type {
  BrandingSettings,
  FooterSettings,
  ContactSettings,
  SocialSettings,
} from "@/lib/validations/landing-settings";

// Custom X (formerly Twitter) icon
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);

type OphthalmologyFooterProps = {
  branding?: BrandingSettings;
  footer?: FooterSettings;
  contact?: ContactSettings;
  social?: SocialSettings;
};

type AnchorClickHandler = (e: React.MouseEvent<HTMLAnchorElement>) => void;

const FooterTag = "footer";

export function OphthalmologyFooter({ branding, footer: footerSettings, contact, social }: OphthalmologyFooterProps) {
  const t = useTranslations("landing.footer");
  const locale = useLocale();
  const useTranslatedFooter = locale !== "en";
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const isHome =
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/fr" ||
    pathname === "/ar" ||
    pathname === "/es";

  // Logos
  const lightLogo = footerSettings?.logoUrl ?? branding?.primaryLogoUrl ?? "/landing/ophthalmology/logo.svg";
  const darkLogo  = branding?.darkLogoUrl ?? footerSettings?.logoUrl ?? "/landing/ophthalmology/logo-dark.svg";
  const brandName = branding?.brandName || "CareNova";

  // Description
  const description = useTranslatedFooter ? t("description") : (footerSettings?.companyDescription ?? t("description"));

  // Contact
  const phone   = contact?.phone   || "+1 (555) 001-234";
  const address = contact?.address || t("address");
  const mapsUrl =
    contact?.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  // Social links
  const SOCIALS = [
    {
      icon: Facebook,
      href: social?.facebook || "#",
      enabled: social?.enabled?.facebook ?? true,
      color:
        "hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white dark:hover:bg-[#1877F2] dark:hover:border-[#1877F2] dark:hover:text-white",
    },
    {
      icon: Instagram,
      href: social?.instagram || "#",
      enabled: social?.enabled?.instagram ?? true,
      color:
        "hover:bg-[#E4405F] hover:border-[#E4405F] hover:text-white dark:hover:bg-[#E4405F] dark:hover:border-[#E4405F] dark:hover:text-white",
    },
    {
      icon: XIcon,
      href: social?.twitter || "#",
      enabled: social?.enabled?.twitter ?? true,
      color:
        "hover:bg-black hover:border-black hover:text-white dark:hover:bg-white dark:hover:border-white dark:hover:text-black",
    },
    {
      icon: Linkedin,
      href: social?.linkedin || "#",
      enabled: social?.enabled?.linkedin ?? true,
      color:
        "hover:bg-[#0A66C2] hover:border-[#0A66C2] hover:text-white dark:hover:bg-[#0A66C2] dark:hover:border-[#0A66C2] dark:hover:text-white",
    },
  ].filter((s) => s.enabled);

  // Navigation columns
  const settingsQuickLinks = footerSettings?.quickLinks
    ?.filter((l) => l.label && l.url)
    .map((l) => ({
      label: l.label!,
      href: l.url!,
      // Anchors never open in new tab; otherwise respect the saved flag (default true)
      external: l.url!.startsWith("#") ? false : (l.openInNewTab ?? true),
    }));

  const settingsServiceLinks = footerSettings?.serviceLinks
    ?.filter((l) => l.label && l.url)
    .map((l) => ({
      label: l.label!,
      href: l.url!,
      external: l.url!.startsWith("#") ? false : (l.openInNewTab ?? true),
    }));

  const defaultQuickLinks = [
    { label: t("home"),       href: "#hero",     external: false },
    { label: t("aboutUs"),    href: "#about",    external: false },
    { label: t("services"),   href: "#services", external: false },
    { label: t("ourDoctors"), href: "#doctors",  external: false },
    { label: t("caseStudies"), href: "#",        external: false },
  ];

  const defaultServiceLinks = [
    { label: t("teethWhitening"), href: "#", external: false },
    { label: t("dentalImplants"), href: "#", external: false },
    { label: t("rootCanal"),      href: "#", external: false },
    { label: t("bracesAligners"), href: "#", external: false },
    { label: t("emergencyCare"),  href: "#", external: false },
  ];

  const privacyLink = footerSettings?.privacyPolicyLink || "/policies/privacy-policy";
  const termsLink   = footerSettings?.termsLink         || "/policies/terms-of-service";

  const FOOTER_COLUMNS = [
    {
      title: t("quickLinks"),
      links: (useTranslatedFooter || !settingsQuickLinks?.length) ? defaultQuickLinks : settingsQuickLinks,
    },
    {
      title: t("ourServices"),
      links: (useTranslatedFooter || !settingsServiceLinks?.length) ? defaultServiceLinks : settingsServiceLinks,
    },
  ];

  const BOTTOM_POLICY_LINKS = [
    { label: t("privacyPolicy"), href: privacyLink, external: false },
    { label: t("termsOfService"), href: termsLink, external: false },
    { label: t("refundPolicy"), href: "/policies/refund-policy", external: false },
    { label: t("cookieSettings"), href: "/policies/cookie-settings", external: false },
  ];

  // Copyright
  const copyrightLine = useTranslatedFooter
    ? t("allRightsReserved", { year: currentYear })
    : (footerSettings?.copyrightText ?? t("allRightsReserved", { year: currentYear }));

  // Background colour override
  const footerBg = footerSettings?.backgroundColor;

  // Smooth scroll helpers
  const handleLinkClick = (
    e: Parameters<AnchorClickHandler>[0],
    href: string,
    external: boolean
  ): void => {
    if (!external && isHome && href.startsWith("#")) {
      e.preventDefault();
      const id = href.replace("#", "");
      if (id === "hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const el = document.getElementById(id);
        if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
      }
    }
  };

  const handleLogoClick: AnchorClickHandler = (e) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const footerClassName = "relative z-10 w-full flex flex-col bg-slate-50/80 dark:bg-slate-950";
  const innerClassName = cn(
    "w-full pt-10 pb-8 px-4 lg:px-8 relative overflow-hidden h-full",
    !footerBg && "bg-slate-50/80 dark:bg-slate-950/95"
  );

  function renderFooter() {
    return (
      <FooterTag className={footerClassName}>
      <div className="relative z-10 w-full flex-1">
        <div
          className={innerClassName}
          style={footerBg ? { backgroundColor: footerBg } : undefined}
        >
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.03] dark:bg-primary/5 blur-[120px] rounded-full -z-10 -translate-y-1/2" />
          <div className={cn("mx-auto w-full grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8", OPHTHALMOLOGY_MAX_WIDTH)}>
            {/* Brand column: logo + description + socials (left-aligned) */}
            <div className="lg:col-span-4 flex flex-col items-start gap-4">
              <Link href="/?preview=1" onClick={handleLogoClick} className="flex items-center gap-3">
                <Image
                  src={lightLogo}
                  alt={brandName}
                  width={150}
                  height={44}
                  className="h-10 w-auto block dark:hidden"
                />
                <Image
                  src={darkLogo}
                  alt={brandName}
                  width={150}
                  height={44}
                  className="h-10 w-auto hidden dark:block"
                />
              </Link>
              <p className="max-w-sm text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed text-start">
                {description}
              </p>
              <div className="flex items-center gap-2">
                {SOCIALS.map((s, i) => (
                  <Link
                    key={i}
                    href={s.href}
                    target={s.href !== "#" ? "_blank" : undefined}
                    rel={s.href !== "#" ? "noopener noreferrer" : undefined}
                    className={cn(
                      "w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
                      "flex items-center justify-center text-slate-400 dark:text-slate-500",
                      "transition-all duration-300 shadow-sm",
                      s.color
                    )}
                  >
                    <s.icon className="w-4 h-4" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Link sections */}
            <div className="lg:col-span-8 grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-20">
                {FOOTER_COLUMNS.map((section) => (
                  <div key={section.title}>
                    <h4 className="text-[11px] font-bold mb-4 text-[#2D2D5F] dark:text-white uppercase tracking-[0.2em]">
                      {section.title}
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={
                              !link.external && link.href.startsWith("#")
                                ? isHome
                                  ? link.href
                                  : `/?preview=1${link.href}`
                                : link.href
                            }
                            target={link.external ? "_blank" : undefined}
                            rel={link.external ? "noopener noreferrer" : undefined}
                            onClick={(e) =>
                              handleLinkClick(e, link.href, link.external)
                            }
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {/* Connect column */}
                <div>
                  <h4 className="text-[11px] font-bold mb-4 text-[#2D2D5F] dark:text-white uppercase tracking-[0.2em]">
                    {t("connect")}
                  </h4>
                  <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                    <li>
                      <a
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className="flex items-start gap-3 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/5 dark:bg-slate-900 border border-primary/10 dark:border-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0 mt-0.5">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-0.5">
                            {t("emergency")}
                          </p>
                          <p className="font-medium text-[#2D2D5F] dark:text-white/90 group-hover:text-primary transition-colors">
                            {phone}
                          </p>
                        </div>
                      </a>
                    </li>
                    <li>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/5 dark:bg-slate-900 border border-primary/10 dark:border-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-0.5">
                            {t("ourStudio")}
                          </p>
                          <p className="font-medium text-[#2D2D5F] dark:text-white/90 group-hover:text-primary transition-colors">
                            {address}
                          </p>
                        </div>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          {/* Bottom bar: copyright left, policies right */}
          <div className={cn("pt-10 md:pt-12 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 mx-auto px-4", OPHTHALMOLOGY_MAX_WIDTH)}>
            <p className="text-slate-400 dark:text-slate-600 font-medium text-xs tracking-tight order-2 sm:order-1">
              {copyrightLine}
            </p>
            <nav className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1 order-1 sm:order-2" aria-label="Footer policies">
              {BOTTOM_POLICY_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-slate-500 dark:text-slate-400 font-medium text-xs hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </FooterTag>
    );
  }
  return renderFooter();
}
