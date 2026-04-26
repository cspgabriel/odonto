"use client";

import { useMemo } from "react";
import type { LandingSettings } from "@/lib/validations/landing-settings";
import { getTypographyCss } from "@/lib/landing-typography";

function hexToHSL(hex: string): string {
  if (!hex || typeof hex !== "string") return "";
  
  // Remove hash
  hex = hex.replace(/^#/, "");

  // Handle shorthand (e.g. F00)
  if (hex.length === 3) {
    hex = hex.split("").map(char => char + char).join("");
  }

  // Parse r, g, b
  const bigint = parseInt(hex, 16);
  if (isNaN(bigint)) return "";
  
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }

  // Round values
  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return `${hDeg} ${sPct}% ${lPct}%`;
}

export function LandingThemeProvider({
  colors,
  typography,
}: {
  colors: NonNullable<LandingSettings["colors"]>;
  typography?: { headingFont?: string | null; bodyFont?: string | null };
}) {
  const styleString = useMemo(() => {
    let css = "";

    if (colors) {
      const primaryHSL = colors.primary ? hexToHSL(colors.primary) : null;
      const secondaryHSL = colors.secondary ? hexToHSL(colors.secondary) : null;
      const accentHSL = colors.accent ? hexToHSL(colors.accent) : null;
      const foregroundHSL = colors.textPrimary ? hexToHSL(colors.textPrimary) : null;
      const mutedForegroundHSL = colors.textSecondary ? hexToHSL(colors.textSecondary) : null;
      const errorHSL = colors.error ? hexToHSL(colors.error) : null;
      const successHSL = colors.success ? hexToHSL(colors.success) : null;

      css = `.dental-landing {`;
      if (primaryHSL) css += `--primary: ${primaryHSL}; --ring: ${primaryHSL};`;
      if (secondaryHSL) css += `--secondary: ${secondaryHSL};`;
      if (accentHSL) css += `--accent: ${accentHSL};`;
      if (foregroundHSL) css += `--foreground: ${foregroundHSL};`;
      if (mutedForegroundHSL) css += `--muted-foreground: ${mutedForegroundHSL};`;
      if (errorHSL) css += `--destructive: ${errorHSL};`;
      if (successHSL) css += `--success: ${successHSL};`;
      css += `}`;
    }

    const typographyCss = getTypographyCss(".dental-landing", typography);
    if (typographyCss) css += typographyCss;

    return css;
  }, [colors, typography]);

  return <style dangerouslySetInnerHTML={{ __html: styleString }} />;
}
