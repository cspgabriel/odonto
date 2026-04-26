"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronRight, Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export function AppointmentHero() {
  const t = useTranslations("landing.appointmentHero");
  const reduced = useReducedMotion();
  const badgeInitial = reduced ? {} : { opacity: 0, x: -20 };
  const badgeAnimate = reduced ? {} : { opacity: 1, x: 0 };
  const h1Initial = reduced ? {} : { opacity: 0, y: 30 };
  const h1Animate = reduced ? {} : { opacity: 1, y: 0 };
  const h1Trans = reduced ? { duration: 0 } : { delay: 0.1, duration: 0.8 };
  const navInitial = reduced ? {} : { opacity: 0, y: 20 };
  const navAnimate = reduced ? {} : { opacity: 1, y: 0 };
  const navTrans = reduced ? { duration: 0 } : { delay: 0.3 };
  const imgInitial = reduced ? {} : { opacity: 0, scale: 0.8, rotate: 5 };
  const imgAnimate = reduced ? {} : { opacity: 1, scale: 1, rotate: 0 };
  const imgTrans = reduced ? { duration: 0 } : { delay: 0.2, duration: 1, ease: "easeOut" as const };
  const floatAnimate = reduced ? {} : { y: [0, -20, 0] };
  const floatTrans = reduced ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "easeInOut" as const };
  return (
    <section className="relative overflow-hidden pt-36 pb-24 lg:pt-52 lg:pb-48 bg-[#FFF2F6] dark:bg-slate-900/50 px-4">
      {/* Decorative Blob Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/50 dark:bg-teal-900/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 -z-10"></div>
      
      {/* Wave Shape at bottom */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
        <svg className="relative block w-full h-[80px] sm:h-[120px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C58.23,113.11,145.92,126.33,230.11,105.74,271.18,95.73,298.63,60.65,321.39,56.44Z" fill="white" className="dark:fill-slate-950"></path>
        </svg>
      </div>

      <div className={cn("mx-auto relative z-10", OPHTHALMOLOGY_MAX_WIDTH)}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
          
          <div className="flex-1 text-center lg:text-left max-w-2xl">
             <motion.div 
               initial={badgeInitial}
               animate={badgeAnimate}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100/50 dark:bg-teal-900/30 text-teal-500 text-sm font-black uppercase tracking-[0.2em] mb-8"
             >
               <Sparkles className="w-4 h-4 fill-current" />
               {t("badge")}
             </motion.div>

             <motion.h1 
               initial={h1Initial}
               animate={h1Animate}
               transition={h1Trans}
               className={cn("text-5xl sm:text-7xl lg:text-8xl font-black text-[#2D2D5F] dark:text-white leading-[1.05] mb-10 break-words", OPHTHALMOLOGY_FONT_HEADING)}
             >
               {t("title")}
             </motion.h1>

             <motion.nav 
               initial={navInitial}
               animate={navAnimate}
               transition={navTrans}
               className="flex items-center justify-center lg:justify-start gap-4"
             >
               <Link href="/" className="flex items-center gap-2 text-teal-500 font-black hover:text-teal-600 transition-colors bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-full shadow-sm">
                 <Home className="w-4 h-4" />
                 <span className="text-sm">{t("home")}</span>
               </Link>
               <ChevronRight className="w-4 h-4 text-slate-400" />
               <span className="text-slate-500 dark:text-slate-400 font-black text-sm uppercase tracking-widest">{t("appointment")}</span>
             </motion.nav>
          </div>

          <div className="flex-1 relative w-full max-w-[500px]">
             <motion.div 
               initial={imgInitial}
               animate={imgAnimate}
               transition={imgTrans}
               className="relative"
             >
                {/* Profile Image with organic oval cut */}
                <div className="relative aspect-square w-full rounded-[40%_60%_70%_30%/40%_50%_60%_50%] overflow-hidden border-[15px] border-white dark:border-slate-800 shadow-[0_30px_60px_-15px_rgba(45,45,95,0.3)]">
                   <Image 
                     src={LANDING_IMAGES.weCarePatient} 
                     alt={t("doctorImageAlt")} 
                     fill 
                     className="object-cover scale-110 hover:scale-125 transition-transform duration-1000"
                   />
                </div>
                
                {/* Floating Floating Icon 1 */}
                <motion.div 
                   animate={floatAnimate}
                   transition={floatTrans}
                   className="absolute -top-6 -left-6 w-28 h-28 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex items-center justify-center p-3 border border-slate-50 dark:border-slate-700"
                >
                   <Image src={LANDING_IMAGES.doctor2} alt="Icon" width={100} height={100} className="rounded-3xl object-cover h-full" />
                </motion.div>

                {/* Decorative Circle Dot */}
                <div className="absolute -bottom-4 right-1/4 w-8 h-8 bg-teal-500 rounded-full animate-ping opacity-20"></div>
             </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
