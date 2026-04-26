"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePreferences } from "@/contexts/preferences-context";
import { CURRENCY_OPTIONS } from "@/lib/preferences/constants";
import type { CurrencyCode } from "@/lib/preferences/constants";
import { useTranslations } from "next-intl";

const CURRENCY_MESSAGE_KEYS: Record<CurrencyCode, string> = {
  USD: "currencyUSD",
  EUR: "currencyEUR",
  GBP: "currencyGBP",
  CHF: "currencyCHF",
  CAD: "currencyCAD",
};

export function CurrencyShortcut() {
  const t = useTranslations("settings");
  const tHeader = useTranslations("header");
  const tCommon = useTranslations("common");
  const { currency, setCurrency } = usePreferences();
  const current = CURRENCY_OPTIONS.find((o) => o.value === currency);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<CurrencyCode | null>(null);

  const pendingOption = pendingValue
    ? CURRENCY_OPTIONS.find((o) => o.value === pendingValue)
    : null;

  const currencyLabel = (code: CurrencyCode) => t(CURRENCY_MESSAGE_KEYS[code] as "currencyUSD");

  function handleSelect(value: string) {
    if (value === currency) return;
    setPendingValue(value as CurrencyCode);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pendingValue) return;
    await setCurrency(pendingValue);
    setPendingValue(null);
    setConfirmOpen(false);
  }

  function handleCancel() {
    setPendingValue(null);
    setConfirmOpen(false);
  }

  return (
    <>
      <Select value={currency} onValueChange={handleSelect}>
        <SelectTrigger
          className="!h-8 gap-1.5 border border-input bg-background px-3 py-1.5 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground !focus:outline-none !focus-visible:outline-none !focus:ring-0 !focus-visible:ring-0 rounded-xl min-w-fit cursor-pointer leading-none"
          aria-label={tHeader("displayCurrency")}
        >
          <SelectValue placeholder={t("currency")}>
            {current ? (
              <span className="whitespace-nowrap">
                {current.symbol} {currencyLabel(current.value)}
              </span>
            ) : (
              t("currency")
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="!bg-background !text-foreground border border-border shadow-lg backdrop-blur-sm">
          {CURRENCY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="font-medium">{option.symbol}</span>
              <span className="ml-2">{currencyLabel(option.value)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setPendingValue(null);
          setConfirmOpen(open);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("changeCurrencyTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingOption
                ? t("changeCurrencyDescriptionConfirm", {
                    name: currencyLabel(pendingOption.value),
                    symbol: pendingOption.symbol,
                  })
                : t("changeCurrencyDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {t("changeCurrencyAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
