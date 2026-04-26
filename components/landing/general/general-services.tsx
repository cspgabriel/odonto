"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowUpRight,
  HeartPulse,
  Stethoscope,
  Smile,
  Activity,
  Eye,
  Brain,
  Bone,
  Pill,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GENERAL_MAX_WIDTH,
  GENERAL_SECTION_TITLE,
  GENERAL_SECTION_PADDING,
  GENERAL_SECTION_BORDER,
  GENERAL_SECTION_BG,
  GENERAL_HEADER_CONTENT_GAP,
  GENERAL_FONT_HEADING,
  GENERAL_RADIUS_CARD,
  GENERAL_RADIUS_BUTTON,
  GENERAL_BUTTON_PRIMARY,
} from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

import type { ContentSettings } from "@/lib/validations/landing-settings";

const SERVICE_KEYS = [
  "angioplasty",
  "cardiology",
  "dental",
  "endocrinology",
  "eyeCare",
  "neurology",
  "orthopedics",
  "rmi",
] as const;

const SERVICE_ICONS: Record<(typeof SERVICE_KEYS)[number], LucideIcon> = {
  angioplasty: HeartPulse,
  cardiology: Stethoscope,
  dental: Smile,
  endocrinology: Activity,
  eyeCare: Eye,
  neurology: Brain,
  orthopedics: Bone,
  rmi: Pill,
};

/** Vibrant color theme per service (icon, bullet, button) – fixed order for consistency */
const SERVICE_COLORS = [
  "rose",      // angioplasty
  "primary",   // cardiology – keep brand primary
  "emerald",   // dental
  "violet",    // endocrinology
  "sky",       // eyeCare
  "amber",     // neurology
  "orange",    // orthopedics
  "cyan",      // rmi
] as const;

const COLOR_CLASSES: Record<(typeof SERVICE_COLORS)[number], { icon: string; bullet: string; link: string; cardHover: string }> = {
  rose: {
    icon: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-400 group-hover:border-rose-400 group-hover:bg-rose-500 group-hover:text-white",
    bullet: "bg-rose-500 group-hover:bg-white",
    link: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-300 group-hover:bg-white/20 group-hover:text-white",
    cardHover: "hover:border-rose-500 hover:bg-rose-500 dark:hover:border-rose-500 dark:hover:bg-rose-500",
  },
  primary: {
    icon: "border-primary/30 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-primary group-hover:border-white/40 group-hover:bg-white/20 group-hover:text-white",
    bullet: "bg-primary group-hover:bg-white",
    link: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary hover:bg-white/20 hover:text-white dark:hover:text-white group-hover:bg-white/20 group-hover:text-white",
    cardHover: "hover:border-primary hover:bg-primary dark:hover:border-primary dark:hover:bg-primary",
  },
  emerald: {
    icon: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:border-emerald-400 group-hover:bg-emerald-500 group-hover:text-white",
    bullet: "bg-emerald-500 group-hover:bg-white",
    link: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 group-hover:bg-white/20 group-hover:text-white",
    cardHover: "hover:border-emerald-500 hover:bg-emerald-500 dark:hover:border-emerald-500 dark:hover:bg-emerald-500",
  },
  violet: {
    icon: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-400 group-hover:border-violet-400 group-hover:bg-violet-500 group-hover:text-white",
    bullet: "bg-violet-500 group-hover:bg-white",
    link: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 hover:bg-violet-500/20 hover:text-violet-700 dark:hover:text-violet-300 group-hover:bg-white/20 group-hover:text-white",
    cardHover: "hover:border-violet-500 hover:bg-violet-500 dark:hover:border-violet-500 dark:hover:bg-violet-500",
  },
  sky: {
    icon: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-400 group-hover:border-sky-400 group-hover:bg-sky-500 group-hover:text-white",
    bullet: "bg-sky-500 group-hover:bg-white",
    link: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 hover:bg-sky-500/20 hover:text-sky-700 dark:hover:text-sky-300 group-hover:bg-white/20 group-hover:text-white",
    cardHover: "hover:border-sky-500 hover:bg-sky-500 dark:hover:border-sky-500 dark:hover:bg-sky-500",
  },
  amber: {
    icon: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-400 group-hover:border-amber-400 group-hover:bg-amber-500 group-hover:text-white",
    bullet: "bg-amber-500 group-hover:bg-white",
    link: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 hover:bg-amber-500/20 hover:text-amber-700 dark:hover:text-amber-300 group-hover:bg-white/20 group-hover:text-white",
    cardHover: "hover:border-amber-500 hover:bg-amber-500 dark:hover:border-amber-500 dark:hover:bg-amber-500",
  },
  orange: {
    icon: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-400 group-hover:border-orange-400 group-hover:bg-orange-500 group-hover:text-white",
    bullet: "bg-orange-500 group-hover:bg-white",
    link: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 hover:bg-orange-500/20 hover:text-orange-700 dark:hover:text-orange-300 group-hover:bg-white/20 group-hover:text-white",
    cardHover: "hover:border-orange-500 hover:bg-orange-500 dark:hover:border-orange-500 dark:hover:bg-orange-500",
  },
  cyan: {
    icon: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:border-cyan-400/40 dark:bg-cyan-500/20 dark:text-cyan-400 group-hover:border-cyan-400 group-hover:bg-cyan-500 group-hover:text-white",
    bullet: "bg-cyan-500 group-hover:bg-white",
    link: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-700 dark:hover:text-cyan-300 group-hover:bg-white/20 group-hover:text-white",
    cardHover: "hover:border-cyan-500 hover:bg-cyan-500 dark:hover:border-cyan-500 dark:hover:bg-cyan-500",
  },
};

function ServiceCard({
  serviceKey,
  t,
  index,
  show,
  reduced,
}: {
  serviceKey: (typeof SERVICE_KEYS)[number];
  t: (key: string) => string;
  index: number;
  show: boolean;
  reduced: boolean;
}) {
  const Icon = SERVICE_ICONS[serviceKey];
  const colorKey = SERVICE_COLORS[index];
  const colors = COLOR_CLASSES[colorKey];
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border border-slate-200/60 bg-white p-6 transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/50 cursor-pointer",
        colors.cardHover,
        GENERAL_RADIUS_CARD
      )}
    >
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-colors", colors.icon)}>
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <h3 className={cn("mb-2 text-lg font-bold text-slate-900 dark:text-white transition-colors group-hover:text-white", GENERAL_FONT_HEADING)}>
        {t(serviceKey)}
      </h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400 transition-colors group-hover:text-white/90">
        {t("description")}
      </p>
      <div className="flex items-end justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors group-hover:text-white/90">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full transition-colors", colors.bullet)} />
          {t(`doctorCount_${serviceKey}`)}
        </span>
        <Link
          href="/appointment"
          className={cn("flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors", colors.link)}
          aria-label={t("viewAll")}
        >
          <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
        </Link>
      </div>
    </motion.div>
  );
}

export function GeneralServices({ services: _settingsServices }: { services?: ContentSettings["services"] }) {
  const t = useTranslations("landing.services");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 20 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.05, ease: "easeOut" } },
  };
  const showInView = !reduced && isInView;

  return (
    <section
      id="services"
      ref={containerRef}
      className={cn("relative overflow-hidden", GENERAL_SECTION_BORDER, GENERAL_SECTION_BG, GENERAL_SECTION_PADDING)}
    >
      <div className={cn("mx-auto px-4", GENERAL_MAX_WIDTH)}>
        {/* Header: title lines + View All */}
        <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", GENERAL_HEADER_CONTENT_GAP)}>
          <div>
            <h2 className={GENERAL_SECTION_TITLE}>
              {t("titleLine1")}
              <br />
              {t("titleLine2")}
            </h2>
          </div>
          <Link
            href="/#services"
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90",
              GENERAL_RADIUS_BUTTON,
              GENERAL_BUTTON_PRIMARY
            )}
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Service cards grid – 1 col mobile, 2 cols tablet, 4 cols desktop (unchanged) */}
        <div className="grid grid-cols-1 gap-4 min-w-0 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_KEYS.map((key, index) => (
            <ServiceCard
              key={key}
              serviceKey={key}
              t={t}
              index={index}
              show={showInView}
              reduced={!!reduced}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
