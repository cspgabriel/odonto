"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { GENERAL_MAX_WIDTH, GENERAL_SECTION_TITLE, GENERAL_SECTION_DESCRIPTION, GENERAL_SECTION_PADDING, GENERAL_SECTION_BORDER, GENERAL_SECTION_BG, GENERAL_TITLE_DESCRIPTION_GAP, GENERAL_HEADER_CONTENT_GAP, GENERAL_RADIUS_CARD, GENERAL_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContentSettings } from "@/lib/validations/landing-settings";

type TestimonialItem = {
  content: string;
  name: string;
  role: string;
  stars: number;
  avatar: string;
};

function TestimonialsColumn({
  className,
  testimonials,
  duration = 15,
  reduced,
}: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
  reduced: boolean;
}) {
  if (reduced) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        {testimonials.map((t, i) => (
          <TestimonialCard key={i} item={t} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        animate={{ y: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-4 pb-4"
      >
        {[1, 2].map((copy) => (
          <React.Fragment key={copy}>
            {testimonials.map((t, i) => (
              <TestimonialCard key={`${copy}-${i}`} item={t} />
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <div
      className={cn(
        "w-full max-w-xs rounded-3xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-primary/10 dark:border-slate-800/60 dark:bg-slate-900",
        GENERAL_RADIUS_CARD
      )}
    >
      <div className="flex gap-1 mb-3" aria-label={`${item.stars} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i < item.stars ? "fill-primary stroke-primary" : "fill-slate-200 dark:fill-slate-700 stroke-transparent"
            )}
          />
        ))}
      </div>
      <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed break-words">
        "{item.content}"
      </p>
      <div className="flex items-center gap-3 mt-5">
        <Avatar className="size-10 rounded-full border-2 border-slate-200/60 dark:border-slate-700 shrink-0">
          <AvatarImage src={item.avatar} alt={item.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {item.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold text-slate-900 dark:text-white tracking-tight leading-5 truncate", GENERAL_FONT_HEADING)}>
            {item.name}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-5 tracking-tight truncate">
            {item.role}
          </p>
        </div>
      </div>
    </div>
  );
}

export function GeneralTestimonials({ testimonials: _cmsTestimonials }: { testimonials?: ContentSettings["testimonials"] }) {
  const t = useTranslations("landing.testimonials");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const initial = reduced ? {} : { opacity: 0, y: 20 };
  const animateInView = reduced || !isInView ? {} : { opacity: 1, y: 0 };

  const TESTIMONIALS: TestimonialItem[] = [
    { content: t("testimonial1.content"), name: t("testimonial1.name"), role: t("testimonial1.role"), stars: 5, avatar: "https://tailus.io/images/reviews/shekinah.webp" },
    { content: t("testimonial2.content"), name: t("testimonial2.name"), role: t("testimonial2.role"), stars: 5, avatar: "https://tailus.io/images/reviews/jonathan.webp" },
    { content: t("testimonial3.content"), name: t("testimonial3.name"), role: t("testimonial3.role"), stars: 5, avatar: "https://tailus.io/images/reviews/yucel.webp" },
    { content: t("testimonial4.content"), name: t("testimonial4.name"), role: t("testimonial4.role"), stars: 4, avatar: "https://tailus.io/images/reviews/rodrigo.webp" },
    { content: t("testimonial5.content"), name: t("testimonial5.name"), role: t("testimonial5.role"), stars: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" },
    { content: t("testimonial6.content"), name: t("testimonial6.name"), role: t("testimonial6.role"), stars: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
  ];

  const col1 = TESTIMONIALS.slice(0, 2);
  const col2 = TESTIMONIALS.slice(2, 4);
  const col3 = TESTIMONIALS.slice(4, 6);

  return (
    <section
      id="testimonials"
      ref={containerRef}
      className={cn("relative overflow-hidden", GENERAL_SECTION_BORDER, GENERAL_SECTION_BG, GENERAL_SECTION_PADDING)}
    >
      <div className={cn("mx-auto px-4 relative z-10", GENERAL_MAX_WIDTH)}>
        {/* Header – same section title + subtitle style as rest of landing */}
        <div className={cn("flex flex-col items-center text-center px-4", GENERAL_HEADER_CONTENT_GAP)}>
          <h2 className={cn(GENERAL_SECTION_TITLE, GENERAL_TITLE_DESCRIPTION_GAP)}>
            <VerticalCutReveal splitBy="words" autoStart={isInView}>
              {t("title")}
            </VerticalCutReveal>
          </h2>
          <motion.p
            initial={initial}
            animate={animateInView}
            transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
            className={cn("max-w-2xl break-words", GENERAL_SECTION_DESCRIPTION)}
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* Scrolling columns – mask fades top/bottom */}
        <motion.div
          initial={initial}
          animate={animateInView}
          transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.1 }}
          className="flex justify-center gap-4 md:gap-6 max-h-[720px] overflow-hidden"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          }}
        >
          <TestimonialsColumn testimonials={col1} duration={15} reduced={reduced} />
          <TestimonialsColumn testimonials={col2} duration={19} reduced={reduced} className="hidden md:flex" />
          <TestimonialsColumn testimonials={col3} duration={17} reduced={reduced} className="hidden lg:flex" />
        </motion.div>
      </div>
    </section>
  );
}
