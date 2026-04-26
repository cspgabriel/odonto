"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { LandingButton } from "@/components/ui/landing-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Sparkles, Star, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { DENTAL_MAX_WIDTH, DENTAL_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import PricingCards from "@/components/ui/pricing-component";
import type { ContentSettings } from "@/lib/validations/landing-settings";

export function DentalPricing({ pricing }: { pricing?: ContentSettings["pricing"] }) {
  const t = useTranslations("landing.pricing");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const noAnim = reduced ? {} : undefined;
  const showInView = !reduced && isInView;

  return (
    <section 
      id="pricing" 
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-rose-50/30 dark:bg-rose-900/10 blur-[100px] rounded-full -z-10"></div>
      
      <div className={cn("mx-auto px-4 relative z-10", DENTAL_MAX_WIDTH)}>
        
        {/* Header content */}
        <div className="flex flex-col items-center text-center mb-8 md:mb-12 px-4">
           <motion.div 
              initial={reduced ? {} : { opacity: 0, scale: 0.8 }} animate={showInView ? { opacity: 1, scale: 1 } : noAnim ?? {}}
              className="inline-flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 md:mb-6"
           >
              {t("badge")}
           </motion.div>
           
           <h2 className={cn("text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6 md:mb-8 break-words", DENTAL_FONT_HEADING)}>
              <VerticalCutReveal splitBy="words" autoStart={isInView}>
                {t("title")}
              </VerticalCutReveal>
           </h2>
        </div>

        {/* New Pricing Component */}
        <motion.div
           initial={reduced ? {} : { opacity: 0, y: 20 }}
           animate={showInView ? { opacity: 1, y: 0 } : noAnim ?? {}}
           transition={reduced ? { duration: 0 } : { delay: 0.3 }}
        >
          <PricingCards />
        </motion.div>

        {/* Note */}
        <motion.p 
           initial={reduced ? {} : { opacity: 0 }} animate={showInView ? { opacity: 1 } : noAnim ?? {}}
           className="mt-8 md:mt-12 text-center text-slate-500 dark:text-slate-400 font-bold text-xs md:text-sm px-4"
        >
          {t("disclaimer")}
        </motion.p>
      </div>
    </section>
  );
}
