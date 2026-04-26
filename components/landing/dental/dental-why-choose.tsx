"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { LandingButton } from "@/components/ui/landing-button";
import { CheckCircle2, Star, ShieldCheck, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { DENTAL_MAX_WIDTH, DENTAL_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContentSettings } from "@/lib/validations/landing-settings";

export function DentalWhyChoose({ whyChooseUs }: { whyChooseUs?: ContentSettings["whyChooseUs"] }) {
  const IMAGES = [
    LANDING_IMAGES.whyChoose,
    LANDING_IMAGES.service2,
    LANDING_IMAGES.service3,
  ];

  const t = useTranslations("landing.whyChoose");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const FEATURES = [
    { 
      icon: ShieldCheck,
      title: t("latestTechnology.title"), 
      desc: t("latestTechnology.description"),
      color: "rose"
    },
    { 
      icon: Clock,
      title: t("experiencedTeam.title"), 
      desc: t("experiencedTeam.description"),
      color: "blue"
    },
  ];

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 30 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15, ease: "easeOut" } },
  };
  const slideX = reduced ? {} : { opacity: 0, x: 40 };
  const slideXAnim = reduced || !isInView ? {} : { opacity: 1, x: 0 };
  const slideY = reduced ? {} : { opacity: 0, y: 40 };
  const slideYAnim = reduced || !isInView ? {} : { opacity: 1, y: 0 };
  const trans08 = reduced ? { duration: 0 } : { duration: 0.8 };
  const trans08d = (d: number) => (reduced ? { duration: 0 } : { delay: d, duration: 0.8 });

  return (
    <section 
      id="why-choose" 
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -z-10 w-[500px] h-[500px] bg-rose-50/20 dark:bg-rose-900/10 blur-[120px] rounded-full"></div>

      <div className={cn("mx-auto px-4 relative z-10", DENTAL_MAX_WIDTH)}>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          
          {/* Left Content Side */}
          <div className="order-2 lg:order-1">


            <h2 className={cn("text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 break-words", DENTAL_FONT_HEADING)}>
              <VerticalCutReveal splitBy="words" autoStart={isInView}>
                {t("title")}
              </VerticalCutReveal>
            </h2>

            <motion.p 
              custom={1} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
              className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium"
            >
              {t("description")}
            </motion.p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc, color }, idx) => (
                <motion.div
                  key={title}
                  custom={2 + idx} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                  className="group flex gap-5 rounded-3xl bg-white dark:bg-white/5 p-6 border border-slate-100 dark:border-white/10 transition-all duration-300 hover:border-rose-200 dark:hover:border-rose-900/30 cursor-pointer"
                >
                  <div className={cn(
                    "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                    color === "rose" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500 dark:bg-blue-900/20"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-rose-500 transition-colors">{title}</h4>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
                  </div>
                  <CheckCircle2 className="ml-auto w-5 h-5 shrink-0 text-slate-100 dark:text-white/5 group-hover:text-rose-500 transition-colors" />
                </motion.div>
              ))}
            </div>


          </div>

          {/* Right Image Side (Collage) */}
          <div className="order-1 lg:order-2 relative">
             <div className="grid grid-cols-12 gap-4">
                <motion.div 
                   initial={slideX} animate={slideXAnim} transition={trans08}
                   className="col-span-12"
                >
                   <div className="relative aspect-[16/9] rounded-[40px] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
                      <Image src={IMAGES[0]} alt={t("modernFacilities")} fill className="object-cover" />
                      <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
                         <span className="text-white font-black text-2xl">{t("modernFacilities")}</span>
                      </div>
                   </div>
                </motion.div>

                <motion.div 
                   initial={slideY} animate={slideYAnim} transition={trans08d(0.2)}
                   className="col-span-6"
                >
                   <div className="relative aspect-square rounded-[32px] overflow-hidden shadow-xl border-4 border-white dark:border-slate-800">
                      <Image src={IMAGES[1]} alt={t("treatmentImageAlt")} fill className="object-cover" />
                   </div>
                </motion.div>

                <motion.div 
                   initial={slideY} animate={slideYAnim} transition={trans08d(0.4)}
                   className="col-span-6"
                >
                   <div className="relative aspect-square rounded-[32px] overflow-hidden shadow-xl border-4 border-white dark:border-slate-800">
                      <Image src={IMAGES[2]} alt={t("smileImageAlt")} fill className="object-cover" />
                   </div>
                </motion.div>
             </div>


          </div>

        </div>
      </div>
    </section>
  );
}
