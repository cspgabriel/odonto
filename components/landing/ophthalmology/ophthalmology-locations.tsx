"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { MapPin, Phone, Clock, ExternalLink, Navigation, Stethoscope, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING } from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";

export function OphthalmologyLocations() {
  const t = useTranslations("landing.locations");
  const [showOverlay, setShowOverlay] = useState(true);
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const mapInitial = reduced ? {} : { opacity: 0, scale: 0.98 };
  const mapAnimate = reduced || !isInView ? {} : { opacity: 1, scale: 1 };
  const overlayInitial = reduced ? {} : { opacity: 0, x: 20 };
  const overlayAnimate = reduced || !isInView ? {} : { opacity: 1, x: 0 };
  const overlayTrans = reduced ? { duration: 0 } : { delay: 0.5, duration: 0.6 };
  const cardTrans = (idx: number) => (reduced ? { duration: 0 } : { delay: 0.2 + idx * 0.1 });

  const LOCATIONS = [
    {
      country: t("location1.country"),
      flag: "🇺🇸",
      address: t("location1.address"),
      phone: t("location1.phone"),
      hours: t("location1.hours"),
    },
    {
      country: t("location2.country"),
      flag: "🇨🇦",
      address: t("location2.address"),
      phone: t("location2.phone"),
      hours: t("location2.hours"),
    },
  ];

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden pt-16 pb-16 bg-white dark:bg-slate-950 px-4"
    >
      <div className={cn("mx-auto relative z-10", OPHTHALMOLOGY_MAX_WIDTH)}>
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Map Section */}
          <div className="lg:col-span-12 xl:col-span-8">
             <motion.div 
               initial={mapInitial}
               animate={mapAnimate}
               transition={reduced ? { duration: 0 } : { duration: 0.8 }}
                className="relative min-h-[400px] lg:min-h-0 aspect-[16/10] lg:aspect-auto lg:h-full w-full rounded-[40px] overflow-hidden border border-slate-200/60 dark:border-slate-800/60"
             >
                {/* Google Maps Iframe - New York */}
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.25280821873!2d-74.11976373946229!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sfr!4v1708000000000!5m2!1sen!2sfr" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale grayscale-[0.2] contrast-[1.1]"
                ></iframe>
                
                {/* Custom Office Info Overlay (Top Right Position) */}
                {showOverlay && (
                <div className="absolute inset-0 pointer-events-none flex items-start justify-end p-6">
                   <motion.div 
                     initial={overlayInitial}
                     animate={overlayAnimate}
                     transition={overlayTrans}
                     className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pointer-events-auto rounded-[32px] p-6 max-w-[280px] w-full border border-slate-100 dark:border-slate-800 relative shadow-none"
                   >
                      <button 
                        onClick={() => setShowOverlay(false)}
                        className="absolute top-4 end-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-teal-500 transition-colors"
                      >
                         <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 mb-6">
                         <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white shrink-0">
                            <Stethoscope className="w-5 h-5" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-lg font-black text-[#2D2D5F] dark:text-white leading-none">Clinic</span>
                            <span className="text-teal-500 font-bold text-[10px] uppercase tracking-widest leading-none mt-0.5">Master</span>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div>
                            <h4 className="text-[#2D2D5F] dark:text-white font-black text-xs mb-1">{t("overlay.officeAddress")}</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs leading-relaxed">{t("overlay.address")}</p>
                         </div>
                         
                         <div>
                            <h4 className="text-[#2D2D5F] dark:text-white font-black text-xs mb-1">{t("overlay.workingHours")}</h4>
                            <div className="text-slate-500 dark:text-slate-400 font-bold text-xs leading-relaxed">
                               <p>{t("overlay.hours1")}</p>
                               <p>{t("overlay.hours2")}</p>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                </div>
                )}
             </motion.div>
          </div>

          {/* Right: Locations Details */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col">
             <div className="mb-6">
                <span className="text-teal-500 font-black text-xs uppercase tracking-[0.2em] mb-2 block text-center lg:text-start">{t("badge")}</span>
                <h2 className={cn("text-3xl lg:text-4xl font-black text-[#2D2D5F] dark:text-white leading-tight mb-4 text-center lg:text-start break-words", OPHTHALMOLOGY_FONT_HEADING)}>
                  <VerticalCutReveal splitBy="words" autoStart={isInView}>
                    {t("title")}
                  </VerticalCutReveal>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed text-center lg:text-start break-words">
                  {t("subtitle")}
                </p>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {LOCATIONS.map((loc, idx) => (
                   <motion.div 
                     key={idx}
                     initial={overlayInitial}
                     animate={overlayAnimate}
                     transition={cardTrans(idx)}
                     className="group relative p-4 bg-white dark:bg-slate-800 rounded-[20px] border border-slate-100 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-900/50 transition-all flex flex-col h-fit shadow-none cursor-pointer"
                   >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                           <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{loc.flag}</span>
                           <h3 className="text-lg font-black text-[#2D2D5F] dark:text-white leading-tight">{loc.country}</h3>
                        </div>
                        
                        <div className="space-y-2">
                           <div className="flex gap-3">
                              <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px] leading-snug">{loc.address}</p>
                           </div>
                           <div className="flex gap-3">
                              <Phone className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                              <p className="text-slate-500 dark:text-slate-400 font-black text-[11px]">{loc.phone}</p>
                           </div>
                           <div className="flex gap-3">
                              <Clock className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">{loc.hours}</p>
                           </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-4 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                         <button className="flex items-center gap-2 text-teal-500 font-black text-[9px] uppercase tracking-widest hover:text-teal-600 transition-colors group/btn">
                            {t("getDirections")}
                            <Navigation className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                         </button>
                         <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                         </div>
                      </div>
                   </motion.div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
