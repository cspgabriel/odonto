"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { LandingButton } from "@/components/ui/landing-button";
import { cn } from "@/lib/utils";
import { GENERAL_MAX_WIDTH, GENERAL_RADIUS_BUTTON, GENERAL_RADIUS_CARD, GENERAL_RADIUS_SMALL, GENERAL_BUTTON_PRIMARY } from "./config";
import { LandingThemeSwitcher } from "../landing-theme-switcher";
import { LandingLanguageSwitcher } from "../landing-language-switcher";
import { Menu, X } from "lucide-react";
import type { LandingSettings } from "@/lib/validations/landing-settings";

const NAV_LINKS = [
  { href: "#services", key: "services", active: false },
  { href: "#doctors", key: "doctors", active: false },
  { href: "#about", key: "about", active: false },
  { href: "#specialists", key: "team", active: false },
  { href: "#testimonials", key: "reviews", active: false },
  { href: "#blog", key: "blog", active: false },
  { href: "#faq", key: "faq", active: false },
  { href: "#contact", key: "contact", active: false },
] as const;

export function GeneralNavbar({ showDoctors = false, branding, features }: { showDoctors?: boolean; branding?: LandingSettings["branding"]; features?: any }) {
  const t = useTranslations("landing.nav");
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/" || pathname === "/en" || pathname === "/fr" || pathname === "/ar" || pathname === "/es";
  const [scrolled, setScrolled] = useState(false);
  const [activeKey, setActiveKey] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topBarDismissed, setTopBarDismissed] = useState(false);
  
  const isSticky = features?.enableStickyNavbar ?? true;
  const showDarkToggle = features?.enableDarkModeToggle ?? true;
  const showLangSwitcher = features?.enableLanguageSwitcher ?? true;
  const supportedLangs = features?.supportedLanguages ?? ["en", "fr", "es", "ar"];
  const isScrolled = isSticky && scrolled;
  
  const links = useMemo(() => {
    if (showDoctors) {
      // When doctors enabled: show doctors link, remove about link
      return NAV_LINKS.filter(link => link.key !== "about");
    } else {
      // When doctors disabled: show about link, remove doctors link
      return NAV_LINKS.filter(link => link.key !== "doctors");
    }
  }, [showDoctors]);

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

  useEffect(() => {
    const onDismissed = () => setTopBarDismissed(true);
    window.addEventListener("general-topbar-dismissed", onDismissed);
    return () => window.removeEventListener("general-topbar-dismissed", onDismissed);
  }, []);

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

  return (
    <div
      className={cn(
        isSticky ? "fixed" : "absolute",
        "left-0 right-0 z-[60] px-4 transition-all duration-500 ease-in-out",
        isScrolled || topBarDismissed
          ? "top-4 pt-0"
          : (features?.enableTopBar === false ? "top-4 pt-0" : "top-8 pt-2")
      )}
    >
      <div className={cn("mx-auto", GENERAL_MAX_WIDTH)}>
        <header
          className={cn(
            "flex h-20 items-center justify-between gap-4 px-6 transition-all duration-500 ease-in-out sm:px-4",
            GENERAL_RADIUS_CARD,
            "border",
            isScrolled
              ? "border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-950"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none"
          )}
        >
          <Link
            href="/?preview=1"
            onClick={handleLogoClick}
            className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white"
          >
            {branding?.primaryLogoUrl ? (
              <>
                {/* Primary / Light Mode Logo */}
                <div className="relative h-8 w-auto sm:h-9 block dark:hidden">
                  <Image
                    src={branding.primaryLogoUrl}
                    alt={branding?.brandName || "Clinic Logo"}
                    width={150}
                    height={40}
                    className="h-full w-auto object-contain"
                    priority
                  />
                </div>

                {/* Dark Mode Logo */}
                <div className="relative h-8 w-auto sm:h-9 hidden dark:block">
                  <Image
                    src={branding?.darkLogoUrl || branding.primaryLogoUrl}
                    alt={branding?.brandName || "Clinic Logo"}
                    width={150}
                    height={40}
                    className="h-full w-auto object-contain"
                    priority
                  />
                </div>
              </>
            ) : (
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 dark:from-primary dark:to-primary/60">
                {branding?.brandName || "Clinic"}
              </span>
            )}
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex lg:gap-2">
            {links.map(({ href, key }) => {
              const isActive = activeKey === key;
              return (
                <Link
                  key={href}
                  href={isHome ? href : `/?preview=1${href}`}
                  onClick={(e) => handleHomeClick(e, href)}
                  className={cn(
                    GENERAL_RADIUS_BUTTON,
                    "px-3 py-2 text-sm font-medium transition-all duration-500 ease-in-out hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary",
                    isActive
                      ? "text-primary bg-primary/10 dark:bg-primary/20 dark:text-primary"
                      : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>
          
          {/* Desktop Actions */}
          <div className="hidden lg:flex shrink-0 items-center gap-2 sm:gap-3">
            {showDarkToggle && (
              <LandingThemeSwitcher variant="ghost" className="bg-slate-100/80 text-slate-600 hover:text-primary hover:bg-primary/10 dark:bg-slate-800/80 dark:text-white/80 dark:hover:text-primary dark:hover:bg-primary/20" />
            )}
            {showLangSwitcher && (
              <LandingLanguageSwitcher supportedLanguages={supportedLangs} variant="ghost" className="bg-slate-100/80 text-slate-600 hover:text-primary hover:bg-primary/10 dark:bg-slate-800/80 dark:text-white/80 dark:hover:text-primary dark:hover:bg-primary/20" />
            )}
            <LandingButton size="default" variant="primary" className={cn("text-white", GENERAL_RADIUS_BUTTON, GENERAL_BUTTON_PRIMARY)} asChild>
              <Link href="/appointment">{t("appointment")}</Link>
            </LandingButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn("lg:hidden flex items-center justify-center w-10 h-10", GENERAL_RADIUS_SMALL, "bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-white/80 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors")}
            aria-label={t("toggleMenu")}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Menu */}
        <div
          className={cn(
            "lg:hidden fixed top-24 left-4 right-4 z-40 transition-all duration-300 ease-in-out",
            GENERAL_RADIUS_CARD,
            "border backdrop-blur-md",
            mobileMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-4 pointer-events-none",
            isScrolled
              ? "bg-white/95 dark:bg-slate-950/95 border-slate-200/50 dark:border-slate-800/50 shadow-lg"
              : "bg-white/98 dark:bg-slate-950/98 border-slate-200/40 dark:border-slate-800/40 shadow-xl"
          )}
        >
          <nav className="flex flex-col p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
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
                      : cn("text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/50", GENERAL_RADIUS_SMALL)
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
            
            {(showDarkToggle || showLangSwitcher) && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 px-2">
                {showDarkToggle && (
                  <LandingThemeSwitcher variant="outline" className={cn("flex-1 justify-center", GENERAL_RADIUS_SMALL, "bg-slate-50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50")} />
                )}
                {showLangSwitcher && (
                  <LandingLanguageSwitcher supportedLanguages={supportedLangs} variant="outline" className={cn("flex-1 justify-center", GENERAL_RADIUS_SMALL, "bg-slate-50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50")} />
                )}
              </div>
            )}

            <LandingButton 
              size="default" 
              variant="primary" 
              className={cn("mt-4 w-full justify-center text-sm py-3 text-white", GENERAL_RADIUS_BUTTON, GENERAL_BUTTON_PRIMARY)} 
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/appointment">{t("appointment")}</Link>
            </LandingButton>
          </nav>
        </div>
      </div>
    </div>
  );
}
