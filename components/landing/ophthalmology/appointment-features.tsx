"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Stethoscope, Pill, HeartPulse, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export function AppointmentFeatures() {
  const t = useTranslations("landing.appointmentFeatures");
  const reduced = useReducedMotion();
  const headerInitial = reduced ? {} : { opacity: 0, y: 20 };
  const headerAnimate = reduced ? {} : { opacity: 1, y: 0 };
  const cardInitial = reduced ? {} : { opacity: 0, y: 30 };
  const cardAnimate = reduced ? {} : { opacity: 1, y: 0 };
  const cardTrans = (idx: number) => (reduced ? { duration: 0 } : { delay: idx * 0.15, duration: 0.6 });

  const FEATURES = [
    {
      num: t("feature1.num"),
      icon: Stethoscope,
      title: t("feature1.title"),
      desc: t("feature1.desc"),
      readMore: t("feature1.readMore"),
      variant: "light",
    },
    {
      num: t("feature2.num"),
      icon: Pill,
      title: t("feature2.title"),
      desc: t("feature2.desc"),
      readMore: t("feature2.readMore"),
      variant: "dark",
    },
    {
      num: t("feature3.num"),
      icon: HeartPulse,
      title: t("feature3.title"),
      desc: t("feature3.desc"),
      readMore: t("feature3.readMore"),
      variant: "light",
    },
  ];
  return (
    <section className="relative pt-16 pb-16 px-4">
      <div className={cn("mx-auto mb-16", OPHTHALMOLOGY_MAX_WIDTH)}>
        <motion.div 
          initial={headerInitial}
          animate={headerAnimate}
          className="text-center"
        >
          <h1 className={cn("text-4xl lg:text-7xl font-black text-black dark:text-white mb-6 break-words", OPHTHALMOLOGY_FONT_HEADING)}>
            {t("title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium break-words">
            {t("subtitle")}
          </p>
        </motion.div>
      </div>

      <div className={cn("mx-auto", OPHTHALMOLOGY_MAX_WIDTH)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((card, idx) => (
            <motion.div
              key={card.num}
              initial={cardInitial}
              animate={cardAnimate}
              transition={cardTrans(idx)}
              className={cn(
                "group relative rounded-[40px] p-10 flex flex-col h-full transform transition-all duration-500 hover:-translate-y-2 cursor-pointer",
                card.variant === "dark" 
                  ? "bg-black text-white" 
                  : "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60"
              )}
            >
              {/* Giant Number Background */}
              <span className={cn(
                "absolute top-6 end-10 text-[100px] font-black leading-none opacity-[0.05] pointer-events-none select-none",
                card.variant === "dark" ? "text-white" : "text-slate-400"
              )}>
                {card.num}
              </span>

              <h3 className={cn("text-3xl font-black mb-6 pe-12 leading-tight", OPHTHALMOLOGY_FONT_HEADING)}>
                {card.title}
              </h3>
              
              <div className={cn("w-full h-[1px] mb-8", card.variant === "dark" ? "bg-white/10" : "bg-slate-100 dark:bg-slate-700")}></div>
              
              <p className={cn(
                "text-lg mb-10 leading-relaxed font-medium",
                card.variant === "dark" ? "text-slate-300" : "text-slate-500"
              )}>
                {card.desc}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <div className={cn(
                  "text-xl font-bold flex items-center gap-2 transition-colors",
                  card.variant === "dark" ? "text-white" : "text-teal-500"
                )}>
                  {card.readMore}
                  <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-transform">
                     <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

                {/* Corner Icon Block */}
                <div className={cn(
                  "w-16 h-16 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110",
                  card.variant === "dark" ? "bg-white/10 text-white" : "bg-teal-50 text-teal-500 dark:bg-teal-900/20"
                )}>
                   <card.icon className="w-8 h-8" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
