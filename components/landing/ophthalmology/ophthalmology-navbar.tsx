"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { LandingButton } from "@/components/ui/landing-button";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_RADIUS_BUTTON } from "./config";
import { LandingThemeSwitcher } from "../landing-theme-switcher";
import { LandingLanguageSwitcher } from "../landing-language-switcher";
import { Menu, X } from "lucide-react";
import type { LandingSettings } from "@/lib/validations/landing-settings";

const NAV_LINKS = [

  { href: "#services", key: "services", active: false },
  { href: "#doctors", key: "doctors", active: false },
  { href: "#about", key: "about", active: false },
  { href: "#pricing", key: "pricing", active: false },
  { href: "#blog", key: "blog", active: false },
  { href: "#testimonials", key: "reviews", active: false },
  { href: "#contact", key: "contact", active: false },
] as const;

export function OphthalmologyNavbar({ showDoctors = false, branding, features }: { showDoctors?: boolean; branding?: LandingSettings["branding"]; features?: any }) {
  const t = useTranslations("landing.nav");
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/" || pathname === "/en" || pathname === "/fr" || pathname === "/ar" || pathname === "/es";
  const [scrolled, setScrolled] = useState(false);
  const [activeKey, setActiveKey] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isSticky = features?.enableStickyNavbar ?? true;
  const showDarkToggle = features?.enableDarkModeToggle ?? true;
  const showLangSwitcher = features?.enableLanguageSwitcher ?? true;
  const supportedLangs = features?.supportedLanguages ?? ["en", "fr", "es", "ar"];
  const isScrolled = isSticky && scrolled;
  /** On non-home pages there is no hero image, so use dark nav content and solid background for readability */
  const useDarkNavContent = isScrolled || !isHome;
  
  const links = useMemo(() => {
    if (showDoctors) {
      return NAV_LINKS.filter(link => link.key !== "about");
    } else {
      return NAV_LINKS.filter(link => link.key !== "doctors");
    }
  }, [showDoctors]);

  const half = Math.ceil(links.length / 2);
  const leftLinks = links.slice(0, half);
  const rightLinks = links.slice(half);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);

      // Scrollspy logic
      let current = "";
      const sections = links.map((link) => link.href.substring(1));

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && window.scrollY >= element.offsetTop - 150) {
          current = section;
        }
      }
      
      const activeLink = links.find((link) => link.href === `#${current}`);
      if (activeLink) {
        setActiveKey(activeLink.key);
      } else if (window.scrollY < 100) {
          setActiveKey("home");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [links]);

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isHome && href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.replace("#", "");
      if (targetId === "hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const element = document.getElementById(targetId);
        if (element) {
          const offset = element.offsetTop - 100;
          window.scrollTo({ top: offset, behavior: "smooth" });
        }
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const hasTopBar = features?.enableTopBar !== false;
  const navHeight = isScrolled ? "h-[77px]" : "h-[69px]";
  const mobileMenuTop = isScrolled
    ? (hasTopBar ? "top-[117px]" : "top-[77px]")
    : hasTopBar ? "top-[6.8125rem]" : "top-[69px]";

  return (
    <div
      className={cn(
        isSticky ? "fixed" : "absolute",
        "left-0 right-0 z-50 w-full transition-all duration-500 ease-in-out",
        hasTopBar ? "top-10 pt-0" : "top-0 pt-0"
      )}
    >
      <header
        className={cn(
          "w-full transition-all duration-500 ease-in-out",
          navHeight,
          isScrolled
            ? "border-t-0 border-b border-slate-200/60 shadow-sm dark:border-slate-800/60 bg-white dark:bg-slate-950"
            : "border-0 border-transparent bg-transparent shadow-none"
        )}
      >
        <div className={cn("mx-auto grid h-full w-full grid-cols-[1fr_auto_1fr] items-center gap-x-8 px-4 sm:px-6", OPHTHALMOLOGY_MAX_WIDTH)}>
          {/* Left: Dark + Language, then nav links (Services, About, Pricing) with spacing */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              {showDarkToggle && (
                <LandingThemeSwitcher
                  variant="ghost"
                  className={cn(
                    "rounded-full h-9 w-9 transition-colors",
                    useDarkNavContent
                      ? "bg-slate-100/80 text-slate-600 hover:text-primary hover:bg-primary/10 dark:bg-slate-800/80 dark:text-white/80 dark:hover:text-primary dark:hover:bg-primary/20"
                      : "bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  )}
                />
              )}
              {showLangSwitcher && (
                <LandingLanguageSwitcher
                  supportedLanguages={supportedLangs}
                  variant="ghost"
                  className={cn(
                    "rounded-full h-9 px-3 transition-colors [&_button]:rounded-full",
                    useDarkNavContent
                      ? "bg-slate-100/80 text-slate-600 hover:text-primary hover:bg-primary/10 dark:bg-slate-800/80 dark:text-white/80 dark:hover:text-primary dark:hover:bg-primary/20"
                      : "bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  )}
                />
              )}
            </div>
            <nav className="flex items-center gap-3 justify-end">
              {leftLinks.map(({ href, key }) => {
                const isActive = activeKey === key;
                return (
                  <Link
                    key={href}
                    href={isHome ? href : `/?preview=1${href}`}
                    onClick={(e) => handleHomeClick(e, href)}
                    className={cn(
                      OPHTHALMOLOGY_RADIUS_BUTTON,
                      "px-3 py-2 text-sm font-medium transition-all duration-500 ease-in-out hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary",
                      isActive
                        ? "text-primary bg-primary/10 dark:bg-primary/20 dark:text-primary"
                        : useDarkNavContent
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-white"
                    )}
                  >
                    {t(key)}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: Logo – use light logo when over hero (dark bg) */}
          <Link
          href="/?preview=1"
          onClick={handleLogoClick}
          className={cn(
            "flex shrink-0 items-center justify-center gap-2 text-lg font-bold tracking-tight sm:text-xl px-4",
            useDarkNavContent ? "text-slate-900 dark:text-white" : "text-white"
          )}
        >
          {branding?.primaryLogoUrl ? (
            <>
              {/* Light bg (scrolled or non-home): primary logo in light theme */}
              <div className={cn("relative h-[2.1rem] w-auto sm:h-[2.36rem]", useDarkNavContent ? "block dark:hidden" : "hidden")}>
                <Image
                  src={branding.primaryLogoUrl}
                  alt={branding?.brandName || "Clinic Logo"}
                  width={158}
                  height={42}
                  className="h-full w-auto object-contain"
                  priority
                />
              </div>
              {/* Dark bg (over hero or dark theme): light logo */}
              <div className={cn("relative h-[2.1rem] w-auto sm:h-[2.36rem]", !useDarkNavContent ? "block" : "hidden dark:block")}>
                <Image
                  src={branding?.darkLogoUrl || branding.primaryLogoUrl}
                  alt={branding?.brandName || "Clinic Logo"}
                  width={158}
                  height={42}
                  className="h-full w-auto object-contain"
                  priority
                />
              </div>
            </>
          ) : (
            <span className={cn(
              "text-xl font-bold",
              useDarkNavContent
                ? "bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 dark:from-primary dark:to-primary/60"
                : "text-white"
            )}>
              {branding?.brandName || "Clinic"}
            </span>
          )}
        </Link>

        {/* Right: Nav links (Blog, Reviews, Contact) right next to logo, Appointment at far right */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center justify-between gap-4 w-full">
            <nav className="flex items-center gap-3 justify-start">
              {rightLinks.map(({ href, key }) => {
                const isActive = activeKey === key;
                return (
                  <Link
                    key={href}
                    href={isHome ? href : `/?preview=1${href}`}
                    onClick={(e) => handleHomeClick(e, href)}
                    className={cn(
                      OPHTHALMOLOGY_RADIUS_BUTTON,
                      "px-3 py-2 text-sm font-medium transition-all duration-500 ease-in-out hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary",
                      isActive
                        ? "text-primary bg-primary/10 dark:bg-primary/20 dark:text-primary"
                        : useDarkNavContent
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-white"
                    )}
                  >
                    {t(key)}
                  </Link>
                );
              })}
            </nav>
            <LandingButton size="default" variant="primary" className="rounded-full min-w-[8.5rem] h-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90" asChild>
              <Link href="/appointment">{t("bookAppointment")}</Link>
            </LandingButton>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "lg:hidden flex items-center justify-center w-10 h-10 rounded-full transition-colors shadow-sm border",
              useDarkNavContent
                ? "bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-white/80 hover:bg-primary/10 dark:hover:bg-primary/20 border-slate-200/50 dark:border-slate-700/50"
                : "bg-white/10 text-white hover:bg-white/20 border-white/30"
            )}
            aria-label={t("toggleMenu")}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden fixed left-4 right-4 z-40 transition-all duration-300 ease-in-out rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl",
          mobileMenuTop,
            mobileMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-4 pointer-events-none",
          "bg-white dark:bg-slate-950"
          )}
      >
        <nav className="flex flex-col p-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {links.map(({ href, key }) => {
              const isActive = activeKey === key;
              return (
                <Link
                  key={href}
                  href={isHome ? href : `/?preview=1${href}`}
                  onClick={(e) => {
                    handleHomeClick(e, href);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "px-4 py-3.5 text-base font-medium transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-full"
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
            
            {(showDarkToggle || showLangSwitcher) && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 px-2">
                {showDarkToggle && (
                  <LandingThemeSwitcher variant="outline" className="flex-1 justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50" />
                )}
                {showLangSwitcher && (
                  <LandingLanguageSwitcher supportedLanguages={supportedLangs} variant="outline" className="flex-1 justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50" />
                )}
              </div>
            )}

            <LandingButton 
              size="default" 
              variant="primary" 
              className="mt-4 w-full justify-center rounded-full text-base py-6 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90" 
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/appointment">{t("bookAppointment")}</Link>
            </LandingButton>
        </nav>
      </div>
    </div>
  );
}
