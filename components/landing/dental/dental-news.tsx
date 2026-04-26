"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Calendar, Sparkles, MessageCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { DENTAL_MAX_WIDTH, DENTAL_FONT_HEADING } from "./config";
import { LandingButton } from "@/components/ui/landing-button";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { getCategoryBadgeColor } from "@/lib/constants/blog";

export const getColorForCategory = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("news")) return "bg-rose-500 ring-rose-500/30";
    if (cat.includes("innovation") || cat.includes("tech")) return "bg-blue-500 ring-blue-500/30";
    if (cat.includes("urgent") || cat.includes("emergency")) return "bg-amber-500 ring-amber-500/30";
    if (cat.includes("treatment") || cat.includes("care")) return "bg-emerald-500 ring-emerald-500/30";
    if (cat.includes("tips") || cat.includes("health")) return "bg-purple-500 ring-purple-500/30";
    return "bg-slate-500 ring-slate-500/30";
  };

export function DentalNews({ 
  initialPosts, 
  hideHeader = false, 
  hideButton = false 
}: { 
  initialPosts?: any[]; 
  hideHeader?: boolean; 
  hideButton?: boolean; 
}) {
  const t = useTranslations("landing.news");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const noAnim = reduced ? {} : undefined;
  const showInView = !reduced && isInView;
  const initialUp = reduced ? {} : { opacity: 0, y: 20 };
  const animateUp = reduced || !isInView ? {} : { opacity: 1, y: 0 };
  const transitionCard = (idx: number) =>
    reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 400, damping: 28, delay: idx * 0.1 };

  // Use dynamic posts from DB. Prefer post.category (name + color); fallback to first tag or "Category|#HEX".
  const POSTS = (initialPosts ?? []).map((post) => {
    let category: string;
    let categoryColor: string | undefined;

    if (post.category?.name) {
      category = post.category.name;
      categoryColor = getCategoryBadgeColor(post.category.id, post.category.color);
    } else {
      const rawCategory: string = post.tags ? String(post.tags).split(",")[0].trim() : "News";
      category = rawCategory;
      if (rawCategory.includes("|")) {
        const [name, color] = rawCategory.split("|").map((part: string) => part.trim());
        if (name) category = name;
        if (color) categoryColor = color;
      }
    }

    const colorClass = getColorForCategory(category);

    return {
      title: post.title,
      slug: post.slug,
      date: new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      category,
      color: colorClass,
      categoryColor,
      excerpt: post.excerpt,
      image: post.coverImage || LANDING_IMAGES.news1,
      readingTime: post.readingTime || 5,
    } as {
      title: string;
      slug: string;
      date: string;
      category: string;
      color: string;
      categoryColor?: string;
      excerpt: string;
      image: string;
      readingTime: number;
    };
  });


  return (
    <section 
      id="blog" 
      ref={containerRef}
      className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950"
    >
      <div className={cn("mx-auto px-4 relative z-10", DENTAL_MAX_WIDTH)}>
        
        {/* Header content */}
        {!hideHeader && (
          <div className="flex flex-col items-center text-center mb-6 md:mb-8 px-4">
             <motion.div 
                initial={reduced ? {} : { opacity: 0, scale: 0.8 }} animate={showInView ? { opacity: 1, scale: 1 } : noAnim ?? {}}
                className="inline-flex items-center px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6"
             >
                {t("badge")}
             </motion.div>
             
             <h2 className={cn("text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.2] mb-4 md:mb-6 break-words", DENTAL_FONT_HEADING)}>
                <VerticalCutReveal splitBy="words" autoStart={isInView}>
                  {t("title")}
                </VerticalCutReveal>
             </h2>

             <motion.p 
               initial={initialUp}
               animate={animateUp}
               transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
               className="max-w-2xl text-sm md:text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed break-words"
             >
               {t("subtitle")}
             </motion.p>
          </div>
        )}

        {/* Blog Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {POSTS.map(({ title, slug, date, excerpt, image, category, color, categoryColor, readingTime }, idx) => (
            <motion.div
              key={title}
              custom={idx}
              initial={initialUp}
              animate={animateUp}
              transition={transitionCard(idx)}
              className="relative group flex flex-col rounded-[32px] overflow-hidden cursor-pointer bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500"
            >
              <Link href={`/blog/${slug}`} className="absolute inset-0 z-30"></Link>
              
              {/* Image Section */}
              <div className="relative h-[200px] w-full overflow-hidden">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500"></div>
                
                {/* Category Badge - Over Image */}
                <div className="absolute top-5 left-5 z-20">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-lg",
                      color
                    )}
                    style={categoryColor ? { backgroundColor: categoryColor } : undefined}
                  >
                    {category}
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="relative p-3 md:p-4 flex flex-col flex-1 bg-white dark:bg-slate-950 transition-colors duration-500">
                <div className="flex items-center gap-4 mb-3 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-rose-500" />
                    {date}
                  </div>
                  <div className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-rose-500" />
                    {readingTime} {t("minRead")}
                  </div>
                </div>

                <h3 className={cn("text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-3 transition-colors duration-300 line-clamp-2", DENTAL_FONT_HEADING)}>
                  {title}
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 mb-6">
                  {excerpt}
                </p>

                <div className="mt-auto flex items-center text-[10px] font-black uppercase tracking-widest text-rose-500 group-hover:gap-2.5 gap-2 transition-all">
                  {t("readMore") || "Read Article"}
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More Button - Secondary */}
        {!hideButton && (
          <motion.div 
             initial={initialUp}
             animate={animateUp}
             transition={reduced ? { duration: 0 } : { delay: 0.5, duration: 0.8 }}
             className="mt-12 flex justify-center"
          >
             <LandingButton 
               variant="secondary" 
               size="sm" 
               className="px-6 h-10 group dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:text-white active:scale-95 transition-all"
               asChild
             >
                <Link href="/blog">
                   {t("readMore")}
                   <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
             </LandingButton>
          </motion.div>
        )}
      </div>
    </section>
  );
}
