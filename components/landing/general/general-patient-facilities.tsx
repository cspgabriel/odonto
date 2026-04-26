"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useInView, type Variants } from "framer-motion";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import {
  GENERAL_MAX_WIDTH,
  GENERAL_SECTION_TITLE,
  GENERAL_SECTION_PADDING,
  GENERAL_SECTION_BORDER,
  GENERAL_SECTION_BG,
  GENERAL_RADIUS_BUTTON,
  GENERAL_RADIUS_CARD,
  GENERAL_BUTTON_PRIMARY,
} from "./config";

const OPEN_HOURS_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
};

export function GeneralPatientFacilities() {
  const t = useTranslations("landing.facilities");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const show = !reduced && isInView;

  return (
    <section
      id="facilities"
      ref={containerRef}
      className={cn("relative overflow-hidden", GENERAL_SECTION_BORDER, GENERAL_SECTION_BG, GENERAL_SECTION_PADDING)}
    >
      <div className={cn("mx-auto px-4", GENERAL_MAX_WIDTH)}>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left: Squared image card, Open Hours at bottom-right of card */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: -20 }}
            animate={show ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative flex justify-center lg:justify-start"
          >
            <div className={cn("relative w-full max-w-lg overflow-hidden bg-slate-200", GENERAL_RADIUS_CARD)}>
              <div className="relative aspect-square w-full">
                <Image
                  src="/landing/general/images/img1.a99fc167.webp"
                  alt={t("doctorAlt")}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              {/* Open Hours – card at bottom-right */}
              <div className={cn("absolute bottom-4 right-4 z-10 w-[200px] border border-primary/30 bg-white px-4 py-4 shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:w-[220px]", GENERAL_RADIUS_CARD)}>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t("openHoursTitle")}</h4>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {OPEN_HOURS_DAYS.map((day) => (
                    <li key={day} className="flex justify-between">
                      <span className="capitalize">{t(`openHours.${day}`)}</span>
                      <span className="tabular-nums">{t("openHours.time")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Right: Heading, paragraph, checklist, CTA */}
          <div className="space-y-4">
            <motion.h2
              custom={0}
              initial="hidden"
              animate={show ? "visible" : "hidden"}
              variants={fadeUpVariants}
              className={cn(
                GENERAL_SECTION_TITLE
              )}
            >
              {t("title")}
            </motion.h2>
            <motion.p
              custom={1}
              initial="hidden"
              animate={show ? "visible" : "hidden"}
              variants={fadeUpVariants}
              className="text-slate-600 dark:text-slate-400 leading-relaxed"
            >
              {t("description")}
            </motion.p>

            <motion.ul
              custom={2}
              initial="hidden"
              animate={show ? "visible" : "hidden"}
              variants={fadeUpVariants}
              className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2"
            >
              {[
                "comprehensiveSpecialties",
                "researchDevelopment",
                "emergencyServices",
                "advancedImaging",
                "intensiveCare",
                "rehabilitation",
                "telemedicine",
                "patientCentric",
                "multidisciplinaryTeam",
                "healthInfoTech",
              ].map((key) => (
                <li key={key} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-medium">{t(`services.${key}`)}</span>
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={show ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-8"
            >
              <Link
                href="/appointment"
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98]",
                  GENERAL_RADIUS_BUTTON,
                  GENERAL_BUTTON_PRIMARY
                )}
              >
                {t("ctaButton")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
