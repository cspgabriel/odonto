"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { GENERAL_MAX_WIDTH, GENERAL_FONT_HEADING, GENERAL_GRADIENT } from "./config";

const AVATAR_SOURCES = [
  "avatar1.22bb7fef.webp",
  "avatar2.faf6f9cf.webp",
  "avatar3.7024dc80.webp",
  "avatar4.1f1f95dc.webp",
] as const;

const stagger = (i: number) => ({ duration: 0.4, delay: i * 0.1, ease: "easeOut" as const });

export function GeneralStatsBar() {
  const t = useTranslations("landing.stats");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const show = !reduced && isInView;

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative flex min-h-0 flex-col justify-center overflow-hidden border-t border-slate-200/60 pt-8 pb-6 dark:border-slate-800/60",
        GENERAL_GRADIENT
      )}
      aria-label={t("ariaLabel")}
    >
      {/* Subtle grid – matches hero */}
      <div className="absolute inset-0 -z-10 opacity-[0.5] bg-[linear-gradient(to_right,#0cc0df08_1px,transparent_1px),linear-gradient(to_bottom,#0cc0df08_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className={cn("relative z-10 mx-auto w-full px-4 py-4", GENERAL_MAX_WIDTH)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:items-center">
          {/* 1. Appointment Booking – with avatars, left-aligned */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={show ? { opacity: 1, y: 0 } : {}}
            transition={stagger(0)}
            className="flex flex-col items-start text-left"
          >
            <div className="mb-4 flex -space-x-3">
              {AVATAR_SOURCES.map((src) => (
                <Image
                  key={src}
                  src={`/landing/general/images/${src}`}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border-2 border-white object-cover dark:border-slate-800"
                />
              ))}
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              <span className="tabular-nums">{t("appointmentLine1")}</span>
              <br />
              <span className="text-slate-600 dark:text-white/80">{t("appointmentLine2")}</span>
            </p>
          </motion.div>

          {/* 2. Specialists */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={show ? { opacity: 1, y: 0 } : {}}
            transition={stagger(1)}
            className="flex flex-col items-center justify-center text-center"
          >
            <p className={cn("text-4xl font-black tabular-nums text-slate-900 dark:text-white sm:text-5xl", GENERAL_FONT_HEADING)}>
              {t("specialistsNumber")}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-white/80">{t("specialistsLabel")}</p>
          </motion.div>

          {/* 3. Happy Patients */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={show ? { opacity: 1, y: 0 } : {}}
            transition={stagger(2)}
            className="flex flex-col items-center justify-center text-center"
          >
            <p className={cn("text-4xl font-black tabular-nums text-slate-900 dark:text-white sm:text-5xl", GENERAL_FONT_HEADING)}>
              {t("patientsNumber")}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-white/80">{t("patientsLabel")}</p>
          </motion.div>

          {/* 4. Winning Awards */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={show ? { opacity: 1, y: 0 } : {}}
            transition={stagger(3)}
            className="flex flex-col items-center justify-center text-center"
          >
            <p className={cn("text-4xl font-black tabular-nums text-slate-900 dark:text-white sm:text-5xl", GENERAL_FONT_HEADING)}>
              {t("awardsNumber")}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-white/80">{t("awardsLabel")}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
