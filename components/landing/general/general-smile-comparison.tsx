"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { GENERAL_IMAGES } from "./constants";
import { GENERAL_MAX_WIDTH, GENERAL_FONT_HEADING, GENERAL_RADIUS_BUTTON, GENERAL_BUTTON_PRIMARY, GENERAL_SECTION_TITLE, GENERAL_SECTION_DESCRIPTION, GENERAL_SECTION_PADDING, GENERAL_SECTION_BG, GENERAL_TITLE_DESCRIPTION_GAP, GENERAL_HEADER_CONTENT_GAP } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContentSettings } from "@/lib/validations/landing-settings";

const SPEC_KEYS = [
  { name: "spec1Name" as const, role: "spec1Role" as const, image: GENERAL_IMAGES.doctor1 },
  { name: "spec2Name" as const, role: "spec2Role" as const, image: GENERAL_IMAGES.doctor2 },
  { name: "spec3Name" as const, role: "spec3Role" as const, image: GENERAL_IMAGES.doctor3 },
  { name: "spec4Name" as const, role: "spec4Role" as const, image: GENERAL_IMAGES.doctor4 },
];

export function GeneralSmileComparison({ smileComparison: _smileComparison }: { smileComparison?: ContentSettings["smileComparison"] }) {
  const t = useTranslations("landing.specialists");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const showInView = !reduced && isInView;

  return (
    <section
      ref={containerRef}
      id="specialists"
      className={cn("relative overflow-hidden", GENERAL_SECTION_PADDING, GENERAL_SECTION_BG)}
    >
      <div className={cn("mx-auto px-4 relative z-10", GENERAL_MAX_WIDTH)}>
        {/* Heading – same section style as testimonials: title + small text below */}
        <div className={cn("text-center", GENERAL_HEADER_CONTENT_GAP)}>
          <h2 className={cn(GENERAL_SECTION_TITLE, "break-words", GENERAL_TITLE_DESCRIPTION_GAP)}>
            {t("titleLine1")} {t("titleLine2")}
          </h2>
          <p className={cn("max-w-2xl mx-auto break-words", GENERAL_SECTION_DESCRIPTION)}>
            {t("subtitle")}
          </p>
        </div>

        {/* 4 specialist cards – minimal gap, larger cards filling grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px]">
          {SPEC_KEYS.map((spec, idx) => (
            <motion.div
              key={spec.name}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={
                showInView
                  ? { opacity: 1, y: 0, transition: { duration: 0.4, delay: idx * 0.08, ease: [0.25, 1, 0.5, 1] } }
                  : {}
              }
              whileHover={reduced ? undefined : { y: -6 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              className="w-full min-w-0 cursor-pointer"
            >
              <Card className="group flex flex-col gap-0 overflow-hidden rounded-xl border border-slate-200/60 bg-white p-0 py-0 shadow-sm dark:border-slate-800/60 dark:bg-slate-900">
                {/* Larger image – subtle shadow below image on hover only */}
                <div className="relative h-80 w-full shrink-0 overflow-hidden transition-shadow duration-300 shadow-none group-hover:shadow-[0_6px_14px_-2px_rgba(0,0,0,0.08)] dark:group-hover:shadow-[0_6px_14px_-2px_rgba(0,0,0,0.35)]">
                  <Image
                    src={spec.image}
                    alt={t(spec.name)}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Reduced overlay only at bottom of image on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:from-black/40" aria-hidden />
                  <Link
                    href="/appointment"
                    className={cn(
                      "absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white shadow-none opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                      GENERAL_RADIUS_BUTTON,
                      GENERAL_BUTTON_PRIMARY
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {t("appointmentNow")}
                  </Link>
                </div>

                {/* Name & specialty – footer, dark on hover; bg matches card in dark mode */}
                <div className="flex flex-col gap-0 border-t border-slate-200/60 bg-white p-4 transition-colors duration-200 group-hover:border-slate-700 group-hover:bg-slate-800 dark:border-slate-800/60 dark:bg-slate-900 dark:group-hover:border-slate-600 dark:group-hover:bg-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-slate-800 transition-colors group-hover:text-white dark:text-white">
                        {t(spec.name)}
                      </p>
                      <p className="truncate text-sm text-slate-500 transition-colors group-hover:text-slate-300 dark:text-primary">
                        {t(spec.role)}
                      </p>
                    </div>
                    <Link
                      href="/appointment"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-800 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white group-hover:bg-slate-700 group-hover:text-white"
                      aria-label={t(spec.name)}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
