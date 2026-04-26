"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { LandingButton } from "@/components/ui/landing-button";
import { CheckCircle2, Star, Quote, Award, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import type { ContentSettings } from "@/lib/validations/landing-settings";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { DENTAL_MAX_WIDTH, DENTAL_FONT_HEADING } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export function DentalAboutDoctor({ aboutDoctor }: { aboutDoctor?: ContentSettings["aboutDoctor"] }) {
  const t = useTranslations("landing.aboutDoctor");
  const locale = useLocale();
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 30 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15, ease: "easeOut" } },
  };
  const showInView = !reduced && isInView;

  // Prefer translations for non-English locales so content is localized; use DB override for English
  const useDbForText = locale === "en";
  const doctorName  = (useDbForText && aboutDoctor?.doctorName)  ? aboutDoctor.doctorName  : t("doctorName");
  const doctorTitle = (useDbForText && aboutDoctor?.doctorTitle) ? aboutDoctor.doctorTitle : t("leadDentalDirector");
  const doctorImage = aboutDoctor?.doctorImageUrl || LANDING_IMAGES.aboutDoctor;
  const sectionTitle = (useDbForText && aboutDoctor?.sectionTitle) ? aboutDoctor.sectionTitle : t("title");

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
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_20%_20%,_rgba(225,29,72,0.03)_0%,_transparent_50%)]"></div>

      <div className={cn("mx-auto px-4 relative z-10", DENTAL_MAX_WIDTH)}>
        <div className="grid gap-8 md:gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left: Content Side */}
          <div className="lg:col-span-7 order-2 lg:order-1">


            <h2 className={cn("text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-2 break-words", DENTAL_FONT_HEADING)}>
              <VerticalCutReveal splitBy="words" autoStart={isInView}>
                {sectionTitle}
              </VerticalCutReveal>
            </h2>
            <motion.p 
               initial={reduced ? {} : { opacity: 0, x: -20 }} animate={showInView ? { opacity: 1, x: 0 } : {}} transition={reduced ? { duration: 0 } : { delay: 0.4 }}
               className="text-2xl font-black text-rose-500 mb-8 font-serif italic"
            >
              {doctorName}
            </motion.p>
            
            <motion.div 
               custom={1} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
               className="relative pl-10 mb-8"
            >
               <Quote className="absolute left-0 top-0 w-8 h-8 text-rose-500/20" />
               <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                 {t("quote")}
               </p>
            </motion.div>

            <motion.p
              custom={2} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
              className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium"
            >
              {t("description")}
            </motion.p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-12">
               {BULLETS.map((b, idx) => (
                  <motion.div 
                    key={idx}
                    custom={3+idx} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                    className="flex items-center gap-3"
                  >
                     <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                     </div>
                     <span className="text-slate-700 dark:text-slate-200 font-bold text-sm tracking-tight">{b}</span>
                  </motion.div>
               ))}
            </div>

            <motion.div
               custom={7} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
               className="mt-12"
            >
               <LandingButton 
                size="default" 
                className="rounded-xl px-10 h-14 bg-rose-500 text-white hover:bg-rose-600 transition-all font-bold text-base shadow-lg shadow-rose-500/20" 
                asChild
               >
                 <Link href="#contact">{t("scheduleConsultation")}</Link>
               </LandingButton>
            </motion.div>
          </div>

          {/* Right: Profile Card Side */}
          <div className="lg:col-span-5 relative order-1 lg:order-2">
            <motion.div
               initial={reduced ? {} : { opacity: 0, scale: 0.9 }} animate={showInView ? { opacity: 1, scale: 1 } : {}} transition={reduced ? { duration: 0 } : { duration: 0.8 }}
               className="relative"
            >
              {/* Decorative Frame */}
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-dashed border-rose-500/20 rounded-[32px] -z-10"></div>
              
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 group">
                <Image
                  src={doctorImage}
                  alt={doctorName}
                  fill
                  className="object-cover object-top transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 448px"
                />
                
                {/* Overlay Badge */}
                <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-white/10">
                    <div className="flex items-center justify-between pointer-events-none">
                       <div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white">{doctorName}</h4>
                          <p className="text-xs text-rose-500 font-bold uppercase tracking-widest">{doctorTitle}</p>
                       </div>
                       <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                </div>
              </div>


            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
