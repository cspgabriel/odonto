"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Eye, Award, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING, OPHTHALMOLOGY_RADIUS_CARD } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContentSettings } from "@/lib/validations/landing-settings";

const CARD_KEYS = [
  "eyeSpecialist",
  "weAreCertified",
  "happyClients",
  "durationOfService",
] as const;

const CARD_ICONS = {
  eyeSpecialist: Eye,
  weAreCertified: Award,
  happyClients: Users,
  durationOfService: Clock,
} as const;

export function OphthalmologyWhyChoose({ whyChooseUs }: { whyChooseUs?: ContentSettings["whyChooseUs"] }) {
  const t = useTranslations("landing.whyChoose");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  const fadeUp: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 16 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" } },
  };
  const showInView = !reduced && isInView;
  const imageInitial = reduced ? {} : { opacity: 0, x: 24 };
  const imageAnimate = reduced || !isInView ? {} : { opacity: 1, x: 0 };
  const imageTrans = reduced ? { duration: 0 } : { duration: 0.6 };

  return (
    <section
      id="why-choose"
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      <div className={cn("mx-auto px-4", OPHTHALMOLOGY_MAX_WIDTH)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 lg:items-center">
          {/* Left: Title + 4 cards */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-500 dark:text-teal-400 mb-3">
              {t("badge")}
            </p>
            <motion.h2
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUp}
              custom={0}
              className={cn(
                "text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6 break-words",
                OPHTHALMOLOGY_FONT_HEADING
              )}
            >
              {t("mainTitle")}
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CARD_KEYS.map((key, idx) => {
                const Icon = CARD_ICONS[key];
                return (
                  <motion.div
                    key={key}
                    initial="hidden"
                    animate={reduced || !isInView ? "hidden" : "visible"}
                    variants={fadeUp}
                    custom={1 + idx}
                    className={cn(
                      "group flex gap-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60",
                      "bg-white dark:bg-white/5 p-4 sm:p-5 cursor-pointer transition-colors duration-200",
                      "hover:bg-teal-600 hover:border-teal-600 dark:hover:bg-teal-500 dark:hover:border-teal-500",
                      OPHTHALMOLOGY_RADIUS_CARD
                    )}
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:bg-white/20 group-hover:text-white transition-colors duration-200">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-white transition-colors duration-200">
                        {t(`${key}.title`)}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-white transition-colors duration-200">
                        {t(`${key}.description`)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: Single image card */}
          <motion.div
            initial={imageInitial}
            animate={imageAnimate}
            transition={imageTrans}
            className="relative w-full max-w-md mx-auto lg:max-w-none"
          >
            <div
              className={cn(
                "relative aspect-[4/3] sm:aspect-[5/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60",
                OPHTHALMOLOGY_RADIUS_CARD
              )}
            >
              <Image
                src="/landing/ophthalmology/images/eyecare.png"
                alt="Why choose our ophthalmology practice"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
