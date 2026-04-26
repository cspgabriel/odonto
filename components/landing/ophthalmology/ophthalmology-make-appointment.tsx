"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { LandingButton } from "@/components/ui/landing-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Phone, User, Stethoscope, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export function OphthalmologyMakeAppointment() {
  const t = useTranslations("landing.makeAppointment");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "",
    date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const SERVICES = [
    t("services.generalCheckup"),
    t("services.teethWhitening"),
    t("services.dentalImplants"),
    t("services.rootCanal"),
    t("services.cosmeticDentistry"),
    t("services.emergencyCare"),
  ];

  const BENEFITS = [
    t("certifiedDoctors"),
    t("emergencyCare247"),
    t("modernEquipment"),
    t("flexiblePayment"),
  ];

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 30 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" } },
  };
  const benefitsInitial = reduced ? {} : { opacity: 0, scale: 0.95 };
  const benefitsAnimate = reduced ? {} : { opacity: 1, scale: 1 };
  const benefitsSlideInitial = reduced ? {} : { opacity: 0, x: 20 };
  const benefitsSlideAnimate = reduced || !isInView ? {} : { opacity: 1, x: 0 };
  const benefitsSlideTrans = reduced ? { duration: 0 } : { delay: 1, duration: 0.8 };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t("fullNameRequired");
    if (!formData.phone.trim()) newErrors.phone = t("phoneRequired");
    if (!formData.service) newErrors.service = t("serviceRequired");
    if (!formData.date) newErrors.date = t("dateRequired");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        const { submitLandingAppointment } = await import("@/lib/actions/landing-appointment-actions");
        const res = await submitLandingAppointment({
           name: formData.name,
           phone: formData.phone,
           service: formData.service,
           date: formData.date
        });

        if (res.success) {
           setIsSuccess(true);
           setFormData({ name: "", phone: "", service: "", date: "" });
        } else {
           console.error("Failed to submit appointment", res.error);
        }
      } catch (error) {
        console.error("Failed to submit appointment", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section
      id="appointment"
      ref={containerRef}
      className="relative overflow-hidden py-8 lg:py-12 bg-white dark:bg-slate-950 px-4"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] bg-teal-50/10 dark:bg-teal-900/10 blur-[150px] rounded-full"></div>
      
      <div className={cn("mx-auto relative z-10", OPHTHALMOLOGY_MAX_WIDTH)}>
        <div className="bg-white dark:bg-[#0B0B1E] rounded-[32px] lg:rounded-[48px] overflow-hidden border border-slate-200/60 dark:border-slate-800/60">
          <div className="grid lg:grid-cols-12 items-stretch min-h-[480px]">
            
            {/* Left: Content & Form */}
            <div className="lg:col-span-12 xl:col-span-7 p-6 sm:p-10 xl:p-12 text-slate-900 dark:text-white flex flex-col justify-center">
              <motion.div
                 initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants} custom={0}
              >
                <h2 className={cn("text-2xl sm:text-3xl lg:text-4xl font-black mb-3 leading-tight tracking-tight text-slate-900 dark:text-white break-words", OPHTHALMOLOGY_FONT_HEADING)}>
                  <VerticalCutReveal splitBy="words" autoStart={isInView}>
                    {t("title")}
                  </VerticalCutReveal>
                </h2>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-medium">
                  {t("subtitle")}
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                   {BENEFITS.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-500 shrink-0">
                            <CheckCircle className="w-2.5 h-2.5" />
                         </div>
                         <span className="text-slate-600 dark:text-slate-200 font-bold text-[10px] uppercase tracking-wider">{b}</span>
                      </div>
                   ))}
                </div>
              </motion.div>

              {isSuccess ? (
                <motion.div
                  initial={benefitsInitial}
                  animate={benefitsAnimate}
                  className="bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl p-8 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-400 mb-2">{t("success.title")}</h3>
                  <p className="text-emerald-700 dark:text-emerald-500/80 font-medium text-sm">
                    {t("success.message")}
                  </p>
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest hover:underline"
                  >
                    {t("success.reschedule")}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  custom={1} initial="hidden" animate={reduced || !isInView ? "hidden" : "visible"} variants={fadeUpVariants}
                  className="grid sm:grid-cols-2 gap-x-6 gap-y-4"
                  onSubmit={handleSubmit}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="apt-name" className="text-slate-400 dark:text-slate-400 font-black ml-0.5 text-[10px] uppercase tracking-widest leading-none">{t("fullName")}</Label>
                      {errors.name && <span className="text-[9px] font-black text-teal-500 uppercase tracking-tighter">{errors.name}</span>}
                    </div>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                      <Input
                        id="apt-name"
                        placeholder={t("fullNamePlaceholder")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={cn(
                          "h-11 pl-10 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm placeholder:text-slate-300 dark:placeholder:text-slate-700 focus-visible:ring-teal-500/50 transition-all border-2",
                          errors.name && "border-teal-500/50"
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="apt-phone" className="text-slate-400 dark:text-slate-400 font-black ml-0.5 text-[10px] uppercase tracking-widest leading-none">{t("phoneNumber")}</Label>
                      {errors.phone && <span className="text-[9px] font-black text-teal-500 uppercase tracking-tighter">{errors.phone}</span>}
                    </div>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                      <Input
                        id="apt-phone"
                        type="tel"
                        placeholder={t("phonePlaceholder")}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={cn(
                          "h-11 pl-10 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm placeholder:text-slate-300 dark:placeholder:text-slate-700 focus-visible:ring-teal-500/50 transition-all border-2",
                          errors.phone && "border-teal-500/50"
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="apt-service" className="text-slate-400 dark:text-slate-400 font-black ml-0.5 text-[10px] uppercase tracking-widest leading-none">{t("selectService")}</Label>
                      {errors.service && <span className="text-[9px] font-black text-teal-500 uppercase tracking-tighter">{errors.service}</span>}
                    </div>
                    <div className="relative group">
                      <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 z-10 group-focus-within:text-teal-500 transition-colors" />
                      <Select value={formData.service} onValueChange={(v) => setFormData({ ...formData, service: v })}>
                        <SelectTrigger
                          id="apt-service"
                          className={cn(
                            "h-11 pl-10 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-teal-500/50 transition-all border-2",
                            errors.service && "border-teal-500/50"
                          )}
                        >
                          <SelectValue placeholder={t("selectServicePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B0B1E] text-slate-900 dark:text-white shadow-2xl p-1.5 min-w-[220px]">
                          {SERVICES.map((s) => (
                            <SelectItem 
                              key={s} 
                              value={s} 
                              className="hover:!bg-teal-500 hover:!text-white focus:!bg-teal-500 focus:!text-white cursor-pointer rounded-full py-2.5 px-8 text-xs font-bold transition-colors m-0.5"
                            >
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="apt-date" className="text-slate-400 dark:text-slate-400 font-black ml-0.5 text-[10px] uppercase tracking-widest leading-none">{t("selectDate")}</Label>
                      {errors.date && <span className="text-[9px] font-black text-teal-500 uppercase tracking-tighter">{errors.date}</span>}
                    </div>
                    <div className="relative group">
                      <DatePicker
                        date={formData.date ? new Date(formData.date) : undefined}
                        onSelect={(date) => {
                          setFormData({ ...formData, date: date ? format(date, "yyyy-MM-dd") : "" });
                        }}
                        className={cn(
                          "h-11 w-full rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus-visible:ring-teal-500/50 transition-all border-2 justify-start font-normal",
                          errors.date && "border-teal-500/50",
                          !formData.date && "text-slate-500"
                        )}
                        placeholder={t("selectDate") || "Select date"}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 pt-6">
                    <LandingButton 
                      type="submit" 
                      size="lg" 
                      variant="primary" 
                      disabled={isSubmitting}
                      className="w-full h-14 rounded-full text-base font-black !bg-teal-500 hover:!bg-teal-600 dark:!bg-teal-500 dark:hover:!bg-teal-600 text-white border-none transition-all active:scale-[0.98] relative overflow-hidden group/btn"
                    >
                      <span className="relative z-10">{isSubmitting ? t("processing") : t("bookNow")}</span>
                    </LandingButton>
                  </div>
                </motion.form>
              )}
            </div>

            {/* Right: Ophthalmology image (eye care / schedule your visit) */}
            <div className="lg:col-span-5 relative hidden lg:block overflow-hidden bg-black border-l border-slate-100 dark:border-white/5">
               <Image
                 src="/landing/ophthalmology/images/optometrists_Ophthalmologists.png"
                 alt={t("doctorsImageAlt")}
                 fill
                 className="object-cover object-center"
                 sizes="50vw"
                 priority
               />
               
               {/* Seamless Left Fade Overlay */}
               <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#0B0B1E] via-white/10 dark:via-[#0B0B1E]/10 to-transparent"></div>
               
               {/* Floating Success Badge */}
               <motion.div
                 initial={benefitsSlideInitial}
                 animate={benefitsSlideAnimate}
                 transition={benefitsSlideTrans}
                 className="absolute top-6 end-6 bg-white/10 backdrop-blur-2xl rounded-[24px] p-4 border border-white/20 max-w-[200px] shadow-xl z-20"
               >
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-9 h-9 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                        <CheckCircle className="w-5 h-5" />
                     </div>
                     <div>
                        <span className="block text-white font-black text-xl leading-none">{t("satisfactionRate")}</span>
                        <span className="text-white text-[9px] font-black uppercase tracking-widest">{t("satisfaction")}</span>
                     </div>
                  </div>
                  <p className="text-white/80 text-[10px] leading-relaxed font-bold uppercase tracking-tight">
                     {t("satisfactionDescription")}
                  </p>
               </motion.div>

               {/* Decorative Gradient Overlay Bottom */}
               <div className="absolute inset-0 bg-gradient-to-t from-white/40 dark:from-[#0B0B1E]/40 to-transparent pointer-events-none"></div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
