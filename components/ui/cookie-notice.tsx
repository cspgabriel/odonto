"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CookieNoticeProps {
  enabled?: boolean | null;
  message?: string | null;
  linkText?: string | null;
  linkUrl?: string | null;
}

export function CookieNotice({ 
  enabled = true, 
  message: messageProp,
  linkText: linkTextProp,
  linkUrl = "/policies/cookie-settings"
}: CookieNoticeProps) {
  const t = useTranslations("landing.cookieNotice");
  const message = messageProp ?? t("message");
  const linkText = linkTextProp ?? t("linkText");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if enabled and user hasn't accepted yet
    if (enabled !== false) {
      const hasAccepted = localStorage.getItem("cookie_accepted");
      if (!hasAccepted) {
        // Small delay to prevent layout shift and look more natural
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [enabled]);

  if (!visible) return null;

  const handleAccept = () => {
    localStorage.setItem("cookie_accepted", "true");
    document.cookie = "cookie_accepted=true; path=/; max-age=31536000"; // 1 Year
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_accepted", "false"); 
    document.cookie = "cookie_accepted=false; path=/; max-age=31536000"; // 1 Year
    setVisible(false);
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] px-4 pointer-events-none transition-all duration-500">
      <div className="mx-auto max-w-7xl flex justify-start">
        <Card className="pointer-events-auto w-full max-w-[340px] sm:max-w-[360px] lg:w-1/4 lg:max-w-[380px] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md text-foreground overflow-hidden shadow-none">
          <CardContent className="">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl shrink-0">🍪</span>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">{t("title")}</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {message}{" "}
                <Link
                  href={linkUrl || "#"}
                  className="underline text-primary hover:text-primary/90 transition-colors font-semibold inline-block mt-0.5"
                >
                  {linkText}
                </Link>
              </p>
              
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href="/cookie-settings"
                  className="text-[10px] sm:text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider block"
                >
                  {t("managePrefs")}
                </Link>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDecline}
                    className="rounded-xl px-3 h-8 font-bold text-xs text-slate-700 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    {t("decline")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className={cn(
                      "rounded-xl px-3 h-8 text-white font-bold text-xs shadow-none active:scale-95 transition-all text-center",
                      "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {t("accept")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
