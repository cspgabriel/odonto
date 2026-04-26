"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING } from "./config";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { getCategoryBadgeColor } from "@/lib/constants/blog";

export function OphthalmologyNews({ 
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
  const showInView = !reduced && isInView;
  const initialUp = reduced ? {} : { opacity: 0, y: 20 };
  const animateUp = reduced || !isInView ? {} : { opacity: 1, y: 0 };
  const initialCard = reduced ? {} : { opacity: 0, y: 16 };
  const animateCard = reduced || !isInView ? {} : { opacity: 1, y: 0 };
  const transCard = (idx: number) => (reduced ? { duration: 0 } : { duration: 0.4, delay: idx * 0.08 });

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

    return {
      title: post.title,
      slug: post.slug,
      date: new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      category,
      categoryColor,
      excerpt: post.excerpt,
      image: post.coverImage || LANDING_IMAGES.news1,
      readingTime: post.readingTime || 5,
    } as {
      title: string;
      slug: string;
      date: string;
      category: string;
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
      <div className={cn("mx-auto px-4 relative z-10", OPHTHALMOLOGY_MAX_WIDTH)}>
        
        {/* Header content */}
        {!hideHeader && (
          <div className="flex flex-col items-center text-center mb-6 md:mb-8 px-4">
             <motion.div 
                initial={reduced ? {} : { opacity: 0, scale: 0.8 }} animate={showInView ? { opacity: 1, scale: 1 } : {}}
                className="inline-flex items-center px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6"
             >
                {t("badge")}
             </motion.div>
             
             <h2 className={cn("text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.2] mb-4 md:mb-6 break-words", OPHTHALMOLOGY_FONT_HEADING)}>
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

        {/* Blog Grid – show up to 3 latest posts */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 p-2 md:p-0">
          {POSTS.slice(0, 3).map(({ title, slug, date, excerpt, image, category, categoryColor, readingTime }, idx) => (
            <motion.div
              key={title}
              initial={initialCard}
              animate={animateCard}
              transition={transCard(idx)}
            >
              <Link
                href={`/blog/${slug}`}
                className={cn(
                  "group flex flex-col gap-2 rounded-2xl p-2 transition-colors duration-200",
                  "hover:bg-teal-50/70 dark:hover:bg-teal-900/20 active:bg-teal-100/80 dark:active:bg-teal-900/30"
                )}
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
                  <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {category && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white bg-slate-900/80"
                        style={categoryColor ? { backgroundColor: categoryColor } : undefined}
                      >
                        {category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 px-1 pb-1">
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    <span>{date}</span>
                    <span className="bg-slate-300 dark:bg-slate-600 size-1 rounded-full shrink-0" />
                    <span>{readingTime} {t("minRead")}</span>
                  </div>
                  <h3
                    className={cn(
                      "line-clamp-2 text-lg leading-tight font-semibold tracking-tight text-slate-900 dark:text-white",
                      OPHTHALMOLOGY_FONT_HEADING
                    )}
                  >
                    {title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 line-clamp-3 text-sm leading-relaxed">
                    {excerpt}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* See more link */}
        {!hideButton && (
          <motion.div
            initial={reduced ? {} : { opacity: 0 }}
            animate={showInView ? { opacity: 1 } : {}}
            transition={reduced ? { duration: 0 } : { delay: 0.4 }}
            className="mt-10 flex justify-center"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-transparent px-6 h-10 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {t("readMore")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
