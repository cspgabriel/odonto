"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { LandingButton } from "@/components/ui/landing-button";
import { Play, Star, Stethoscope, Pill, UserPlus, CheckCircle2, HeartPulse, UserRoundCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { DENTAL_MAX_WIDTH, DENTAL_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContentSettings } from "@/lib/validations/landing-settings";

const IMAGES = {
  main: "/landing/dental/images/img5.a7625e9b.webp", // female patient
  videoBg: "/landing/dental/images/img6.b1722ab6.webp",
  avatar1: "/landing/dental/images/avatar1.22bb7fef.webp",
  avatar2: "/landing/dental/images/avatar2.faf6f9cf.webp",
  avatar3: "/landing/dental/images/avatar3.7024dc80.webp",
  avatar4: "/landing/dental/images/avatar4.1f1f95dc.webp",
};

export function DentalWeCare({ dentalHealth }: { dentalHealth?: ContentSettings["dentalHealth"] }) {
  const t = useTranslations("landing.weCare");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const SERVICES = [
    t("teethWhitening"),
    t("modernAnesthetic"),
    t("qualityBrackets"),
    t("rootCanal"),
  ];

  const COUNTERS = [
    { 
      value: "45k", 
      label: t("happyPatients"), 
      color: "text-rose-600", 
      bg: "bg-[#FFF2F6]", 
      accent: "bg-rose-100" 
    },
    { 
      value: "200+", 
      label: t("specialists"), 
      color: "text-cyan-600", 
      bg: "bg-[#F2FBFF]", 
      accent: "bg-cyan-100" 
    },
    { 
      value: "150+", 
      label: t("winningAwards"), 
      color: "text-amber-600", 
      bg: "bg-[#FFF9F2]", 
      accent: "bg-amber-100" 
    },
  ];

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 30 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15, ease: "easeOut" } },
  };

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      {/* Hexagon Pattern Background */}
      <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.02]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cpath fill='%23e11d48' fill-opacity='1' d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75V16.75l12.99-7.5zM3 17.91v12.68l10.99 6.34 11-6.34V17.91L14 11.57 3 17.91zM0 15l12.98-7.5V0h2v7.5L28 15v15l-12.98 7.5V49h-2v-11.5L0 30V15zm14 10.38L2.36 17v15L14 38.71 25.64 32V17L14 25.38z'/%3E%3C/svg%3E")` }}>
      </div>
      
      {/* Subtle Pink Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -z-10 w-96 h-96 bg-rose-100/30 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 -z-10 w-80 h-80 bg-rose-50/20 blur-[100px] rounded-full"></div>

      <div className={cn("mx-auto px-4 relative z-10", DENTAL_MAX_WIDTH)}>
        
        {/* TOP SECTION: IMAGE | TEXT | COUNTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* LEFT: Main Image with floaters & squiggles */}
          <div className="md:col-span-1 lg:col-span-5 relative order-1 md:order-1">
            <motion.div 
              initial="hidden"
              animate={reduced || !isInView ? "hidden" : "visible"}
              variants={fadeUpVariants}
              custom={0}
              className="relative"
            >
              {/* Squiggle Top Left */}
              <div className="absolute -top-6 -left-6 z-0 text-rose-500/20 w-32 h-32 animate-pulse">
                <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round">
                   <path d="M20,60 Q60,20 100,60 T180,60" />
                </svg>
              </div>

              {/* Main Circular-ish Image */}
              <div className="relative z-10 rounded-[60px] sm:rounded-[80px] overflow-hidden border-8 border-white dark:border-slate-900">
                <Image
                  src={IMAGES.main}
                  alt={t("patientImageAlt")}
                  width={800}
                  height={1000}
                  className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </div>




              {/* Squiggle Bottom Right */}
              <div className="absolute -bottom-8 -right-8 z-0 text-rose-500/20 w-40 h-40">
                <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                   <path d="M40,160 Q100,100 160,160" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* MIDDLE: Text Content */}
          <div className="md:col-span-1 lg:col-span-5 pt-4 order-2 md:order-2">
            <h2 className={cn("text-3xl md:text-4xl lg:text-[56px] font-black text-[#2D2D5F] dark:text-white leading-[1.3] md:leading-[1.25] lg:leading-[1.2] mb-4 md:mb-6 break-words", DENTAL_FONT_HEADING)}>
              <VerticalCutReveal
                 splitBy="words"
                 staggerFrom="first"
                 autoStart={isInView}
              >
                {t("title")}
              </VerticalCutReveal>
            </h2>



            <motion.p 
              custom={2} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
              className="text-base md:text-lg text-slate-500 dark:text-slate-400 mb-6 md:mb-10 leading-relaxed font-medium break-words"
            >
              {t("description")}
            </motion.p>

            {/* Dark Video/Services Card */}
            <motion.div 
               custom={3} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
               className="bg-[#3B387E]/5 dark:bg-white/5 rounded-2xl md:rounded-[32px] p-4 md:p-6 relative overflow-hidden group border border-slate-100 dark:border-white/5"
            >
               <div className="relative z-10">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICES.map(s => (
                       <li key={s} className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="font-semibold text-sm">{s}</span>
                       </li>
                    ))}
                  </ul>
               </div>
            </motion.div>
          </div>

          {/* RIGHT: Counters Column */}
          <div className="md:col-span-2 lg:col-span-2 grid grid-cols-2 md:grid-cols-1 lg:grid-cols-1 gap-4 md:gap-6 h-full order-3">
             {COUNTERS.map((c, i) => (
                <motion.div 
                  key={c.label} 
                  custom={4+i} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                  className={cn("rounded-2xl md:rounded-3xl p-4 md:p-6 text-center flex flex-col justify-center items-center transition-all border border-slate-100 dark:border-slate-800", c.bg)}
                >
                   <span className={cn("text-3xl md:text-4xl font-black mb-1", c.color)}>{c.value}</span>
                   <span className={cn("text-xs md:text-[13px] font-bold dark:text-slate-400 uppercase tracking-wider opacity-60", c.color)}>{c.label}</span>
                </motion.div>
             ))}
          </div>
        </div>

        {/* BOTTOM SECTION REMOVED */}

      </div>


    </section>
  );
}
