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
import { GENERAL_MAX_WIDTH, GENERAL_SECTION_TITLE, GENERAL_SECTION_DESCRIPTION, GENERAL_SECTION_PADDING, GENERAL_SECTION_BORDER, GENERAL_SECTION_BG, GENERAL_TITLE_DESCRIPTION_GAP, GENERAL_HEADER_CONTENT_GAP } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContentSettings } from "@/lib/validations/landing-settings";

export function GeneralWhyChoose({ whyChooseUs }: { whyChooseUs?: ContentSettings["whyChooseUs"] }) {
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
      color: "primary"
    },
    { 
      icon: Clock,
      title: t("experiencedTeam.title"), 
      desc: t("experiencedTeam.description"),
      color: "primary"
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
      className={cn("relative overflow-hidden", GENERAL_SECTION_BORDER, GENERAL_SECTION_BG, GENERAL_SECTION_PADDING)}
    >
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -z-10 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/10 blur-[120px] rounded-full"></div>

      <div className={cn("mx-auto px-4 relative z-10", GENERAL_MAX_WIDTH)}>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          
          {/* Left Content Side */}
          <div className="order-2 lg:order-1">


            <h2 className={cn(GENERAL_SECTION_TITLE, GENERAL_TITLE_DESCRIPTION_GAP)}>
              <VerticalCutReveal splitBy="words" autoStart={isInView}>
                {t("title")}
              </VerticalCutReveal>
            </h2>

            <motion.p 
              custom={1} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
              className={cn(GENERAL_SECTION_DESCRIPTION, GENERAL_HEADER_CONTENT_GAP)}
            >
              {t("description")}
            </motion.p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc, color }, idx) => (
                <motion.div
                  key={title}
                  custom={2 + idx} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                  className="group flex gap-5 rounded-3xl bg-white dark:bg-white/5 p-6 border border-slate-100 dark:border-white/10 transition-all duration-300 hover:border-primary/30 dark:hover:border-primary/30 cursor-pointer"
                >
                  <div className={cn(
                    "w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    color === "primary" ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary dark:bg-primary/20"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{title}</h4>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
                  </div>
                  <CheckCircle2 className="ml-auto w-5 h-5 shrink-0 text-slate-100 dark:text-white/5 group-hover:text-primary transition-colors" />
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
