"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Facebook, Instagram, Linkedin, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GENERAL_MAX_WIDTH } from "./config";
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

type GeneralFooterProps = {
  branding?: BrandingSettings;
  footer?: FooterSettings;
  contact?: ContactSettings;
  social?: SocialSettings;
};

export function GeneralFooter({ branding, footer, contact, social }: GeneralFooterProps) {
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
  const lightLogo = footer?.logoUrl || branding?.primaryLogoUrl || "/landing/general/logo.svg";
  const darkLogo  = branding?.darkLogoUrl || footer?.logoUrl || "/landing/general/logo-dark.svg";
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

  const footerContentBg = footerBg ?? (undefined as string | undefined);
  const footerContentClass = !footerBg ? "bg-white dark:bg-[#0B0B1E]" : "";

  return (
    <div className="bg-white dark:bg-slate-950 px-4 flex flex-col">
      {/* End divider: wave flush to bottom of content, no gap */}
      <div className="w-full overflow-hidden leading-none shrink-0" aria-hidden>
        <svg
          className="block w-full h-[80px] sm:h-[100px]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C58.23,113.11,145.92,126.33,230.11,105.74,271.18,95.73,298.63,60.65,321.39,56.44Z"
            {...(footerContentBg ? { fill: footerContentBg } : { className: "fill-white dark:fill-[#0B0B1E]" })}
          />
        </svg>
      </div>
      <footer
        className={cn("mx-auto relative z-10 w-full flex-1", GENERAL_MAX_WIDTH)}
      >
        <div
          className={cn(
            "rounded-t-3xl pt-12 pb-8 px-6 lg:px-10 relative overflow-hidden border-t border-l border-r border-slate-200/60 dark:border-slate-800/60 h-full",
            footerContentClass
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

              {/* Social icons – left-aligned */}
              <div className="flex flex-wrap items-center justify-start gap-2">
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
                      <div className="w-8 h-8 rounded-xl bg-primary/5 dark:bg-slate-900 border border-primary/10 dark:border-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
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
                      <div className="w-8 h-8 rounded-xl bg-primary/5 dark:bg-slate-900 border border-primary/10 dark:border-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0 self-start">
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
