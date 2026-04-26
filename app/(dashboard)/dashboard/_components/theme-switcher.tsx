"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { updateThemeMode } from "@/lib/theme-utils";
import { setThemeModeCookie } from "@/lib/actions/settings-actions";
import { useThemeRipple } from "@/contexts/theme-ripple-context";

interface ThemeSwitcherProps {
  variant?: "sidebar" | "header";
}

export function ThemeSwitcher({ variant = "sidebar" }: ThemeSwitcherProps = {}) {
  const t = useTranslations("header");
  const { setTheme, resolvedTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = variant === "header" ? true : state === "collapsed";
  const [mounted, setMounted] = useState(false);
  const { triggerRipple } = useThemeRipple();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "cursor-pointer rounded-xl transition-colors duration-200 hover:bg-muted/50",
          isCollapsed ? "w-8 h-8 justify-center p-2" : "h-8 w-full justify-start"
        )}
        aria-label={t("themeSwitcher")}
        disabled
      >
        <Moon className="h-4 w-4" />
        {!isCollapsed && (
          <span className="ml-2 text-xs">{t("darkMode")}</span>
        )}
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = isDark ? "light" : "dark";
    const x = event.clientX;
    const y = event.clientY;

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      const style = document.createElement("style");
      style.textContent = `
        ::view-transition-old(root),
        ::view-transition-new(root) { animation: none; }
        ::view-transition-new(root) {
          animation: ripple-expand 500ms ease-in-out forwards;
          clip-path: circle(0px at ${x}px ${y}px);
        }
        @keyframes ripple-expand {
          to { clip-path: circle(${endRadius}px at ${x}px ${y}px); }
        }
      `;
      document.head.appendChild(style);
      const transition = (document as Document & { startViewTransition: (cb: () => void) => Promise<{ finished: Promise<void> }> }).startViewTransition(async () => {
        updateThemeMode(newTheme);
        setTheme(newTheme);
        await setThemeModeCookie("dashboard", newTheme);
      });
      transition.finished
        .then(() => document.head.removeChild(style))
        .catch(() => {
          if (document.head.contains(style)) document.head.removeChild(style);
        });
    } else {
      triggerRipple(x, y);
      setTimeout(async () => {
        updateThemeMode(newTheme);
        setTheme(newTheme);
        await setThemeModeCookie("dashboard", newTheme);
      }, 100);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn(
        "cursor-pointer rounded-xl transition-colors duration-200 hover:bg-muted/50",
        isCollapsed ? "w-8 h-8 justify-center p-2" : "h-8 w-full justify-start"
      )}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!isCollapsed && (
        <span
          className={cn(
            "overflow-hidden text-xs transition-all duration-300 ease-in-out",
            isCollapsed ? "ml-0 w-0 opacity-0" : "ml-2 w-auto opacity-100"
          )}
        >
          {isDark ? t("lightMode") : t("darkMode")}
        </span>
      )}
    </Button>
  );
}
