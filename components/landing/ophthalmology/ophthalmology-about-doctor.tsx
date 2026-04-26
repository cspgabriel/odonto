"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentSettings } from "@/lib/validations/landing-settings";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING, OPHTHALMOLOGY_RADIUS_BUTTON, OPHTHALMOLOGY_BUTTON_PRIMARY_BG } from "./config";

export function OphthalmologyAboutDoctor({ aboutDoctor }: { aboutDoctor?: ContentSettings["aboutDoctor"] }) {
  const t = useTranslations("landing.aboutDoctor");
  const locale = useLocale();
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 20 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" } },
  };
  const showInView = !reduced && isInView;
  const imageInitial = reduced ? {} : { opacity: 0, y: 24 };
  const imageAnimate = reduced || !isInView ? {} : { opacity: 1, y: 0 };
  const imageTrans = reduced ? { duration: 0 } : { duration: 0.6 };

  const useDbForText = locale === "en";
  const doctorName =
    (useDbForText && aboutDoctor?.doctorName) ? aboutDoctor.doctorName : t("doctorName");
  const doctorTitle =
    (useDbForText && aboutDoctor?.doctorTitle) ? aboutDoctor.doctorTitle : t("leadDentalDirector");
  const OPHTHA_DOCTOR_IMAGE = "/landing/ophthalmology/images/doc.png";
  const doctorImage = aboutDoctor?.doctorImageUrl || OPHTHA_DOCTOR_IMAGE;
  const sectionTitle =
    (useDbForText && aboutDoctor?.sectionTitle) ? aboutDoctor.sectionTitle : t("title");

  const BULLETS = [
    (useDbForText && aboutDoctor?.checkmark1) ? aboutDoctor.checkmark1 : t("bullet1"),
    (useDbForText && aboutDoctor?.checkmark2) ? aboutDoctor.checkmark2 : t("bullet2"),
    (useDbForText && aboutDoctor?.checkmark3) ? aboutDoctor.checkmark3 : t("bullet3"),
    (useDbForText && aboutDoctor?.checkmark4) ? aboutDoctor.checkmark4 : t("bullet4"),
  ].filter(Boolean);

  return (
    <section
      id="about"
      ref={containerRef}
      className="relative overflow-hidden py-14 lg:py-20 bg-white dark:bg-slate-950"
    >
      <div className={cn("mx-auto px-4 relative z-10", OPHTHALMOLOGY_MAX_WIDTH)}>
        <div className="grid gap-10 lg:gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left: Doctor image card */}
          <motion.div
            initial={imageInitial}
            animate={imageAnimate}
            transition={imageTrans}
            className="relative order-1"
          >
            <div className="relative aspect-[4/5] max-h-[560px] w-full overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-xl">
              <Image
                src={doctorImage}
                alt={doctorName}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-12">
                <h3 className="text-xl font-bold text-white">{doctorName}</h3>
                <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider mt-0.5">
                  {doctorTitle}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <div className="order-2">
            <h2
              className={cn(
                "text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-slate-900 dark:text-white leading-[1.15] mb-6",
                OPHTHALMOLOGY_FONT_HEADING
              )}
            >
              <VerticalCutReveal splitBy="words" autoStart={isInView}>
                {sectionTitle}
              </VerticalCutReveal>
            </h2>

            {/* Mission quote */}
            <motion.div
              custom={0}
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUpVariants}
              className="ps-5 border-s-4 border-primary/40 mb-6"
            >
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed font-medium">
                {t("quote")}
              </p>
            </motion.div>

            <motion.p
              custom={1}
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUpVariants}
              className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed mb-8"
            >
              {t("description")}
            </motion.p>

            {/* Bullets */}
            <ul className="space-y-3 mb-10">
              {BULLETS.map((b, idx) => (
                <motion.li
                  key={idx}
                  custom={2 + idx}
                  initial="hidden"
                  animate={reduced || !isInView ? "hidden" : "visible"}
                  variants={fadeUpVariants}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {b}
                  </span>
                </motion.li>
              ))}
            </ul>

            <motion.div
              custom={6}
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUpVariants}
            >
              <Link
                href="#contact"
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-8 h-12 font-bold text-sm text-white transition-colors",
                  OPHTHALMOLOGY_RADIUS_BUTTON,
                  OPHTHALMOLOGY_BUTTON_PRIMARY_BG
                )}
              >
                {t("scheduleConsultation")}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
