"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { LandingButton } from "@/components/ui/landing-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Sparkles, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sendContactEmail } from "@/lib/actions/send-contact-email";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContactSettings, CTASettings } from "@/lib/validations/landing-settings";
import { DENTAL_MAX_WIDTH, DENTAL_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";

export function DentalContact({ contact, cta }: { contact?: ContactSettings; cta?: CTASettings }) {
  const t = useTranslations("landing.contact");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const fadeUpVariants: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 30 },
    visible: (i: number) =>
      reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" } },
  };

  return (
    <section
      id="contact"
      ref={containerRef}
      className="relative overflow-hidden py-8 lg:py-10 bg-white dark:bg-slate-950"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] bg-rose-50/10 dark:bg-rose-900/10 blur-[150px] rounded-full"></div>
      
      <div className={cn("mx-auto px-4 relative z-10", DENTAL_MAX_WIDTH)}>
        
        {/* Header content */}
        <div className="flex flex-col items-center text-center mb-6">
            <motion.div 
               initial={reduced ? {} : { opacity: 0, scale: 0.8 }} animate={reduced || !isInView ? {} : { opacity: 1, scale: 1 }}
               className="inline-flex items-center px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-[10px] font-black uppercase tracking-widest mb-4"
            >
               {t("badge")}
            </motion.div>
            
            <h2 className={cn("text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.1] mb-4 break-words", DENTAL_FONT_HEADING)}>
              <VerticalCutReveal splitBy="words" autoStart={isInView}>
                {t("title")}
              </VerticalCutReveal>
            </h2>

           <motion.p 
             custom={1} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={fadeUpVariants}
             className="max-w-xl text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
           >
             {t("subtitle")}
           </motion.p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-[#0B0B1E] rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 p-6 sm:p-8">
            
            {/* Message Form (Top Section) */}
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                     <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1.5 uppercase tracking-tight">{t("sendMessage")}</h3>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">{t("fastFriendlySupport")}</p>
                  </div>
               </div>
  
               <form
                  className="grid sm:grid-cols-2 gap-x-6 gap-y-5"
                  onSubmit={async (e) => {
                     e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     const name = formData.get("name") as string;
                     const email = formData.get("email") as string;
                     const message = formData.get("message") as string;

                     if (!name || !email || !message) {
                        toast.error(t("errorFieldsRequired") || "Please fill all required fields");
                        return;
                     }

                     setLoading(true);
                     try {
                        const targetEmail = contact?.email || "info@clinicmaster.com";
                        const result = await sendContactEmail({ name, email, message, toEmail: targetEmail });
                        if (result.success) {
                           toast.success("Your message has been sent successfully!");
                           (e.target as HTMLFormElement).reset();
                        } else {
                           toast.error(result.error || "Failed to send message. Please try again later.");
                        }
                     } catch (err) {
                        toast.error("An unexpected error occurred.");
                     } finally {
                        setLoading(false);
                     }
                  }}
               >
                  <div className="space-y-1.5">
                     <Label htmlFor="contact-name" className="text-slate-400 dark:text-slate-400 font-black ml-0.5 text-[10px] uppercase tracking-widest leading-none">{t("fullName")}</Label>
                     <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                        <Input
                           id="contact-name"
                           name="name"
                           placeholder={t("fullNamePlaceholder")}
                           required
                           className="h-10 pl-11 rounded-lg border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs placeholder:text-slate-300 dark:placeholder:text-slate-700 focus-visible:ring-rose-500/50 transition-all border-2"
                        />
                     </div>
                  </div>
                  
                  <div className="space-y-1.5">
                     <Label htmlFor="contact-email" className="text-slate-400 dark:text-slate-400 font-black ml-0.5 text-[10px] uppercase tracking-widest leading-none">{t("emailAddress")}</Label>
                     <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                        <Input
                           id="contact-email"
                           name="email"
                           type="email"
                           required
                           placeholder={t("emailPlaceholder")}
                           className="h-10 pl-11 rounded-lg border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs placeholder:text-slate-300 dark:placeholder:text-slate-700 focus-visible:ring-rose-500/50 transition-all border-2"
                        />
                     </div>
                  </div>
  
                  <div className="sm:col-span-2 space-y-1.5">
                     <Label htmlFor="contact-message" className="text-slate-400 dark:text-slate-400 font-black ml-0.5 text-[10px] uppercase tracking-widest leading-none">{t("yourInquiry")}</Label>
                     <div className="relative group">
                        <MessageCircle className="absolute left-4 top-4 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                        <Textarea
                           id="contact-message"
                           name="message"
                           required
                           placeholder={t("inquiryPlaceholder")}
                           rows={3}
                           className="p-4 pl-11 rounded-lg border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs focus-visible:ring-rose-500/50 transition-all border-2 resize-none"
                        />
                     </div>
                  </div>
  
                  <div className="sm:col-span-2 pt-2 flex justify-start">
                     <LandingButton
                        type="submit"
                        size="sm"
                        variant="primary"
                        disabled={loading}
                        className="h-10 px-8 rounded-lg text-xs font-black bg-rose-500 hover:bg-rose-600 border-none transition-all active:scale-[0.98] group/btn"
                     >
                        {loading ? (
                           <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                              {t("processing")}
                           </div>
                        ) : (
                           <div className="flex items-center justify-center gap-2">
                              {t("sendMessageButton")}
                              <Send className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                           </div>
                        )}
                     </LandingButton>
                  </div>
               </form>
          </div>
        </div>
      </div>
    </section>
  );
}
