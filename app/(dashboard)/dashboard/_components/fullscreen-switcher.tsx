"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DocumentWithFullscreen extends Document {
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface ElementWithFullscreen extends Element {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

interface FullScreenSwitcherProps {
  variant?: "sidebar" | "header";
}

export function FullScreenSwitcher({ variant = "sidebar" }: FullScreenSwitcherProps = {}) {
  const t = useTranslations("header");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { state } = useSidebar();
  const isCollapsed = variant === "header" ? true : state === "collapsed";

  useEffect(() => {
    setMounted(true);
    
    // Check if fullscreen API is supported
    const checkFullscreenSupport = () => {
      const doc = document as DocumentWithFullscreen;
      const supported = !!(
        document.fullscreenEnabled ||
        doc.webkitFullscreenEnabled ||
        doc.mozFullScreenEnabled ||
        doc.msFullscreenEnabled
      );
      setIsSupported(supported);
    };

    checkFullscreenSupport();

    const handleChange = () => {
      const doc = document as DocumentWithFullscreen;
      const fullscreenElement =
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;

      setIsFullscreen(!!fullscreenElement);
    };

    // Add event listeners for all browser prefixes
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    document.addEventListener("mozfullscreenchange", handleChange);
    document.addEventListener("MSFullscreenChange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
      document.removeEventListener("mozfullscreenchange", handleChange);
      document.removeEventListener("MSFullscreenChange", handleChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    if (typeof window === "undefined" || !isSupported) {
      toast.error(t("fullscreenNotSupported"));
      return;
    }

    try {
      const doc = document as DocumentWithFullscreen;
      const fullscreenElement =
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;

      if (!fullscreenElement) {
        // Enter fullscreen
        const element = document.documentElement as ElementWithFullscreen;

        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      toast.error(t("fullscreenFailed"));
    }
  };

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
        aria-label={t("fullscreen")}
        disabled
      >
        <Maximize2 className="h-4 w-4" />
        {!isCollapsed && (
          <span className="ml-2 text-xs">{t("fullscreen")}</span>
        )}
      </Button>
    );
  }

  // Don't render if fullscreen is not supported
  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleFullscreen}
      className={cn(
        "cursor-pointer rounded-xl transition-colors duration-200 hover:bg-muted/50",
        isCollapsed ? "w-8 h-8 justify-center p-2" : "h-8 w-full justify-start"
      )}
      aria-label={isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
    >
      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      {!isCollapsed && (
        <span
          className={cn(
            "overflow-hidden text-xs transition-all duration-300 ease-in-out",
            isCollapsed ? "ml-0 w-0 opacity-0" : "ml-2 w-auto opacity-100"
          )}
        >
          {isFullscreen ? t("exitFullscreen") : t("fullscreen")}
        </span>
      )}
    </Button>
  );
}
