"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING, OPHTHALMOLOGY_RADIUS_BUTTON } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { SpinningText } from "@/components/ui/spinning-text";
import type { ContentSettings } from "@/lib/validations/landing-settings";

/** Circular badge: SpinningText + primary circle + arrow in center */
function CircularRotatingBadge({ text, reducedMotion }: { text: string; reducedMotion?: boolean }) {
  return (
    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
      <Link
        href="#services"
        className="block relative flex justify-center items-center w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] lg:w-[180px] lg:h-[180px]"
      >
        {/* Primary circle – behind the text */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-full bg-primary -z-[1]"
        />
        {/* Spinning text – rotates around center, on top of circle */}
        <SpinningText
          duration={reducedMotion ? 0 : 20}
          fontSize={0.65}
          radius={5}
          className="absolute inset-0 text-white font-semibold uppercase"
        >
          {text}
        </SpinningText>
        {/* Arrow in middle – counter-rotates to stay upright (no motion when reduced) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-white pointer-events-none"
          animate={reducedMotion ? {} : { rotate: -360 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 shrink-0" strokeWidth={2} />
        </motion.div>
      </Link>
    </div>
  );
}

const IMAGES = {
  main: "/landing/ophthalmology/images/optometrists_Ophthalmologists.png",
  inset: "/landing/ophthalmology/images/we-care-inset.webp",
};

export function OphthalmologyWeCare({ dentalHealth }: { dentalHealth?: ContentSettings["dentalHealth"] }) {
  const t = useTranslations("landing.weCare");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  const STATS = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
  ];

  const fadeUp: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 16 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" } },
  };
  const showInView = !reduced && isInView;

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative overflow-hidden py-16 lg:py-20",
        "bg-white dark:bg-slate-950"
      )}
    >
      <div className={cn("mx-auto px-4 lg:pl-12 lg:pr-4", OPHTHALMOLOGY_MAX_WIDTH)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* LEFT: Text content – shifted right on desktop */}
          <div className="lg:col-start-1">
            <motion.h2
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUp}
              custom={1}
              className={cn(
                "text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.1] mt-2 mb-4",
                OPHTHALMOLOGY_FONT_HEADING
              )}
            >
              {t("title")}
            </motion.h2>
            <motion.p
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUp}
              custom={2}
              className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mb-8"
            >
              {t("description")}
            </motion.p>

            {/* Stats row – 3 columns (content-bx style-1) */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial="hidden"
                  animate={reduced || !isInView ? "hidden" : "visible"}
                  variants={fadeUp}
                  custom={3 + i}
                >
                  <span className="block text-4xl sm:text-5xl font-black text-primary tabular-nums mb-0 tracking-tight">
                    {stat.value}+
                  </span>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1 mb-0">
                    {stat.label}
                  </h3>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUp}
              custom={6}
            >
              <Link
                href="#services"
                className={cn(
                  "inline-flex items-center gap-2 bg-primary px-6 py-3",
                  "text-sm font-bold text-white hover:bg-primary/90 transition-colors",
                  OPHTHALMOLOGY_RADIUS_BUTTON
                )}
              >
                {t("readMore")}
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </motion.div>
          </div>

          {/* RIGHT: Images */}
          <div className="relative lg:col-start-2 w-full max-w-md mx-auto lg:ml-auto lg:max-w-[420px] shrink-0">
            <div className="relative w-full">
              {/* Main image – big card, rounded top (half-circle frame) */}
              <div className="relative w-full aspect-[5/6] sm:aspect-[4/5] min-h-[300px] overflow-hidden rounded-t-[400px] rounded-b-2xl bg-slate-200 dark:bg-slate-800">
                <Image
                    src={IMAGES.main}
                    alt={t("patientImageAlt")}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 448px, 420px"
                  />
              </div>
              {/* Inset overlay – bottom left of big card, portrait (height > width) */}
              <div
                className={cn(
                  "absolute -bottom-3 left-2 sm:-bottom-4 sm:left-3 w-[90px] h-[130px] sm:w-[110px] sm:h-[160px]",
                  "rounded-2xl overflow-hidden border-[8px] border-white",
                  "z-10"
                )}
              >
                <Image
                  src={IMAGES.inset}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>
              {/* Award badge – top right */}
              <CircularRotatingBadge text={t("awardBadge")} reducedMotion={reduced} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
