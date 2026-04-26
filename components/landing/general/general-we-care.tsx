"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GENERAL_MAX_WIDTH, GENERAL_FONT_HEADING, GENERAL_RADIUS_CARD, GENERAL_SECTION_TITLE, GENERAL_SECTION_PADDING, GENERAL_SECTION_BG, GENERAL_HEADER_CONTENT_GAP } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContentSettings } from "@/lib/validations/landing-settings";

const IMAGE_SRC = "/landing/general/images/img5.368309aa.png";

const CARD_KEYS = ["card1Title", "card2Title", "card3Title", "card4Title"] as const;

export function GeneralWeCare({ dentalHealth: _dentalHealth }: { dentalHealth?: ContentSettings["dentalHealth"] }) {
  const t = useTranslations("landing.weCare");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 20 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" } },
  };
  const showInView = !reduced && isInView;

  return (
    <section
      ref={containerRef}
      id="we-care"
      className={cn("relative overflow-hidden", GENERAL_SECTION_PADDING, GENERAL_SECTION_BG)}
    >
      <div className={cn("mx-auto px-4 relative z-10", GENERAL_MAX_WIDTH)}>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Left: Heading + 4 cards */}
          <div className="space-y-6 order-2 lg:order-1">
            <motion.h2
              custom={0}
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUpVariants}
              className={cn(GENERAL_SECTION_TITLE, GENERAL_HEADER_CONTENT_GAP)}
            >
              {t("title").replace(t("titleUnderline"), "").trim()}
              {" "}
              <span className="border-b-2 border-primary pb-0.5">{t("titleUnderline")}</span>
            </motion.h2>

            {/* 4 cards in 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CARD_KEYS.map((titleKey, idx) => (
                <motion.div
                  key={titleKey}
                  custom={1 + idx}
                  initial="hidden"
                  animate={reduced || !isInView ? "hidden" : "visible"}
                  variants={fadeUpVariants}
                  className={cn(
                    "rounded-2xl border border-slate-200/60 bg-slate-100 p-5 transition-all dark:border-slate-700 dark:bg-slate-800/50",
                    GENERAL_RADIUS_CARD
                  )}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                    <CheckCircle2 className="h-5 w-5 text-primary" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {t(titleKey)}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("cardDescription")}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Image with 20+ Years overlay */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: 20 }}
            animate={showInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative flex justify-center lg:justify-end order-1 lg:order-2"
          >
            <div className={cn("relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800", GENERAL_RADIUS_CARD)}>
              <div className="relative aspect-square w-full">
                <Image
                  src={IMAGE_SRC}
                  alt={t("patientImageAlt")}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              {/* 20+ Years Experienced – bottom right */}
              <div
                className={cn(
                  "absolute bottom-6 right-6 z-10 rounded-2xl bg-primary px-5 py-4 shadow-none",
                  GENERAL_RADIUS_CARD
                )}
              >
                <p className="text-2xl font-black tabular-nums text-white">
                  {t("yearsBadge")}
                </p>
                <p className="text-xs font-semibold text-white/90 mt-0.5">
                  {t("yearsLabel")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
