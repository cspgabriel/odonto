"use client";

import { ThemeRippleEffect } from "@/components/theme-ripple-effect";
import { useThemeRipple } from "@/contexts/theme-ripple-context";

export function ThemeRippleGlobal() {
  const { isVisible, clickX, clickY, hideRipple } = useThemeRipple();
  return (
    <ThemeRippleEffect
      isVisible={isVisible}
      clickX={clickX}
      clickY={clickY}
      onAnimationComplete={hideRipple}
    />
  );
}
