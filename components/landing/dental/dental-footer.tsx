"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Facebook, Instagram, Linkedin, Phone, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { DENTAL_MAX_WIDTH } from "./config";
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

type DentalFooterProps = {
  branding?: BrandingSettings;
  footer?: FooterSettings;
  contact?: ContactSettings;
  social?: SocialSettings;
};

export function DentalFooter({ branding, footer, contact, social }: DentalFooterProps) {
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

  // ── Logos ───────────────────────────────────────────────────────────────────
  // footer.logoUrl is a dedicated footer logo; falls back to branding logos
  const lightLogo = footer?.logoUrl || branding?.primaryLogoUrl || "/landing/dental/logo.svg";
  const darkLogo  = branding?.darkLogoUrl || footer?.logoUrl || "/landing/dental/logo-dark.svg";
  const brandName = branding?.brandName || "CareNova";

  // ── Description ─────────────────────────────────────────────────────────────
  const description = useTranslatedFooter ? t("description") : (footer?.companyDescription ?? t("description"));

  // ── Contact ─────────────────────────────────────────────────────────────────
  const phone   = contact?.phone   || "+1 (555) 001-234";
  const address = contact?.address || t("address");
  const mapsUrl =
    contact?.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  // ── Social links ─────────────────────────────────────────────────────────────
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

  // ── Navigation columns ───────────────────────────────────────────────────────
  const settingsQuickLinks = footer?.quickLinks
    ?.filter((l) => l.label && l.url)
    .map((l) => ({
      label: l.label!,
      href: l.url!,
      // Anchors never open in new tab; otherwise respect the saved flag (default true)
      external: l.url!.startsWith("#") ? false : (l.openInNewTab ?? true),
    }));

  const settingsServiceLinks = footer?.serviceLinks
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

  const privacyLink = footer?.privacyPolicyLink || "/policies/privacy-policy";
  const termsLink   = footer?.termsLink         || "/policies/terms-of-service";

  const FOOTER_COLUMNS = [
    {
      title: t("quickLinks"),
      links: (useTranslatedFooter || !settingsQuickLinks?.length) ? defaultQuickLinks : settingsQuickLinks,
    },
    {
      title: t("ourServices"),
      links: (useTranslatedFooter || !settingsServiceLinks?.length) ? defaultServiceLinks : settingsServiceLinks,
    },
    {
      title: t("support"),
      links: [
        { label: t("helpCenter"),     href: "#",          external: false },
        { label: t("privacyPolicy"),  href: privacyLink,  external: false },
        { label: t("termsOfService"), href: termsLink,    external: false },
        { label: t("refundPolicy"),   href: "/policies/refund-policy",   external: false },
        { label: t("cookieSettings"), href: "/policies/cookie-settings", external: false },
      ],
    },
  ];

  // ── Copyright ───────────────────────────────────────────────────────────────
  const copyrightLine = useTranslatedFooter
    ? t("allRightsReserved", { year: currentYear })
    : (footer?.copyrightText ?? t("allRightsReserved", { year: currentYear }));

  // ── Background colour override ───────────────────────────────────────────────
  const footerBg = footer?.backgroundColor;

  // ── Smooth scroll helpers ────────────────────────────────────────────────────
  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    external: boolean
  ) => {
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

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 pt-8 px-4 flex flex-col">
      <footer
        className={cn("mx-auto relative z-10 w-full flex-1", DENTAL_MAX_WIDTH)}
      >
        <div
          className={cn(
            "rounded-t-[40px] pt-12 pb-8 px-6 lg:px-10 relative overflow-hidden border-t border-l border-r border-slate-200/60 dark:border-slate-800/60 h-full",
            !footerBg && "bg-white dark:bg-[#0B0B1E]"
          )}
          style={footerBg ? { backgroundColor: footerBg } : undefined}
        >

          {/* Subtle glow */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.03] dark:bg-primary/5 blur-[120px] rounded-full -z-10 -translate-y-1/2" />

          {/* ── Grid ──────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-8 mb-10">

            {/* Brand column */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col gap-4 md:gap-6">
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

              <p className="max-w-sm text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                {description}
              </p>

              {/* Google Rating Widget */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-3 py-2 flex items-center gap-3 max-w-fit shadow-sm">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-50 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-slate-900 dark:text-white text-[10px] font-black leading-none">
                      {t("googleRating")}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {t("ratingsText")}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation columns */}
            {FOOTER_COLUMNS.map((section) => (
              <div key={section.title} className="col-span-1 md:col-span-1 lg:col-span-2">
                <h4 className="text-[12px] font-bold mb-3 md:mb-4 text-[#2D2D5F] dark:text-white uppercase tracking-[0.2em]">
                  {section.title}
                </h4>
                <ul className="space-y-0">
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
                        className="text-slate-500 dark:text-slate-400/80 font-semibold text-[13px] hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/20 px-3 py-1 rounded-lg transition-all flex items-center -ml-3"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Connect column */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-between mt-6 md:mt-0">
              <div>
                <h4 className="text-[12px] font-bold mb-6 text-[#2D2D5F] dark:text-white uppercase tracking-[0.2em]">
                  {t("connect")}
                </h4>
                <ul className="space-y-5">
                  <li>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/5 dark:bg-slate-900 border border-primary/10 dark:border-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-0.5">
                          {t("emergency")}
                        </p>
                        <p className="text-[11px] font-bold text-[#2D2D5F] dark:text-white/90 group-hover:text-primary transition-colors">
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
                      <div className="w-8 h-8 rounded-lg bg-primary/5 dark:bg-slate-900 border border-primary/10 dark:border-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0 self-start">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-0.5">
                          {t("ourStudio")}
                        </p>
                        <p className="text-[11px] font-bold text-[#2D2D5F] dark:text-white/90 group-hover:text-primary transition-colors">
                          {address}
                        </p>
                      </div>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Social icons */}
              <div className="flex items-center justify-center md:justify-start gap-2 mt-6 md:mt-8 lg:mt-6">
                {SOCIALS.map((s, i) => (
                  <Link
                    key={i}
                    href={s.href}
                    target={s.href !== "#" ? "_blank" : undefined}
                    rel={s.href !== "#" ? "noopener noreferrer" : undefined}
                    className={cn(
                      "w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800",
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
          </div>

          {/* Bottom bar */}
          <div className="pt-6 md:pt-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-center">
            <p className="text-slate-400 dark:text-slate-600 font-medium text-xs tracking-tight text-center px-4">
              {copyrightLine}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
