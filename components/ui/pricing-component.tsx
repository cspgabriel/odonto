"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PricingVariant = "teal" | "rose" | "indigo" | "primary";

const variantClasses = {
  primary: {
    checkLight: "fill-primary",
    checkDark: "stroke-primary",
    toggleOn: "bg-primary ring-primary",
    toggleOnDark: "bg-primary ring-primary",
    button: "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90",
    buttonShadow: "shadow-[0_4px_18px_-6px_rgba(12,192,223,0.35)]",
    buttonRing: "ring-primary/20",
    icon: "text-primary-foreground",
  },
  teal: {
    checkLight: "fill-teal-500",
    checkDark: "stroke-teal-400",
    toggleOn: "bg-teal-600 ring-teal-600",
    toggleOnDark: "bg-teal-500 ring-teal-400",
    button: "bg-teal-600 text-white hover:bg-teal-700",
    buttonShadow: "shadow-[0_4px_18px_-6px_rgba(13,148,136,0.35)]",
    buttonRing: "ring-teal-900/10",
    icon: "text-teal-100",
  },
  rose: {
    checkLight: "fill-rose-500",
    checkDark: "stroke-rose-400",
    toggleOn: "bg-rose-600 ring-rose-600",
    toggleOnDark: "bg-rose-500 ring-rose-400",
    button: "bg-rose-500 text-white hover:bg-rose-600",
    buttonShadow: "shadow-[0_4px_18px_-6px_rgba(225,29,72,0.35)]",
    buttonRing: "ring-rose-900/10",
    icon: "text-rose-100",
  },
  indigo: {
    checkLight: "fill-indigo-600",
    checkDark: "stroke-indigo-400",
    toggleOn: "bg-indigo-600 ring-indigo-600",
    toggleOnDark: "bg-indigo-500 ring-indigo-400",
    button: "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 dark:from-indigo-600 dark:to-indigo-500 dark:hover:from-indigo-500 dark:hover:to-indigo-400",
    buttonShadow: "shadow-[0_4px_18px_-6px_rgba(91,110,245,0.35)]",
    buttonRing: "ring-indigo-900/10",
    icon: "text-indigo-100",
  },
} as const;

export default function PricingCards({ variant: variantProp = "rose", radiusCard = "rounded-3xl", radiusButton = "rounded-2xl" }: { variant?: PricingVariant; radiusCard?: string; radiusButton?: string }) {
  const t = useTranslations("landing.pricing");
  const [basicEmergency, setBasicEmergency] = useState(false);
  const [premiumEmergency, setPremiumEmergency] = useState(false);
  const v = variantClasses[variantProp];

  const LightCheckIcon = ({ className = "" }: { className?: string }) => (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="8" className={v.checkLight} />
      <path
        d="M5.5 8.5L7 10L11 6"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const DarkCheckIcon = ({ className = "" }: { className?: string }) => (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7.5" className={v.checkDark} />
      <path
        d="M5.5 8.5L7 10L11 6"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ToggleSwitch = ({
    enabled,
    onChange,
    isDark = false,
  }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    isDark?: boolean;
  }) => (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-1 ring-inset",
          enabled
            ? isDark
              ? v.toggleOnDark
              : v.toggleOn
            : isDark
            ? "bg-neutral-800 ring-neutral-700"
            : "bg-neutral-200 ring-neutral-300"
        )}
        aria-pressed={enabled}
        aria-label={t("essentialCare.priorityConsultation")}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ease-in-out shadow-sm",
            enabled ? "translate-x-6" : "translate-x-1",
            isDark ? (enabled ? "bg-white" : "bg-neutral-500") : "bg-white"
          )}
        />
      </button>
      <span className={cn("text-sm", isDark ? "text-neutral-400" : "text-neutral-600")}>
        {t("essentialCare.priorityConsultation")}
      </span>
    </div>
  );

  const basicFeatures = [
    t("essentialCare.standardExam"),
    t("essentialCare.professionalCleaning"),
    t("essentialCare.digitalXrays"),
    t("essentialCare.personalConsultation"),
  ];
  const premiumFeatures = [
    t("advancedSmile.fullAestheticDesign"),
    t("advancedSmile.professionalWhitening"),
    t("advancedSmile.panoramicImaging"),
    t("advancedSmile.sedationOptions"),
    t("advancedSmile.postCareKit"),
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 w-full max-w-[900px] mx-auto">
        {/* Essential Card */}
        <div
          className={cn(
            cn(radiusCard, "p-2"),
            "bg-white/65 dark:bg-neutral-900/60 backdrop-blur-md",
            "border border-neutral-200/70 dark:border-neutral-800/70",
            "shadow-[0_12px_40px_-15px_rgba(0,0,0,0.15)]",
            "ring-1 ring-inset ring-white/40 dark:ring-white/10"
          )}
        >
            <div className={cn(
              `${radiusButton} p-8 mb-2`,
              "bg-white/80 dark:bg-neutral-900/70 backdrop-blur-sm",
              "border border-neutral-200/80 dark:border-neutral-800/80",
              "ring-1 ring-inset ring-neutral-900/5 dark:ring-white/5"
            )}>
              <div className="mb-6 flex items-start justify-between min-h-[80px]">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{t("essentialCare.name")}</h2>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mt-1">
                    {t("essentialCare.description")}
                  </p>
                </div>
                <span className={cn("inline-flex items-center", radiusButton, "border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-300 backdrop-blur whitespace-nowrap shrink-0 ml-4")}>
                  {t("essentialCare.badge")}
                </span>
              </div>

              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-bold tracking-tighter text-neutral-900 dark:text-white">{t("essentialCare.price")}</span>
                <span className="text-neutral-400 dark:text-neutral-500 text-lg ml-1">{t("essentialCare.period")}</span>
              </div>

            <button
              className={cn(
                `w-full ${radiusButton} font-bold text-base py-4`,
                "transition-colors duration-200",
                "flex items-center justify-center gap-2.5",
                "ring-1 ring-inset",
                v.button,
                v.buttonShadow,
                v.buttonRing
              )}
            >
              {t("essentialCare.bookService")}
              <Calendar className={cn("w-5 h-5", v.icon)} />
            </button>
          </div>

          <div
            className={cn(
              "px-6 pb-6 pt-4",
              `bg-white/50 dark:bg-neutral-900/55 backdrop-blur-sm ${radiusButton}`,
              "border border-neutral-200/70 dark:border-neutral-800/70",
              "ring-1 ring-inset ring-white/30 dark:ring-white/10"
            )}
          >
            <div className="grid grid-cols-2 gap-y-4 gap-x-4 min-h-[100px]">
              {basicFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <LightCheckIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-neutral-800 dark:text-neutral-300 text-[13px] font-medium leading-tight">{feature}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <ToggleSwitch enabled={basicEmergency} onChange={setBasicEmergency} />
            </div>
          </div>
        </div>

        {/* Advanced Card */}
        <div
          className={cn(
            cn(radiusCard, "p-2"),
            "bg-neutral-900/60 backdrop-blur-md",
            "border border-neutral-800",
            "shadow-[0_12px_50px_-15px_rgba(0,0,0,0.55)]",
            "ring-1 ring-inset ring-white/5",
            "dark"
          )}
        >
          <div
            className={cn(
              `${radiusButton} p-8 mb-2`,
              "bg-neutral-900/70 backdrop-blur-sm",
              "border border-neutral-800",
              "ring-1 ring-inset ring-white/10"
            )}
          >
            <div className="mb-6 flex items-start justify-between min-h-[80px]">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-50">{t("advancedSmile.name")}</h2>
                <p className="text-neutral-400 text-sm leading-relaxed mt-1">
                  {t("advancedSmile.description")}
                </p>
              </div>
              <span className={cn("inline-flex items-center", radiusButton, "border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur whitespace-nowrap shrink-0 ml-4")}>
                {t("advancedSmile.badge")}
              </span>
            </div>

            <div className="flex items-baseline mb-8">
              <span className="text-5xl font-bold tracking-tighter text-white">{t("advancedSmile.price")}</span>
              <span className="text-neutral-500 text-lg ml-1">{t("advancedSmile.period")}</span>
            </div>

            <button
              className={cn(
                `w-full ${radiusButton} font-bold text-base py-4`,
                "transition-colors duration-200",
                "flex items-center justify-center gap-2.5",
                "ring-1 ring-inset ring-white/30",
                v.button,
                v.buttonShadow
              )}
            >
              {t("advancedSmile.bookService")}
              <Calendar className={cn("w-5 h-5", v.icon)} />
            </button>
          </div>

          <div
            className={cn(
              "px-6 pb-6 pt-4",
              "bg-neutral-900/55 backdrop-blur-sm rounded-xl",
              "border border-neutral-800",
              "ring-1 ring-inset ring-white/10"
            )}
          >
            <div className="grid grid-cols-2 gap-y-4 gap-x-4 min-h-[100px]">
              {premiumFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <DarkCheckIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-neutral-300 text-[13px] font-medium leading-tight">{feature}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <ToggleSwitch enabled={premiumEmergency} onChange={setPremiumEmergency} isDark />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
