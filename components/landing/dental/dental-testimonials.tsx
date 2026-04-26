"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { DENTAL_MAX_WIDTH, DENTAL_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContentSettings } from "@/lib/validations/landing-settings";

export function DentalTestimonials({ testimonials }: { testimonials?: ContentSettings["testimonials"] }) {
  const t = useTranslations("landing.testimonials");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const initial = reduced ? {} : { opacity: 0, scale: 0.8 };
  const animateInView = reduced || !isInView ? {} : { opacity: 1, scale: 1 };
  const initialUp = reduced ? {} : { opacity: 0, y: 20 };
  const animateUp = reduced || !isInView ? {} : { opacity: 1, y: 0 };
  const transition = reduced ? { duration: 0 } : { duration: 0.6, delay: 0.2 };
  const transitionCard = (i: number) => (reduced ? { duration: 0 } : { duration: 0.5, delay: i * 0.1 });

  const TESTIMONIALS = [
    {
      content: t("testimonial1.content"),
      name: t("testimonial1.name"),
      role: t("testimonial1.role"),
      stars: 5,
      avatar: "https://tailus.io/images/reviews/shekinah.webp",
    },
    {
      content: t("testimonial2.content"),
      name: t("testimonial2.name"),
      role: t("testimonial2.role"),
      stars: 5,
      avatar: "https://tailus.io/images/reviews/jonathan.webp",
    },
    {
      content: t("testimonial3.content"),
      name: t("testimonial3.name"),
      role: t("testimonial3.role"),
      stars: 5,
      avatar: "https://tailus.io/images/reviews/yucel.webp",
    },
    {
      content: t("testimonial4.content"),
      name: t("testimonial4.name"),
      role: t("testimonial4.role"),
      stars: 4,
      avatar: "https://tailus.io/images/reviews/rodrigo.webp",
    },
    {
      content: t("testimonial5.content"),
      name: t("testimonial5.name"),
      role: t("testimonial5.role"),
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    },
    {
      content: t("testimonial6.content"),
      name: t("testimonial6.name"),
      role: t("testimonial6.role"),
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    }
  ];

  return (
    <section 
      id="testimonials" 
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      <div className={cn("mx-auto px-4 relative z-10", DENTAL_MAX_WIDTH)}>
        
        {/* Header content */}
        <div className="flex flex-col items-center text-center mb-12 md:mb-16 px-4">
           <motion.div 
              initial={initial} 
              animate={animateInView}
              className="inline-flex items-center px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6"
           >
              {t("badge")}
           </motion.div>
           
           <h2 className={cn("text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] mb-4 md:mb-6 break-words", DENTAL_FONT_HEADING)}>
              <VerticalCutReveal splitBy="words" autoStart={isInView}>
                {t("title")}
              </VerticalCutReveal>
           </h2>

           <motion.p 
             initial={initialUp}
             animate={animateUp}
             transition={transition}
             className="max-w-2xl text-sm md:text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed break-words"
           >
             {t("subtitle")}
           </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, index) => (
            <motion.div 
              key={index}
              initial={initialUp}
              animate={animateUp}
              transition={transitionCard(index)}
              className="bg-white dark:bg-slate-900 ring-slate-900/10 dark:ring-white/10 rounded-2xl md:rounded-3xl border border-transparent p-5 md:p-6 ring-1 transition-all duration-300 hover:ring-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/10 group cursor-pointer"
            >
              <div className="flex gap-1 mb-4" aria-label={`${t.stars} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'size-3.5 transition-colors duration-300',
                      i < t.stars
                        ? 'fill-rose-500 stroke-rose-500'
                        : 'fill-slate-200 dark:fill-slate-800 stroke-transparent'
                    )}
                  />
                ))}
              </div>

              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm font-medium leading-relaxed italic">
                "{t.content}"
              </p>

              <div className="flex items-center gap-3">
                <Avatar className="ring-slate-900/5 dark:ring-white/10 size-10 border border-transparent shadow shadow-slate-200/50 dark:shadow-none ring-1 bg-slate-50 dark:bg-slate-800">
                  <AvatarImage src={t.avatar} alt={t.name} />
                  <AvatarFallback className="font-bold text-xs bg-rose-50 text-rose-500">{t.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-slate-900 dark:text-white text-[13px] font-black uppercase tracking-tight">{t.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-500 text-[10px] font-black uppercase tracking-widest">{t.role}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

