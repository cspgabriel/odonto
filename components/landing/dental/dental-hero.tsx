"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { DENTAL_FONT_HEADING, DENTAL_MAX_WIDTH } from "./config";
import type { ContentSettings } from "@/lib/validations/landing-settings";

/* SVG Components */
function SmileUnderline() {
  return (
    <svg width="207" height="44" viewBox="0 0 207 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-0 top-[85%] -z-10 w-full">
      <path d="M9 12C83 50 121.2 54.4 198 12" className="stroke-primary" strokeWidth="3" />
      <path d="M14 1L2 23" className="stroke-primary" strokeWidth="3" />
      <path d="M193 1L205 23" className="stroke-primary" strokeWidth="3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 17L17 7" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 7H17V17" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BannerShape() {
  return (
    <svg className="absolute bottom-0 left-0 w-full z-40 h-16 sm:h-24 lg:h-48" viewBox="0 0 1920 180" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
         <path d="M1921 164.375C1734.2 -139.225 527.167 48.8754 -33 180.875H1921V164.375Z" className="fill-primary opacity-100"></path>
        <path d="M1921 164.375C1714.2 -59.2247 527.167 58.8754 -33 180.875H1921V164.375Z" fill="white" className="dark:fill-slate-950"></path>
    </svg>
  );
}

export function DentalHero({ hero }: { hero?: ContentSettings["hero"] }) {
  const t = useTranslations("landing.hero");
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Prefer translations for non-English locales so content is localized; use DB override for English
  const headline = (locale === "en" && hero?.headline) ? hero.headline : t("headline");
  const subtitle = (locale === "en" && hero?.subtitle) ? hero.subtitle : t("subtitle");

  return (
    <section id="hero" className="relative z-0 min-h-screen overflow-hidden pt-28 pb-20 lg:pt-32 lg:pb-32 dark:bg-slate-950">
      <div className="absolute inset-0 -z-50 h-full w-full bg-[linear-gradient(to_right,#e11d4805_1px,transparent_1px),linear-gradient(to_bottom,#e11d4805_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <div className={cn("mx-auto h-full px-4", DENTAL_MAX_WIDTH)}>
        <div className="flex flex-col lg:flex-row">
          
          {/* LEFT COLUMN */}
          <div className="relative z-10 lg:mt-10 lg:w-1/2 lg:pe-12">
            <h1 className={cn("relative text-5xl font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white break-words", DENTAL_FONT_HEADING)}>
              {!isRTL ? (
                <>
                  {headline.split(" ").slice(0, -1).join(" ")} <br className="hidden sm:block" />
                  <span className="relative inline-block text-slate-900 dark:text-white">
                    {headline.split(" ").slice(-1)[0]}
                    <SmileUnderline />
                  </span>
                </>
              ) : (
                <span className="relative inline-block text-slate-900 dark:text-white">
                  {headline}
                  <SmileUnderline />
                </span>
              )}
            </h1>
            
            <div className="mt-8 mb-10 border-s-4 border-primary bg-primary/5 py-4 ps-6 pe-4 rounded-e-2xl dark:bg-primary/10">
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 break-words">
                {subtitle}
              </p>
            </div>

            <div className="mb-10 flex items-center gap-6">
              <div className="flex items-center rounded-full bg-white py-3 ps-3 pe-8 dark:bg-slate-800">
                <div className="flex -space-x-3">
                    <Image src="/landing/dental/images/avatar1.22bb7fef.webp" alt={t("avatarAlt")} width={50} height={50} className="h-12 w-12 rounded-full border-2 border-white object-cover dark:border-slate-800" />
                    <Image src="/landing/dental/images/avatar2.faf6f9cf.webp" alt={t("avatarAlt")} width={50} height={50} className="h-12 w-12 rounded-full border-2 border-white object-cover dark:border-slate-800" />
                    <Image src="/landing/dental/images/avatar3.7024dc80.webp" alt={t("avatarAlt")} width={50} height={50} className="h-12 w-12 rounded-full border-2 border-white object-cover dark:border-slate-800" />
                    <Image src="/landing/dental/images/avatar4.1f1f95dc.webp" alt={t("avatarAlt")} width={50} height={50} className="h-12 w-12 rounded-full border-2 border-white object-cover dark:border-slate-800" />
                </div>
                <div className="mx-6 h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{t("talkToDoctors")}</span>
                </div>
              </div>
              
              <Link 
                href="#about" 
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById("about");
                  if (element) {
                    const offset = element.offsetTop - 100;
                    window.scrollTo({ top: offset, behavior: "smooth" });
                  }
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white transition-transform hover:scale-105 dark:bg-slate-800 shadow-lg shadow-primary/5 group"
              >
                <ArrowIcon />
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <ul className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i}>
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </li>
                ))}
              </ul>
              <span className="font-bold text-slate-900 dark:text-white">{t("rating")}</span>
              <span className="text-slate-600 dark:text-slate-400">{t("ratingsText")}</span>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="relative mt-16 max-md:w-full max-md:mt-8 lg:-mt-32 lg:w-1/2">
             <div className="relative mx-auto w-full max-w-[680px]">
                {/* Circle Container Behind Image */}
                <div className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 dark:bg-primary/10"></div>

                {/* Main Hero Image */}
                <div className="relative z-10 overflow-hidden rounded-bl-[100px]">
                    <Image
                        src="/landing/dental/images/img1.8b16f2f2.webp"
                        alt={t("heroDoctorAlt")}
                        width={580}
                        height={835}
                        className="w-full object-cover"
                        priority
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAUDB//EACIQAAEEAgICAwAAAAAAAAAAAAEAAgMEERIhBRMiMf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCU0tFXMiJHC1t/B1qy6GCxJcBqIjOk/FDdgH1lY5R67P2jb9Ip82F9ufhERB//2Q=="
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 580px"
                    />
                </div>



                <div className="absolute left-[15%] top-[30%] z-20 animate-float">
                    <Image
                        src="/landing/dental/images/img5.5a179a54.webp"
                        alt={t("toothAlt")}
                        width={100}
                        height={100}
                        className="aspect-square w-16 rounded-full border-4 border-white shadow-lg object-cover sm:w-24 dark:border-slate-700/50"
                    />
                </div>

                 <div className="absolute right-[5%] top-[25%] z-20 animate-pulse-slow">
                    <Image
                         src="/landing/dental/images/img6.b1722ab6.webp"
                        alt={t("sparkleAlt")}
                        width={140}
                        height={140}
                        className="aspect-square w-16 rounded-full border-4 border-white shadow-xl object-cover sm:w-20 dark:border-slate-800"
                    />
                </div>
                
                {/* Available Doctors Widget */}
                <div className="absolute bottom-0 right-[-15px] md:right-[-30px] z-50 w-[220px] md:w-[260px] animate-float-slow rounded-2xl bg-white p-4 md:p-5 shadow-xl dark:bg-slate-800 lg:right-[-40px]">
                    <div className="mb-4">
                        <h5 className="text-lg font-medium text-slate-900 dark:text-white">{t("availableDoctors")}</h5>
                         <span className="text-sm text-slate-500 dark:text-slate-400">{t("selectDoctor")}</span>
                    </div>
                     <div className="mb-3 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Image src="/landing/dental/images/avatar7.e825c359.webp" alt={t("doctor1Alt")} width={50} height={50} className="rounded-full" />
                            <div>
                                <h6 className="font-semibold text-slate-900 dark:text-white">{t("doctor1Name")}</h6>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{t("dentist")}</span>
                            </div>
                         </div>
                         <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-500"></div>
                     </div>
                      <div className="mb-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Image src="/landing/dental/images/avatar8.16c0561f.webp" alt={t("doctor2Alt")} width={50} height={50} className="rounded-full" />
                            <div>
                                <h6 className="font-semibold text-slate-900 dark:text-white">{t("doctor2Name")}</h6>
                                 <span className="text-xs text-slate-500 dark:text-slate-400">{t("dentist")}</span>
                            </div>
                         </div>
                          <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-500"></div>
                     </div>
                       <Link href="/appointment" className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98]">
                        {t("bookAppointment")}
                    </Link>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Floating Background Items */}
      <div className="absolute left-[8%] bottom-[5%] z-40 animate-float hidden lg:block">
        <Image src="/landing/dental/images/img2.555d15ff.webp" alt={t("decorativeImageAlt")} width={186} height={202} className="w-20" />
      </div>

      {/* Banner Shape */}
      <BannerShape />
    </section>
  );
}
