"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { GENERAL_MAX_WIDTH, GENERAL_SECTION_TITLE, GENERAL_SECTION_DESCRIPTION, GENERAL_SECTION_PADDING, GENERAL_SECTION_BORDER, GENERAL_SECTION_BG, GENERAL_TITLE_DESCRIPTION_GAP, GENERAL_HEADER_CONTENT_GAP, GENERAL_FONT_HEADING, GENERAL_RADIUS_CARD } from "./config";
import { LandingButton } from "@/components/ui/landing-button";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { getCategoryBadgeColor } from "@/lib/constants/blog";

/** Category → Tailwind badge/ring classes for general (primary/cyan) theme */
export function getColorForCategory(category: string): string {
  const cat = (category ?? "").toLowerCase();
  if (cat.includes("news")) return "bg-cyan-500 ring-cyan-500/30";
  if (cat.includes("innovation") || cat.includes("tech")) return "bg-blue-500 ring-blue-500/30";
  if (cat.includes("urgent") || cat.includes("emergency")) return "bg-amber-500 ring-amber-500/30";
  if (cat.includes("treatment") || cat.includes("care")) return "bg-emerald-500 ring-emerald-500/30";
  if (cat.includes("tips") || cat.includes("health")) return "bg-violet-500 ring-violet-500/30";
  return "bg-slate-500 ring-slate-500/30";
}

type PostItem = { title: string; slug: string; excerpt: string; image: string; date: string; category: string; categoryColor?: string };

function CategoryBadge({ category, categoryColor }: { category: string; categoryColor?: string }) {
  return (
    <span
      className="inline-flex px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-md bg-primary"
      style={categoryColor ? { backgroundColor: categoryColor } : undefined}
    >
      {category}
    </span>
  );
}

function ArticleCardFeatured({ post, t }: { post: PostItem; t: (k: string) => string }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group h-full min-h-[320px] md:min-h-[360px]">
      <div
        className={cn(
          "relative h-full min-h-[320px] md:min-h-[360px] overflow-hidden rounded-2xl bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]",
          GENERAL_RADIUS_CARD
        )}
      >
        <Image src={post.image} alt={post.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm md:text-base font-semibold uppercase tracking-wider text-white/95">{post.date}</span>
              <CategoryBadge category={post.category} categoryColor={post.categoryColor} />
            </div>
            <h3 className={cn("text-xl md:text-2xl font-bold text-white leading-tight line-clamp-3 max-w-md", GENERAL_FONT_HEADING)}>
              {post.title}
            </h3>
          </div>
          <div className="bottom-info">
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity group-hover:opacity-90">
              {t("readMore") || "Read More"}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCardLarge({ post, t }: { post: PostItem; t: (k: string) => string }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group h-full min-h-[320px] md:min-h-[360px]">
      <div
        className={cn(
          "relative h-full min-h-[320px] md:min-h-[360px] overflow-hidden rounded-2xl bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]",
          GENERAL_RADIUS_CARD
        )}
      >
        <Image src={post.image} alt={post.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm md:text-base font-semibold uppercase tracking-wider text-white/95">{post.date}</span>
              <CategoryBadge category={post.category} categoryColor={post.categoryColor} />
            </div>
            <h3 className={cn("text-xl md:text-2xl font-bold text-white leading-tight line-clamp-3 max-w-md", GENERAL_FONT_HEADING)}>
              {post.title}
            </h3>
          </div>
          <div className="bottom-info flex justify-end">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition-transform group-hover:scale-110">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCardNoImage({ post, t }: { post: PostItem; t: (k: string) => string }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex h-full min-h-[200px] flex-col justify-between rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900/80",
        GENERAL_RADIUS_CARD
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{post.date}</span>
          <CategoryBadge category={post.category} categoryColor={post.categoryColor} />
        </div>
        <h3 className={cn("text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-snug line-clamp-3 max-w-[14rem] break-words", GENERAL_FONT_HEADING)}>
          {post.title}
        </h3>
      </div>
      <div className="bottom-info ms-auto">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/60 bg-white text-slate-700 shadow-sm transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
    </Link>
  );
}

function ArticleCardSmall({ post, t }: { post: PostItem; t: (k: string) => string }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group h-full min-h-[200px]">
      <div
        className={cn(
          "relative h-full min-h-[200px] overflow-hidden rounded-2xl bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]",
          GENERAL_RADIUS_CARD
        )}
      >
        <Image src={post.image} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/90">{post.date}</span>
            <CategoryBadge category={post.category} categoryColor={post.categoryColor} />
          </div>
          <div className="bottom-info flex items-end justify-between gap-3">
            <h3 className={cn("text-base font-bold text-white leading-tight line-clamp-3 min-w-0 max-w-[85%]", GENERAL_FONT_HEADING)}>
              {post.title}
            </h3>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-slate-800 transition-transform group-hover:scale-110">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Uniform card for blog list page – same layout as dental, global (primary) colors */
function ArticleCardUniform({
  post,
  t,
}: {
  post: PostItem & { readingTime?: number };
  t: (k: string) => string;
}) {
  return (
    <div className="relative group flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 shadow-sm transition-all duration-300">
      <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-30" />
      <div className="relative h-[200px] w-full overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
        <div className="absolute top-4 left-4 z-20">
          <span
            className="inline-flex px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-md bg-primary"
            style={post.categoryColor ? { backgroundColor: post.categoryColor } : undefined}
          >
            {post.category}
          </span>
        </div>
      </div>
      <div className="relative p-4 flex flex-col flex-1 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {post.date}
          </div>
          {(post.readingTime ?? 0) > 0 && (
            <>
              <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {post.readingTime} {t("minRead")}
              </div>
            </>
          )}
        </div>
        <h3 className={cn("text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2", GENERAL_FONT_HEADING)}>
          {post.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-center text-[10px] font-bold uppercase tracking-wider text-primary gap-2 group-hover:gap-3 transition-all">
          {t("readMore") || "Read Article"}
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

export function GeneralNews({ 
  initialPosts, 
  hideHeader = false, 
  hideButton = false,
  blogPageLayout = false,
}: { 
  initialPosts?: any[]; 
  hideHeader?: boolean; 
  hideButton?: boolean;
  /** When true, render only a simple grid of uniform cards (no section) – for /blog page */
  blogPageLayout?: boolean;
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

  const POSTS = (initialPosts ?? []).map((post) => {
    const categoryName = post.category?.name ?? (post.tags ? String(post.tags).split(",")[0]?.trim() : "News") ?? "News";
    const categoryColor = post.category ? getCategoryBadgeColor(post.category.id, post.category.color) : getCategoryBadgeColor(categoryName, null);
    return {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      image: post.coverImage || LANDING_IMAGES.news1,
      date: new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      category: categoryName,
      categoryColor,
      readingTime: post.readingTime ?? 5,
    };
  });

  /* Blog list page: no section, just grid of uniform cards below page title (like dental) */
  if (blogPageLayout) {
    return (
      <div ref={containerRef as React.RefObject<HTMLDivElement>} className={cn("mx-auto px-4 pt-8", GENERAL_MAX_WIDTH)}>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {POSTS.map((post, idx) => (
            <motion.div
              key={post.slug}
              initial={initialUp}
              animate={animateUp}
              transition={transitionCard(idx)}
            >
              <ArticleCardUniform post={post} t={t} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section 
      id="blog" 
      ref={containerRef}
      className={cn("relative overflow-hidden", GENERAL_SECTION_BORDER, GENERAL_SECTION_BG, GENERAL_SECTION_PADDING)}
    >
      <div className={cn("mx-auto px-4 relative z-10", GENERAL_MAX_WIDTH)}>
        
        {/* Header content */}
        {!hideHeader && (
          <div className={cn("flex flex-col items-center text-center px-4", GENERAL_HEADER_CONTENT_GAP)}>
             <h2 className={cn(GENERAL_SECTION_TITLE, GENERAL_TITLE_DESCRIPTION_GAP)}>
                <VerticalCutReveal splitBy="words" autoStart={isInView}>
                  {t("title")}
                </VerticalCutReveal>
             </h2>

             <motion.p 
               initial={initialUp}
               animate={animateUp}
               transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
               className={cn("max-w-2xl break-words", GENERAL_SECTION_DESCRIPTION)}
             >
               {t("subtitle")}
             </motion.p>
          </div>
        )}

        {/* Blog Grid – dz-card style: row g-20, col-lg-4 | col-xl-5 col-lg-8 | col-xl-3 (nested 2 cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {POSTS[0] && (
            <motion.div
              initial={initialUp}
              animate={animateUp}
              transition={transitionCard(0)}
              className="lg:col-span-4"
            >
              <ArticleCardFeatured post={POSTS[0]} t={t} />
            </motion.div>
          )}
          {POSTS[1] && (
            <motion.div
              initial={initialUp}
              animate={animateUp}
              transition={transitionCard(1)}
              className="lg:col-span-8 xl:col-span-5"
            >
              <ArticleCardLarge post={POSTS[1]} t={t} />
            </motion.div>
          )}
          <div className="lg:col-span-12 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5">
            {POSTS[2] && (
              <motion.div initial={initialUp} animate={animateUp} transition={transitionCard(2)}>
                <ArticleCardNoImage post={POSTS[2]} t={t} />
              </motion.div>
            )}
            {POSTS[3] && (
              <motion.div initial={initialUp} animate={animateUp} transition={transitionCard(3)}>
                <ArticleCardSmall post={POSTS[3]} t={t} />
              </motion.div>
            )}
          </div>
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
