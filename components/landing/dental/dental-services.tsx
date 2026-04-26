"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sparkles, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { DENTAL_MAX_WIDTH, DENTAL_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { BentoGridShowcase } from "@/components/ui/bento-grid";

import type { ContentSettings } from "@/lib/validations/landing-settings";

// Service card component with conditional image rendering
const ServiceCard = ({ 
  service, 
  isTall = false,
  t,
}: { 
  service: { title: string; tag: string; desc: string; popular?: boolean; showCTA?: boolean; icon?: string; image?: string }, 
  isTall?: boolean,
  t: (key: string) => string,
}) => {
  const hasImage = !!service.image;
  
  return (
    <div className={cn(
      "group relative h-full w-full overflow-hidden rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 transition-all duration-500 hover:border-rose-200 dark:hover:border-rose-900/30 cursor-pointer",
      service.popular && "ring-1 ring-rose-500/20",
      !hasImage && "p-6 flex flex-col justify-between"
    )}>
      {hasImage ? (
        <>
          <Image
            src={service.image!}
            alt={service.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ objectPosition: 'center 30%' }}
          />
          
          {/* Gradient Overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent p-5 flex flex-col justify-end transition-all duration-500"
          )}>
            {service.popular && (
              <div className="absolute top-4 right-4 bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                <Star className="w-2.5 h-2.5 fill-current" />
                {t("mostPopular")}
              </div>
            )}
            
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em] mb-1.5 block">
                {service.tag}
              </span>
              <h3 className={cn(
                "font-black text-white leading-tight transition-colors group-hover:text-rose-400",
                isTall ? "text-2xl lg:text-3xl mb-2" : "text-lg"
              )}>
                {service.title}
              </h3>
              {isTall && (
                <p className="text-white/70 text-[13px] leading-relaxed mb-4 line-clamp-3 font-medium">
                  {service.desc}
                </p>
              )}
              
              {service.showCTA && (
                <Link href="/appointment" className="inline-flex items-center gap-2 text-[10px] font-black text-white/90 hover:text-rose-400 uppercase tracking-widest transition-colors group/link">
                  {t("dentalImplants.bookNow")}
                  <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </>
      ) : (
        // Text-only card for services without images
        <>
          <div className="relative">
            {/* Badge in top-right corner */}
            <div className="absolute top-0 right-0">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] px-2 py-1 bg-rose-50 dark:bg-rose-900/20 rounded-full">
                {service.tag}
              </span>
            </div>
            
            {/* Icon at top left */}
            {service.icon ? (
              <div className="w-20 h-20 relative mb-4 mt-8">
                <Image 
                  src={service.icon} 
                  alt={service.title}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="mb-4 mt-8">
                <CheckCircle2 className="w-12 h-12 text-rose-500/30 group-hover:text-rose-500 transition-colors" />
              </div>
            )}
            
            {/* Title and description below icon - left aligned */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-500 transition-colors">
              {service.title}
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {service.desc}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export function DentalServices({ services: settingsServices }: { services?: ContentSettings["services"] }) {
  const t = useTranslations("landing.services");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 30 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" } },
  };
  const showInView = !reduced && isInView;

  const SERVICES = [
    {
      title: t("bracesAligners.title"),
      tag: t("bracesAligners.tag"),
      desc: t("bracesAligners.desc"),
      icon: "/landing/dental/images/braces.png",
    },
    {
      title: t("dentalImplants.title"),
      tag: t("dentalImplants.tag"),
      desc: t("dentalImplants.desc"),
      image: LANDING_IMAGES.service2,
      popular: true,
      showCTA: true,
    },
    {
      title: t("emergencyCare.title"),
      tag: t("emergencyCare.tag"),
      desc: t("emergencyCare.desc"),
      image: LANDING_IMAGES.service4,
    },
    {
      title: t("teethWhitening.title"),
      tag: t("teethWhitening.tag"),
      desc: t("teethWhitening.desc"),
      image: LANDING_IMAGES.service1,
    },
    {
      title: t("rootCanal.title"),
      tag: t("rootCanal.tag"),
      desc: t("rootCanal.desc"),
      icon: "/landing/dental/images/canal.png",
    },
    {
      title: t("cosmeticDentistry.title"),
      tag: t("cosmeticDentistry.tag"),
      desc: t("cosmeticDentistry.desc"),
    },
  ];

  return (
    <section 
      id="services" 
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      <div className={cn("mx-auto px-4 relative z-10", DENTAL_MAX_WIDTH)}>
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-12 px-4">
           <motion.div 
              initial={reduced ? {} : { opacity: 0, scale: 0.8 }} animate={showInView ? { opacity: 1, scale: 1 } : {}}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4"
           >
              {t("badge")}
           </motion.div>
           
           <h2 className={cn("text-3xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] mb-4 break-words", DENTAL_FONT_HEADING)}>
              <VerticalCutReveal splitBy="words" autoStart={isInView}>
                {t("title")}
              </VerticalCutReveal>
           </h2>
           
           <motion.p 
              custom={1} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
              className="max-w-xl text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
           >
              {t("subtitle")}
           </motion.p>
        </div>

        {/* Bento Grid Implementation */}
        <BentoGridShowcase
          slot1={<ServiceCard service={SERVICES[0]} t={t} />}
          slot2={<ServiceCard service={SERVICES[1]} isTall={true} t={t} />}
          slot3={<ServiceCard service={SERVICES[2]} t={t} />}
          slot4={<ServiceCard service={SERVICES[3]} t={t} />}
          slot5={<ServiceCard service={SERVICES[4]} t={t} />}
          slot6={<ServiceCard service={SERVICES[5]} t={t} />}
        />
      </div>
    </section>
  );
}
