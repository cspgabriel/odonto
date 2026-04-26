"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type ThemeRippleContextType = {
  isVisible: boolean;
  clickX: number | undefined;
  clickY: number | undefined;
  triggerRipple: (x: number, y: number) => void;
  hideRipple: () => void;
};

const ThemeRippleContext = createContext<ThemeRippleContextType | null>(null);

export function ThemeRippleProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [clickX, setClickX] = useState<number | undefined>(undefined);
  const [clickY, setClickY] = useState<number | undefined>(undefined);

  const triggerRipple = useCallback((x: number, y: number) => {
    setClickX(x);
    setClickY(y);
    setIsVisible(true);
  }, []);

  const hideRipple = useCallback(() => {
    setIsVisible(false);
    setClickX(undefined);
    setClickY(undefined);
  }, []);

  return (
    <ThemeRippleContext.Provider
      value={{ isVisible, clickX, clickY, triggerRipple, hideRipple }}
    >
      {children}
    </ThemeRippleContext.Provider>
  );
}

export function useThemeRipple(): ThemeRippleContextType {
  const ctx = useContext(ThemeRippleContext);
  if (!ctx) throw new Error("useThemeRipple must be used within ThemeRippleProvider");
  return ctx;
}
