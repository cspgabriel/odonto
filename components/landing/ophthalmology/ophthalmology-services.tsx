"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";

import type { ContentSettings } from "@/lib/validations/landing-settings";

// Service 1→img2, 2→img3, 3→img4, 4→img5 (portrait, long at height)
const SERVICE_HOVER_IMAGES = [
  "/landing/ophthalmology/images/img2.png",
  "/landing/ophthalmology/images/img3.png",
  "/landing/ophthalmology/images/img4.png",
  "/landing/ophthalmology/images/img5.png",
] as const;

const SERVICE_HOVER_ROTATIONS = [-3, 2, -2, 3] as const; // degrees

// Service card: number on right, hover image tall/portrait, follows cursor
function ServiceCard({
  service,
  hoverImage,
  hoverRotationDeg,
  t,
}: {
  service: { tag: string; title: string; desc: string };
  hoverImage: string;
  hoverRotationDeg: number;
  t: (key: string) => string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPos({ x, y });
      setIsHovering(true);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="group relative h-full overflow-visible"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover image: portrait (long at height), follows cursor */}
      <div
        className={cn(
          "absolute z-20 w-[260px] aspect-[3/4] pointer-events-none transition-opacity duration-200",
          isHovering ? "opacity-100" : "opacity-0"
        )}
        style={{
          left: pos.x,
          top: pos.y,
          transform: `translate(-50%, -60%) rotate(${hoverRotationDeg}deg)`,
        }}
      >
        <Image
          src={hoverImage}
          alt=""
          fill
          className="object-cover rounded-xl shadow-lg border border-slate-200/60 dark:border-slate-700"
          sizes="260px"
        />
      </div>

      {/* Main card */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-6 pt-6 pb-4",
          "transition-all duration-300 hover:border-teal-300 dark:hover:border-teal-800/50 hover:shadow-md cursor-pointer"
        )}
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-1">
            <span className="text-3xl sm:text-4xl font-black text-teal-500/80 dark:text-teal-400/80 tracking-tight tabular-nums">
              {service.tag}
            </span>
            <CheckCircle2 className="w-6 h-6 text-teal-500/40 group-hover:text-teal-500 transition-colors shrink-0" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 min-h-[3.5rem] max-w-[9rem] leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {service.title}
          </h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {service.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

export function OphthalmologyServices({ services: settingsServices }: { services?: ContentSettings["services"] }) {
  const t = useTranslations("landing.services");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 30 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" } },
  };

  const containerVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0 },
    visible: reduced
      ? {}
      : { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 20 },
    visible: reduced ? {} : { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } },
  };
  const showInView = !reduced && isInView;
  const badgeInitial = reduced ? {} : { opacity: 0, scale: 0.8 };
  const badgeAnimate = showInView ? { opacity: 1, scale: 1 } : {};

  const SERVICES = [
    { tag: t("lowVisionServices.tag"), title: t("lowVisionServices.title"), desc: t("lowVisionServices.desc") },
    { tag: t("pediatricEyeCare.tag"), title: t("pediatricEyeCare.title"), desc: t("pediatricEyeCare.desc") },
    { tag: t("eyeEvaluation.tag"), title: t("eyeEvaluation.title"), desc: t("eyeEvaluation.desc") },
    { tag: t("longTermEyeHealth.tag"), title: t("longTermEyeHealth.title"), desc: t("longTermEyeHealth.desc") },
  ];

  return (
    <section
      id="services"
      ref={containerRef}
      className="relative overflow-visible py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      <div className={cn("mx-auto px-4 relative z-10", OPHTHALMOLOGY_MAX_WIDTH)}>
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-12 px-4">
          <motion.div
            initial={badgeInitial}
            animate={badgeAnimate}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4"
          >
            {t("badge")}
          </motion.div>

          <h2
            className={cn(
              "text-3xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] mb-4 break-words",
              OPHTHALMOLOGY_FONT_HEADING
            )}
          >
            <VerticalCutReveal splitBy="words" autoStart={isInView}>
              {t("title")}
            </VerticalCutReveal>
          </h2>

          <motion.p
            custom={1}
            initial="hidden"
            animate={reduced || !isInView ? "hidden" : "visible"}
            variants={fadeUpVariants}
            className="max-w-xl text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* 4 services grid – overflow-visible so hover images can show outside cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={reduced || !isInView ? "hidden" : "visible"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-visible ps-14 sm:ps-10 lg:ps-16"
        >
          {SERVICES.map((service, i) => (
            <motion.div key={service.tag} variants={itemVariants} className="h-full">
              <ServiceCard
                service={service}
                hoverImage={SERVICE_HOVER_IMAGES[i]}
                hoverRotationDeg={SERVICE_HOVER_ROTATIONS[i]}
                t={t}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
