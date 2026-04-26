"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GENERAL_IMAGES } from "./constants";
import type { ContentSettings } from "@/lib/validations/landing-settings";
import { GENERAL_MAX_WIDTH, GENERAL_SECTION_TITLE, GENERAL_SECTION_DESCRIPTION, GENERAL_FONT_HEADING, GENERAL_RADIUS_CARD } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const SKILL_KEYS = ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6"] as const;

/** Doctor portrait for about section – public/landing/general/images/img1.9e846f12.png */
const ABOUT_DOCTOR_IMAGE = "/landing/general/images/img1.9e846f12.png";

export function GeneralAboutDoctor({ aboutDoctor }: { aboutDoctor?: ContentSettings["aboutDoctor"] }) {
  const t = useTranslations("landing.aboutDoctor");
  const locale = useLocale();
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const doctorImage = aboutDoctor?.doctorImageUrl ?? ABOUT_DOCTOR_IMAGE;

  const useDbForText = locale === "en";
  const doctorName =
    useDbForText && aboutDoctor?.doctorName ? aboutDoctor.doctorName : t("doctorName");
  const sectionTitle =
    useDbForText && aboutDoctor?.sectionTitle ? aboutDoctor.sectionTitle : t("title");
  const description =
    useDbForText && (aboutDoctor?.paragraph1 != null)
      ? [aboutDoctor.paragraph1, aboutDoctor.paragraph2].filter(Boolean).join(" ").trim() || t("description")
      : t("description");

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 20 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" } },
  };
  const showInView = !reduced && isInView;

  return (
    <section
      id="about"
      ref={containerRef}
      className={cn(
        "relative overflow-hidden pt-6 pb-0 lg:pt-8 lg:pb-0 bg-white dark:bg-slate-950"
      )}
    >
      <div className={cn("mx-auto px-4 pb-0 relative z-10", GENERAL_MAX_WIDTH)}>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Left: Doctor image with 20+ Years badge */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: -24 }}
            animate={showInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative flex justify-center lg:justify-start -mt-2 lg:-mt-4"
          >
            <div className="relative aspect-[3/4] w-full max-w-lg overflow-visible rounded-3xl bg-transparent">
              {/* Native img so the PNG loads reliably (Next/Image can fail on some local PNGs) */}
              <img
                src={doctorImage}
                alt={doctorName}
                className="absolute inset-0 h-full w-full object-contain object-center scale-105"
                loading="lazy"
                decoding="async"
              />
              {/* 20+ Years Experienced badge - bottom left */}
              <div
                className={cn(
                  "absolute bottom-6 left-6 z-10 rounded-2xl border border-slate-200/60 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/95",
                  GENERAL_RADIUS_CARD
                )}
              >
                <p className="text-3xl font-black tabular-nums text-primary dark:text-primary">
                  {t("yearsBadge")}
                </p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                  {t("yearsLabel")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Heading, intro, About Skills, accreditation cards – nudged down 15px */}
          <div className="space-y-4 pb-0 lg:mt-[15px]">
            <motion.h2
              custom={0}
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUpVariants}
              className={GENERAL_SECTION_TITLE}
            >
              {sectionTitle}
            </motion.h2>

            <motion.p
              custom={1}
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUpVariants}
              className={GENERAL_SECTION_DESCRIPTION}
            >
              {description.startsWith(doctorName) ? (
                <>
                  <span className="font-semibold text-primary dark:text-primary">{doctorName}</span>
                  {" "}
                  {description.slice(doctorName.length).trim()}
                </>
              ) : (
                description
              )}
            </motion.p>

            {/* About Skills - dotted underline */}
            <motion.div
              custom={2}
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUpVariants}
            >
              <h3 className="text-lg font-bold text-primary dark:text-primary border-b border-dotted border-slate-300 dark:border-slate-600 pb-1.5 inline-block">
                {t("aboutSkills")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
                {SKILL_KEYS.map((key, idx) => (
                  <motion.div
                    key={key}
                    custom={3 + idx}
                    initial="hidden"
                    animate={reduced || !isInView ? "hidden" : "visible"}
                    variants={fadeUpVariants}
                    className="flex items-center gap-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                      <CheckCircle2 className="h-4 w-4 text-primary dark:text-primary" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t(key)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Accreditation cards - two side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pb-0">
              {([GENERAL_IMAGES.aboutLogo1, GENERAL_IMAGES.aboutLogo2] as const).map((logoSrc, idx) => (
                <motion.div
                  key={idx}
                  custom={9 + idx}
                  initial="hidden"
                  animate={reduced || !isInView ? "hidden" : "visible"}
                  variants={fadeUpVariants}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 rounded-3xl border border-slate-200/60 bg-white p-3 transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/50 hover:border-primary hover:bg-primary dark:hover:border-primary dark:hover:bg-primary",
                    GENERAL_RADIUS_CARD
                  )}
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-visible">
                    <Image
                      src={logoSrc}
                      alt=""
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white transition-colors group-hover:text-white">
                      {t("accreditationYear")}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 transition-colors group-hover:text-white/90">
                      {t("accreditationOrg")}
                    </p>
                    <p className="text-xs font-semibold text-primary dark:text-primary mt-0.5 transition-colors group-hover:text-white">
                      {t("accreditationAward")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
