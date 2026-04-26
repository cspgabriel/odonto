"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { ImageComparisonSlider } from "@/components/ui/image-comparison-slider";
import { cn } from "@/lib/utils";
import type { ContentSettings } from "@/lib/validations/landing-settings";

export function OphthalmologySmileComparison({ smileComparison }: { smileComparison?: ContentSettings["smileComparison"] }) {
  const t = useTranslations("landing.smileComparison");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const initialY = reduced ? {} : { opacity: 0, y: 40 };
  const animateY = reduced || !isInView ? {} : { opacity: 1, y: 0 };
  const initialO = reduced ? {} : { opacity: 0 };
  const animateO = reduced || !isInView ? {} : { opacity: 1 };
  const trans = reduced ? { duration: 0 } : { duration: 0.8, ease: "easeOut" as const };
  const transDelayed = reduced ? { duration: 0 } : { delay: 0.8 };

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      <div className={cn("mx-auto px-4 relative z-10", OPHTHALMOLOGY_MAX_WIDTH)}>
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 md:mb-8">
            <h2 className={cn("text-2xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight px-4 break-words", OPHTHALMOLOGY_FONT_HEADING)}>
              <VerticalCutReveal splitBy="words" autoStart={isInView}>
                {t("title")}
              </VerticalCutReveal>
            </h2>
        </div>

        {/* Comparison Showcase */}
        <div className="mt-6 md:mt-8 flex justify-center">
          <motion.div 
            initial={initialY}
            animate={animateY}
            transition={trans}
            className="group relative w-full max-w-4xl overflow-hidden rounded-3xl md:rounded-[40px] bg-white dark:bg-slate-800 border-4 md:border-8 border-white dark:border-slate-800 shadow-2xl shadow-teal-500/5"
          >
            <ImageComparisonSlider 
              beforeImage={smileComparison?.beforeImageUrl || LANDING_IMAGES.comparisonBefore}
              afterImage={smileComparison?.afterImageUrl || LANDING_IMAGES.comparisonAfter}
              altBefore={t("beforeLabel")}
              altAfter={t("afterLabel")}
            />
          </motion.div>
        </div>

        {/* Caption */}
        <motion.p 
           initial={initialO} 
           animate={animateO}
           transition={transDelayed}
           className="mt-6 md:mt-10 text-center text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium italic px-4"
        >
          {t("disclaimer")}
        </motion.p>
      </div>
    </section>
  );
}
