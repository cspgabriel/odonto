"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { Facebook, Linkedin, Instagram, ArrowRight, UserCheck } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { DENTAL_MAX_WIDTH, DENTAL_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);

const SOCIAL = [
  { Icon: Facebook, label: "Facebook", hoverColor: "hover:bg-[#1877F2] hover:text-white dark:hover:bg-[#1877F2] dark:hover:text-white" },
  { Icon: XIcon, label: "X", hoverColor: "hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" },
  { Icon: Linkedin, label: "LinkedIn", hoverColor: "hover:bg-[#0A66C2] hover:text-white dark:hover:bg-[#0A66C2] dark:hover:text-white" },
  { Icon: Instagram, label: "Instagram", hoverColor: "hover:bg-[#E4405F] hover:text-white dark:hover:bg-[#E4405F] dark:hover:text-white" },
];

export function DentalHighlyQualified() {
  const t = useTranslations("landing.highlyQualified");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const DOCTORS = [
    { name: t("doctors.doctor1.name"), specialty: t("doctors.doctor1.specialty"), image: LANDING_IMAGES.doctor1 },
    { name: t("doctors.doctor2.name"), specialty: t("doctors.doctor2.specialty"), image: LANDING_IMAGES.doctor2 },
    { name: t("doctors.doctor3.name"), specialty: t("doctors.doctor3.specialty"), image: LANDING_IMAGES.doctor3 },
    { name: t("doctors.doctor4.name"), specialty: t("doctors.doctor4.specialty"), image: LANDING_IMAGES.doctor4 },
  ];

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 30 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" } },
  };
  const showInView = !reduced && isInView;
  const cardInitial = reduced ? {} : { opacity: 0, scale: 0.8, x: isRTL ? -20 : 20 };
  const cardAnimate = reduced || !isInView ? {} : { opacity: 1, scale: 1, x: 0 };
  const cardTransition = reduced ? { duration: 0 } : { delay: 0.8, duration: 0.5 };

  return (
    <section
      id="doctors"
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      {/* Decorative background shapes */}
      <div className={cn(
        "absolute -z-10 bg-rose-50/50 dark:bg-rose-900/10 blur-[120px] rounded-full",
        isRTL ? "top-0 left-0 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2" : "top-0 right-0 w-[600px] h-[600px] translate-x-1/2 -translate-y-1/2"
      )}></div>
      <div className={cn(
        "absolute -z-10 bg-blue-50/50 dark:bg-blue-900/10 blur-[100px] rounded-full",
        isRTL ? "bottom-0 right-0 w-[400px] h-[400px] translate-x-1/2 translate-y-1/2" : "bottom-0 left-0 w-[400px] h-[400px] -translate-x-1/2 translate-y-1/2"
      )}></div>

      <div className={cn("mx-auto px-4 sm:px-6 relative z-10", DENTAL_MAX_WIDTH)}>
        <div className="grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-12 lg:items-start">
          
          {/* Intro & Doctor Grid - Renders first in RTL, second in LTR */}
          {isRTL && (
            <div className="lg:col-span-7 lg:pr-6">
              <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
                 <div className="max-w-md">
                   <h2 className={cn("text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] break-words", DENTAL_FONT_HEADING)}>
                     <VerticalCutReveal splitBy="words" autoStart={isInView}>
                       {t("title")}
                     </VerticalCutReveal>
                   </h2>
                 </div>
              </div>

              <motion.p 
                custom={1} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6 sm:mb-8 lg:mb-10"
              >
                {t("description")}
              </motion.p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {DOCTORS.map(({ name, specialty, image }, idx) => (
                  <motion.div
                    key={name}
                    custom={2 + idx} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                    className="group relative bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700/50 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 sm:gap-5 flex-row-reverse">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-700">
                        <Image
                          src={image}
                          alt={t("doctorImageAlt")}
                          fill
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 80px, 96px"
                        />
                      </div>
                      <div className="flex-1 text-right">
                        <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors break-words">{name}</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm mb-2 sm:mb-3 break-words">{specialty}</p>
                        
                        <div className="flex items-center gap-2 flex-row-reverse justify-end">
                           {SOCIAL.slice(0, 3).map(({ Icon, label, hoverColor }) => (
                             <button key={label} className={cn(
                               "w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all duration-300 cursor-pointer",
                               "hover:text-white",
                               hoverColor
                             )}>
                                <Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                             </button>
                           ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Decoration */}
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom Link */}
              <motion.div 
                 custom={7} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                 className="mt-8 sm:mt-10 lg:mt-12 flex justify-center lg:justify-end"
              >
                 <Link href="/doctors" className="flex items-center gap-2 sm:gap-3 font-black text-slate-900 dark:text-white group cursor-pointer flex-row-reverse">
                    <span className="text-sm sm:text-base border-b-2 border-slate-200 group-hover:border-rose-500 transition-colors">{t("viewAllDoctors")}</span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all group-hover:rotate-180">
                       <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform rotate-45 group-hover:rotate-180" />
                    </div>
                 </Link>
              </motion.div>
            </div>
          )}

          {/* Large Highlighted Doctor & Experience */}
          <div className="relative group lg:col-span-5">
            <motion.div 
               initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants} custom={0}
               className="relative"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl sm:rounded-[32px] lg:rounded-[40px] bg-white dark:bg-slate-800 border-4 sm:border-6 lg:border-8 border-white dark:border-slate-800 cursor-pointer">
                <Image
                  src={LANDING_IMAGES.teamDoctor}
                  alt={t("mainDoctorAlt")}
                  fill
                  className="object-cover object-top transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                />
                
                {/* Overlay Text on Image */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent p-4 sm:p-6 lg:p-8 pt-12 sm:pt-16 lg:pt-20 transition-all group-hover:pb-6 sm:group-hover:pb-8 lg:group-hover:pb-10">
                   <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
                      <div className="bg-rose-500 w-2 h-2 rounded-full animate-ping"></div>
                      <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">{t("availableToday")}</span>
                   </div>
                   <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-1">{t("mainDoctorName")}</h3>
                   <p className="text-slate-200 font-semibold mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg">{t("mainDoctorTitle")}</p>
                   
                   <div className={cn("flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500", isRTL && "flex-row-reverse")}>
                      {SOCIAL.map(({ Icon, label, hoverColor }) => (
                         <button key={label} className={cn(
                           "w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer",
                           hoverColor
                         )}>
                            <Icon className="w-5 h-5" />
                         </button>
                      ))}
                   </div>
                </div>
              </div>

              {/* Floating Stat Card */}
              <motion.div 
                 initial={cardInitial}
                 animate={cardAnimate}
                 transition={cardTransition}
                 className={cn(
                   "absolute -top-4 sm:-top-6 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 sm:border-4 border-rose-50 dark:border-slate-700 cursor-pointer",
                   isRTL ? "-left-4 sm:-left-6 sm:max-w-[180px]" : "-right-4 sm:-right-6 sm:max-w-[200px]"
                 )}
              >
                 <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                       <UserCheck className="w-5 h-5 sm:w-7 sm:h-7 text-rose-500" />
                    </div>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-1 line-clamp-1">{t("experienceYears")}</span>
                    <span className="text-xs sm:text-sm text-slate-500 font-bold leading-tight">{t("experienceLabel")}</span>
                 </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Intro & Doctor Grid - Renders second in RTL, first in LTR */}
          {!isRTL && (
            <div className="lg:col-span-7 lg:pl-6">
              <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
                 <div className="max-w-md">
                   <h2 className={cn("text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] break-words", DENTAL_FONT_HEADING)}>
                     <VerticalCutReveal splitBy="words" autoStart={isInView}>
                       {t("title")}
                     </VerticalCutReveal>
                   </h2>
                 </div>
              </div>

              <motion.p 
                custom={1} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6 sm:mb-8 lg:mb-10"
              >
                {t("description")}
              </motion.p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {DOCTORS.map(({ name, specialty, image }, idx) => (
                  <motion.div
                    key={name}
                    custom={2 + idx} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                    className="group relative bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700/50 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-700">
                        <Image
                          src={image}
                          alt={t("doctorImageAlt")}
                          fill
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 80px, 96px"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors break-words">{name}</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm mb-2 sm:mb-3 break-words">{specialty}</p>
                        
                        <div className="flex items-center gap-2">
                           {SOCIAL.slice(0, 3).map(({ Icon, label, hoverColor }) => (
                             <button key={label} className={cn(
                               "w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all duration-300 cursor-pointer",
                               "hover:text-white",
                               hoverColor
                             )}>
                                <Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                             </button>
                           ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Decoration */}
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom Link */}
              <motion.div 
                 custom={7} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                 className="mt-8 sm:mt-10 lg:mt-12 flex justify-center lg:justify-start"
              >
                 <Link href="/doctors" className="flex items-center gap-2 sm:gap-3 font-black text-slate-900 dark:text-white group cursor-pointer">
                    <span className="text-sm sm:text-base border-b-2 border-slate-200 group-hover:border-rose-500 transition-colors">{t("viewAllDoctors")}</span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                       <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform -rotate-45 group-hover:rotate-0" />
                    </div>
                 </Link>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
