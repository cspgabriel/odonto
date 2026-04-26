"use client";

import React, { useEffect, useState } from "react";

type ThemeRippleEffectProps = {
  isVisible: boolean;
  clickX?: number;
  clickY?: number;
  onAnimationComplete: () => void;
};

export function ThemeRippleEffect({
  isVisible,
  clickX,
  clickY,
  onAnimationComplete,
}: ThemeRippleEffectProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const [rippleColor, setRippleColor] = useState<string>("");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const color = isDark
      ? "radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.08) 60%, transparent 100%)"
      : "radial-gradient(circle, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.08) 30%, rgba(0, 0, 0, 0.04) 60%, transparent 100%)";
    setRippleColor(color);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !rippleColor) return;
    const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
    const screenHeight = typeof window !== "undefined" ? window.innerHeight : 768;
    const x = clickX ?? screenWidth / 2;
    const y = clickY ?? screenHeight / 2;
    const maxDistanceX = Math.max(x, screenWidth - x);
    const maxDistanceY = Math.max(y, screenHeight - y);
    const maxSize = Math.hypot(maxDistanceX, maxDistanceY) * 2.2;
    setRipples([{ id: Date.now(), x, y, size: maxSize }]);
    const timer = setTimeout(() => {
      setRipples([]);
      onAnimationComplete();
    }, 1200);
    return () => clearTimeout(timer);
  }, [isVisible, onAnimationComplete, rippleColor, clickX, clickY]);

  if (!isVisible || !rippleColor) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute rounded-full"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            background: rippleColor,
            transform: "scale(0)",
            animation: "theme-ripple 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
      ))}
    </div>
  );
}
