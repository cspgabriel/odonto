"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OPHTHALMOLOGY_MAX_WIDTH,
  OPHTHALMOLOGY_FONT_HEADING,
  OPHTHALMOLOGY_RADIUS_BUTTON,
  OPHTHALMOLOGY_BUTTON_PRIMARY_BG,
  OPHTHALMOLOGY_BUTTON_SECONDARY,
  OPHTHALMOLOGY_RADIUS_CARD,
} from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentSettings } from "@/lib/validations/landing-settings";

export function OphthalmologyPricing({ pricing }: { pricing?: ContentSettings["pricing"] }) {
  const t = useTranslations("landing.pricing");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const showInView = !reduced && isInView;

  const essentialFeatures = [
    t("essentialCare.standardExam"),
    t("essentialCare.professionalCleaning"),
    t("essentialCare.digitalXrays"),
    t("essentialCare.personalConsultation"),
  ];
  const advancedFeatures = [
    t("advancedSmile.fullAestheticDesign"),
    t("advancedSmile.professionalWhitening"),
    t("advancedSmile.panoramicImaging"),
    t("advancedSmile.sedationOptions"),
    t("advancedSmile.postCareKit"),
  ];

  const cards = [
    {
      name: t("essentialCare.name"),
      description: t("essentialCare.description"),
      badge: t("essentialCare.badge"),
      features: essentialFeatures,
    },
    {
      name: t("advancedSmile.name"),
      description: t("advancedSmile.description"),
      badge: t("advancedSmile.badge"),
      features: advancedFeatures,
      highlight: true,
    },
  ];

  return (
    <section
      id="pricing"
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      <div className={cn("mx-auto px-4 relative z-10", OPHTHALMOLOGY_MAX_WIDTH)}>
        <div className="flex flex-col items-center text-center mb-10 lg:mb-12 px-4">
          <motion.div
            initial={reduced ? {} : { opacity: 0, scale: 0.9 }}
            animate={showInView ? { opacity: 1, scale: 1 } : {}}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-4"
          >
            {t("badge")}
          </motion.div>
          <h2
            className={cn(
              "text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-4",
              OPHTHALMOLOGY_FONT_HEADING
            )}
          >
            <VerticalCutReveal splitBy="words" autoStart={isInView}>
              {t("title")}
            </VerticalCutReveal>
          </h2>
        </div>

        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 20 }}
          animate={showInView ? { opacity: 1, y: 0 } : {}}
          transition={reduced ? { duration: 0 } : { delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto"
        >
          {cards.map((card, index) => (
            <Card
              key={index}
              className={cn(
                "flex flex-col text-start border-slate-200/70 dark:border-slate-800/70",
                OPHTHALMOLOGY_RADIUS_CARD,
                card.highlight
                  ? "bg-slate-50 dark:bg-slate-900/60 border-teal-200/50 dark:border-teal-800/40"
                  : "bg-white dark:bg-slate-900/40"
              )}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {card.name}
                  </CardTitle>
                  <span
                    className={cn(
                      "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      card.highlight
                        ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {card.badge}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {card.description}
                </p>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <ul className="space-y-3">
                  {card.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CircleCheck className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Link
                  href="#contact"
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 py-3.5 font-bold text-sm transition-colors",
                    OPHTHALMOLOGY_RADIUS_BUTTON,
                    index === 0
                      ? OPHTHALMOLOGY_BUTTON_SECONDARY
                      : cn(OPHTHALMOLOGY_BUTTON_PRIMARY_BG, "text-white")
                  )}
                >
                  {index === 0 ? t("bookConsultationBasic") : t("bookConsultationAdvanced")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </motion.div>

        <motion.p
          initial={reduced ? {} : { opacity: 0 }}
          animate={showInView ? { opacity: 1 } : {}}
          transition={reduced ? { duration: 0 } : { delay: 0.4 }}
          className="mt-8 lg:mt-10 text-center text-slate-500 dark:text-slate-400 text-sm px-4"
        >
          {t("disclaimer")}
        </motion.p>
      </div>
    </section>
  );
}
