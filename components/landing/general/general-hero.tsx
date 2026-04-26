"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  GENERAL_FONT_HEADING,
  GENERAL_MAX_WIDTH,
  GENERAL_RADIUS_BUTTON,
  GENERAL_RADIUS_CARD,
  GENERAL_GRADIENT,
  GENERAL_BUTTON_PRIMARY,
  GENERAL_BUTTON_SECONDARY,
} from "./config";
import type { ContentSettings } from "@/lib/validations/landing-settings";

/* Arrow icon for CTAs */
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Circular progress (82%) – full width of card or fixed size, thick fill, thin light track */
function CircularProgress({ value, size = 100, fullWidth, compact }: { value: number; size?: number; fullWidth?: boolean; compact?: boolean }) {
  const trackStroke = 4;
  const progressStroke = 6;
  const radius = (size - progressStroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const wrapperClass = fullWidth ? "relative w-full aspect-square min-h-0" : "relative inline-flex shrink-0";
  const wrapperStyle = fullWidth ? undefined : { width: size, height: size };
  return (
    <div className={wrapperClass} style={wrapperStyle}>
      <svg className="-rotate-90 size-full" viewBox={fullWidth ? `0 0 ${size} ${size}` : undefined} width={fullWidth ? "100%" : size} height={fullWidth ? "100%" : size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - trackStroke) / 2}
          stroke="currentColor"
          strokeWidth={trackStroke}
          fill="none"
          className="text-primary/20 dark:text-primary/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={progressStroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-700"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-black text-primary tabular-nums",
          compact ? "text-lg sm:text-xl" : "text-4xl"
        )}
      >
        {value}%
      </span>
    </div>
  );
}

export function GeneralHero({ hero }: { hero?: ContentSettings["hero"] }) {
  const t = useTranslations("landing.hero");
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Always use template copy so hero matches ClinicMaster design (Medical & Health Care Services)
  const fullHeadline = t("headline");
  const headlineAccent = t("headlineAccent");
  const headlineRest = fullHeadline.replace(new RegExp(`\\s*${headlineAccent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "").trim() || fullHeadline;
  const subtitle = t("subtitle");

  return (
    <section
      id="hero"
      className="relative z-0 min-h-0 overflow-hidden pt-28 pb-0 dark:bg-slate-950 lg:pt-32"
    >
      {/* Background: primary gradient + subtle grid */}
      <div className={cn("absolute inset-0 -z-50 h-full w-full", GENERAL_GRADIENT)} />
      <div className="absolute inset-0 -z-40 h-full w-full opacity-[0.5] bg-[linear-gradient(to_right,#0cc0df08_1px,transparent_1px),linear-gradient(to_bottom,#0cc0df08_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className={cn("mx-auto h-full px-4", GENERAL_MAX_WIDTH)}>
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-8">
          {/* LEFT: Vertical label + content (centered vertically in hero on desktop) */}
          <div className="relative z-10 flex lg:w-1/2 lg:items-center">
            {/* Vertical label - 24/7 EMERGENCY SERVICE (rotated) */}
            <div
              className={cn(
                "hidden shrink-0 lg:flex items-center justify-center w-8 self-center",
                isRTL ? "rotate-90" : "-rotate-90"
              )}
              style={{ minHeight: "180px" }}
            >
              <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                {t("verticalLabel")}
              </span>
            </div>

            <div className="flex-1 min-w-0 pt-6 lg:ps-2 lg:pt-8">
              <h1
                className={cn(
                  "text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-7xl dark:text-white",
                  GENERAL_FONT_HEADING
                )}
              >
                {headlineRest}{" "}
                <span className="text-primary">{headlineAccent}</span>
              </h1>

              <p className="mt-5 max-w-lg text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                {subtitle}
              </p>

              {/* CTAs: primary = solid main color, compact, continuous radius */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/appointment"
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98]",
                    GENERAL_RADIUS_BUTTON,
                    GENERAL_BUTTON_PRIMARY
                  )}
                >
                  {t("appointment")}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/#contact"
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-95 active:scale-[0.98]",
                    GENERAL_RADIUS_BUTTON,
                    GENERAL_BUTTON_SECONDARY
                  )}
                >
                  {t("contactUs")}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              {/* 150k Patient recovers – left side, replaces Have a Question? */}
              <div
                className={cn(
                  "mt-10 flex w-fit items-center gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-slate-800/95",
                  GENERAL_RADIUS_CARD,
                  "border border-slate-200/60 dark:border-slate-700/60"
                )}
              >
                <div className="flex -space-x-2">
                  {[
                    "avatar1.22bb7fef.webp",
                    "avatar2.faf6f9cf.webp",
                    "avatar3.7024dc80.webp",
                    "avatar4.1f1f95dc.webp",
                  ].map((src) => (
                    <Image
                      key={src}
                      src={`/landing/general/images/${src}`}
                      alt={t("avatarAlt")}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border-2 border-white object-cover dark:border-slate-800"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t("patientRecoversCount")} {t("patientRecovers")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Doctor image – column fills hero height, slightly reduced min-height */}
          <div className="relative mt-10 flex flex-col lg:mt-0 lg:w-1/2 lg:min-h-0 lg:self-stretch">
            <div className="relative mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col lg:max-w-[620px] lg:h-full">
              {/* Circle wrapper – concentric circles like reference (square wrapper, bottom offset = arcs) */}
              <div
                className="absolute left-0 z-0 w-full aspect-square overflow-hidden pointer-events-none rounded-bl-[80px] rounded-tr-2xl"
                style={{ bottom: "-200px" }}
              >
                <span className="absolute left-1/2 top-1/2 w-[70%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-white/90" aria-hidden />
                <span className="absolute left-1/2 top-1/2 w-[85%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-primary/20 dark:border-primary/20" aria-hidden />
                <span className="absolute left-1/2 top-1/2 w-full aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-primary/10 dark:border-primary/10" aria-hidden />
              </div>
              {/* Main doctor image – fills column, object-bottom so image bottom = hero end */}
              <div className="relative z-10 min-h-[320px] flex-1 overflow-hidden rounded-bl-[80px] rounded-tr-2xl lg:min-h-0">
                <Image
                  src="/landing/general/images/img1.5e8fe5d6.webp"
                  alt={t("heroDoctorAlt")}
                  width={620}
                  height={900}
                  className="h-full w-full object-cover object-bottom"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAUDB//EACIQAAEEAgICAwAAAAAAAAAAAAEAAgMEERIhBRTiMf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCU0tFXMiJHC1t/B1qy6GCxJcBqIjOk/FDdgH1lY5R67P2jb9Ip82F9ufhERB//2Q=="
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 580px"
                />
              </div>

              {/* Floating card: Successfully diagnosis – compact, moved right and down */}
              <div
                className={cn(
                  "absolute left-4 top-[24%] z-20 flex w-[120px] flex-col rounded-xl bg-white p-2 dark:bg-slate-800/95 sm:left-6 sm:top-[26%] sm:w-[128px] sm:p-2.5",
                  GENERAL_RADIUS_CARD,
                  "border border-slate-200/80 dark:border-slate-700/80 animate-float-subtle"
                )}
              >
                <div className="w-full">
                  <CircularProgress value={82} size={100} fullWidth compact />
                </div>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <h6 className="text-[10px] font-bold leading-snug text-slate-800 dark:text-white sm:text-xs">{t("successfullyDiagnosis")}</h6>
                  <Link
                    href="/appointment"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary dark:border-primary/30 dark:text-primary dark:hover:border-primary/50 dark:hover:bg-primary/20 sm:h-6 sm:w-6"
                  >
                    <ArrowRightIcon className="h-2.5 w-2.5 rotate-[-45deg] sm:h-3 sm:w-3" />
                  </Link>
                </div>
              </div>

              {/* Heart icon card – rounded, generous padding */}
              <div
                className={cn(
                  "absolute right-[12%] top-[15%] z-20 flex size-16 items-center justify-center border border-slate-200/80 bg-white p-5 dark:border-slate-700/80 dark:bg-slate-800",
                  GENERAL_RADIUS_CARD,
                  "animate-pulse-subtle"
                )}
              >
                <Image
                  src="/landing/general/images/heart.0bb9764e.png"
                  alt={t("heartAlt")}
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>

              {/* Testimonial card: Dr. Natali Jackson – bottom-right inside hero */}
              <div
                className={cn(
                  "absolute bottom-[10px] right-[-10px] z-20 w-[260px] bg-white p-4 dark:bg-slate-800 sm:right-[-20px] lg:right-[-30px]",
                  GENERAL_RADIUS_CARD,
                  "border border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-200/60 dark:shadow-black/20 animate-float-subtle"
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <Image
                    src="/landing/general/images/avatar5.a51628be.webp"
                    alt={t("testimonialName")}
                    width={48}
                    height={48}
                    className="h-11 w-11 shrink-0 rounded-full object-cover border border-slate-100 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <h6 className="text-sm font-bold text-slate-900 dark:text-white">{t("testimonialName")}</h6>
                    <div className="flex gap-0.5 text-primary mt-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  &ldquo;{t("testimonialQuote")}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
