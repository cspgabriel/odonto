"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "carenova-overdue-warning-dismissed";
const RE_SHOW_AFTER_HOURS = 4;

export function OverdueWarningBanner({ overdueCount }: { overdueCount: number }) {
  const t = useTranslations("header");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (overdueCount <= 0) {
      setVisible(false);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setVisible(true);
        return;
      }
      const dismissedAt = new Date(raw);
      if (isNaN(dismissedAt.getTime())) {
        setVisible(true);
        return;
      }
      const hoursSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60);
      setVisible(hoursSinceDismissed >= RE_SHOW_AFTER_HOURS);
    } catch {
      setVisible(true);
    }
  }, [overdueCount]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
  };

  if (!visible || overdueCount <= 0) return null;

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-center gap-2">
      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
      <p className="text-sm font-semibold text-red-800 dark:text-red-200 flex-1">
        {t("overdueInvoicesMessage", { count: overdueCount })}
      </p>
      <Button variant="outline" size="sm" className="shrink-0" asChild>
        <Link href="/dashboard/invoices?status=overdue">{t("view")}</Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
        onClick={handleDismiss}
        aria-label={t("dismiss")}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
