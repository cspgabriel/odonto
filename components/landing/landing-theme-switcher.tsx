"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setThemeModeCookie } from "@/lib/actions/settings-actions";
import { cn } from "@/lib/utils";
import { DENTAL_RADIUS_BUTTON } from "@/lib/dental-branding";

export function LandingThemeSwitcher({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size="icon"
        className={cn("h-9 w-9", DENTAL_RADIUS_BUTTON, className)}
        aria-label="Theme"
        disabled
      >
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleClick = async () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    await setThemeModeCookie("landing", newTheme);
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleClick}
      className={cn("h-9 w-9", DENTAL_RADIUS_BUTTON, className)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
