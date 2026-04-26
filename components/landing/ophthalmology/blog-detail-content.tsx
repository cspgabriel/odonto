"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Calendar, MessageCircle, User, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";
import { OPHTHALMOLOGY_MAX_WIDTH, OPHTHALMOLOGY_FONT_HEADING } from "./config";
import { OphthalmologyNavbar, OphthalmologyFooter, OphthalmologyTopBar, OphthalmologyBackToTop } from ".";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LandingSettings } from "@/lib/validations/landing-settings";
import { OphthalmologyThemeProvider } from "./ophthalmology-theme-provider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCategoryBadgeColor } from "@/lib/constants/blog";
import { BlogComments } from "./blog-comments";

const POSTS_DATA: Record<string, any> = {
  "tips-for-healthy-smile": {
    title: "Tips for Maintaining a Healthy Smile",
    date: "Feb 10, 2025",
    category: "Oral Health",
    author: "Dr. Emma Foster",
    image: LANDING_IMAGES.news1,
    commentsEnabled: true,
    id: "static-1",
    content: (
      <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
        <p>
          A beautiful smile starts with more than just brushing. It's about a comprehensive approach to oral hygiene and professional care that lasts a lifetime. In this guide, we'll explore the essential habits that keep your teeth and gums in top shape.
        </p>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-4">1. The Fundamentals of Brushing</h3>
        <p>
          Most people brush their teeth, but not everyone does it correctly. You should use a soft-bristled toothbrush and fluoride toothpaste. Hold the brush at a 45-degree angle to your gums and use gentle, circular motions. Don't forget to brush your tongue!
        </p>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-4">2. Flossing is Non-Negotiable</h3>
        <p>
          Flossing reaches the areas where your toothbrush cannot. It removes plaque and food particles from between your teeth and under the gumline. If you skip flossing, you're missing about 35% of your tooth surfaces.
        </p>
        <div className="bg-teal-50 dark:bg-teal-900/10 p-8 rounded-3xl border border-teal-100 dark:border-teal-900/20 my-10">
           <p className="text-teal-600 dark:text-teal-400 font-bold italic text-xl">
             "Prevention is always better than cure. Regular checkups every six months can save you from complex procedures in the future."
           </p>
           <p className="text-teal-500 font-black text-sm mt-4 uppercase tracking-widest">— Dr. Emma Foster</p>
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-4">3. Watch Your Diet</h3>
        <p>
          What you eat directly affects your dental health. Sugary snacks and acidic drinks can erode your enamel. Instead, opt for crunchy vegetables, dairy products rich in calcium, and plenty of water.
        </p>
      </div>
    )
  },
  "understanding-dental-implants": {
    title: "Understanding Dental Implants",
    date: "Feb 5, 2025",
    category: "Treatments",
    author: "Dr. James K. Wilson",
    image: LANDING_IMAGES.news2,
    commentsEnabled: true,
    id: "static-2",
    content: (
        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
          <p>
            Dental implants are revolutionary for those who have lost teeth. They provide a permanent, natural-looking solution that mimics both the function and appearance of real teeth.
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-4">What Are Dental Implants?</h3>
          <p>
            An implant is a small titanium post that is surgically placed into the jawbone. Over time, it fuses with the bone to provide a sturdy base for a custom-made crown.
          </p>
          <Image src={LANDING_IMAGES.news2} width={800} height={450} sizes="(max-width: 768px) 100vw, 800px" className="w-full rounded-[40px] my-10 shadow-2xl object-cover" alt="Dental implant procedure — natural-looking tooth replacement" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-4">The Recovery Phase</h3>
          <p>
            Recovery varies from person to person, but most patients return to their normal routine within a few days. The total process of osseointegration (bone fusing) can take several months, but the result is a life-long replacement.
          </p>
        </div>
      )
  },
  "emergency-dentist-guide": {
    title: "When to See an Emergency Dentist",
    date: "Jan 28, 2025",
    category: "Urgent",
    author: "Emergency Response Team",
    image: LANDING_IMAGES.news3,
    commentsEnabled: true,
    id: "static-3",
    content: (
        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
          <p>
            Dental emergencies can be frightening and painful. Knowing when to seek immediate care and what to do in the meantime can make a significant difference in saving a tooth.
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-4">Signs of a Dental Emergency</h3>
          <ul className="list-disc ps-6 space-y-4">
            <li>Severe, persistent toothache that radiates to the jaw or neck.</li>
            <li>A knocked-out tooth (time is of the essence!).</li>
            <li>A fractured or broken tooth causing pain or sharp edges.</li>
            <li>Swelling in the gums or face, which could indicate an infection.</li>
          </ul>
        </div>
      )
  },
  "digital-dentistry-innovation": {
    title: "New Technology in Digital Dentistry",
    date: "Jan 15, 2025",
    category: "Innovation",
    author: "Clinical Tech Unit",
    image: LANDING_IMAGES.news1,
    commentsEnabled: true,
    id: "static-4",
    content: (
        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
          <p>
            Innovation is at the heart of our clinic. Digital dentistry has completely changed the patient experience, making it faster, more accurate, and far more comfortable.
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-4">3D Scanning &amp; Imaging</h3>
          <p>
            Gone are the days of messy impressions. Our digital scanners capture thousands of images per second to create a perfect 3D model of your mouth in minutes.
          </p>
        </div>
      )
  }
};

interface BlogDetailContentProps {
  branding?: LandingSettings["branding"];
  colors?: LandingSettings["colors"];
  dbPost?: any;
  features?: any;
  footer?: LandingSettings["footer"];
  contact?: LandingSettings["contact"];
  social?: LandingSettings["social"];
}

export function BlogDetailContent({ branding, colors, dbPost, features, footer, contact, social }: BlogDetailContentProps) {
  const { slug } = useParams();
  const locale = useLocale();
  const t = useTranslations("landing.blogPage");
  
  let post = POSTS_DATA[slug as string];
  let postComments: any[] = [];

  if (dbPost) {
    const authorDisplay = dbPost.customAuthorName || dbPost.author?.fullName || "Editorial Team";
    postComments = dbPost.comments || [];
    post = {
      id: dbPost.id,
      title: dbPost.title,
      date: new Date(dbPost.publishedAt || dbPost.createdAt).toLocaleDateString(locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : locale === "es" ? "es" : "en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      }),
      category: dbPost.category?.name ?? (dbPost.tags ? dbPost.tags.split(",")[0].trim() : "News"),
      color: "bg-teal-500",
      categoryColorHex: dbPost.category ? getCategoryBadgeColor(dbPost.category.id, dbPost.category.color) : undefined,
      author: authorDisplay,
      image: dbPost.coverImage || LANDING_IMAGES.news1,
      commentsEnabled: dbPost.commentsEnabled ?? true,
      tags: dbPost.tags,
      // Remove a leading markdown title (e.g. "# My Title") from the content to avoid duplication
      content: (
        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl font-black text-slate-900 dark:text-white pt-6 mb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-6 mb-4" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-black text-slate-900 dark:text-white pt-4 mb-2" {...props} />,
              p: ({node, ...props}) => <p className="mb-4" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc ps-6 space-y-4 mb-4" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal ps-6 space-y-2 mb-4" {...props} />,
              li: ({node, ...props}) => <li className="ps-1" {...props} />,
              blockquote: ({node, children, ...props}) => (
                <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 my-8">
                  <p className="text-primary font-bold italic text-xl">
                    {children}
                  </p>
                </div>
              ),
              img: ({node, ...props}) => (
                <span className="block relative w-full aspect-video my-8 rounded-[32px] overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800">
                  <Image src={props.src || ""} alt={props.alt || "Blog image"} fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" />
                </span>
              )
            }}
          >
            {(() => {
              // Strip a leading markdown heading if present
              const raw = dbPost.content || "";
              return raw.replace(/^#\s.*\n/, "");
            })()}
          </ReactMarkdown>
        </div>
      )
    };
  }

  if (!post) {
      return (
        <div className="ophthalmology-landing min-h-screen flex flex-col bg-white dark:bg-slate-950">
           <OphthalmologyTopBar features={features} colors={colors} />
           <OphthalmologyNavbar branding={branding} features={features} />
           <main className="flex-1 flex items-center justify-center pt-[8rem] pb-24">
              <div className="text-center space-y-6 px-4">
                 <h1 className="text-4xl md:text-5xl font-black text-teal-500">{t("postNotFound")}</h1>
                 <p className="text-slate-500 text-lg">{t("postNotFoundDesc")}</p>
                 <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal-500 text-white font-bold hover:bg-teal-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> {t("backToHome")}
                 </Link>
              </div>
           </main>
           <OphthalmologyFooter branding={branding ?? undefined} footer={footer ?? undefined} contact={contact ?? undefined} social={social ?? undefined} />
        </div>
      );
  }

  return (
    <>
      <OphthalmologyThemeProvider colors={colors!} />
      <div className="ophthalmology-landing min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <OphthalmologyTopBar features={features} colors={colors} />
      <OphthalmologyNavbar branding={branding} features={features} />
      <OphthalmologyBackToTop />
      
      <main className="flex-1 pt-28 md:pt-36 pb-24">
        <article className={cn("mx-auto px-6 max-w-4xl")}>

          {/* ── Hero Cover with Overlay ── */}
          <div className="relative mt-6 aspect-[21/9] w-full rounded-[40px] overflow-hidden mb-16 border border-slate-100 dark:border-slate-800 group shadow-2xl shadow-slate-200/40 dark:shadow-black/40">
            <Image 
              src={post.image} 
              alt={post.title} 
              fill 
              className="object-cover transition-transform group-hover:scale-105" 
              style={{ transitionDuration: "2000ms" }}
              priority
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />

            {/* Content pinned to bottom-left */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
              <div className="max-w-3xl">
                {/* Category Badge */}
                <div
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-lg mb-5",
                    !post.categoryColorHex && (post.color || "bg-teal-500")
                  )}
                  style={post.categoryColorHex ? { backgroundColor: post.categoryColorHex } : undefined}
                >
                  {post.category}
                </div>

                {/* Title */}
                <h1 className={cn("text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-6", OPHTHALMOLOGY_FONT_HEADING)}>
                  {post.title}
                </h1>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-3 md:gap-6 text-white/70 font-bold text-[9px] uppercase tracking-widest pt-5 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="text-white/90">{post.author}</span>
                  </div>
                  <div className="hidden md:block w-1 h-1 bg-white/20 rounded-full" />
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {post.date}
                  </div>
                  <div className="hidden md:block w-1 h-1 bg-white/20 rounded-full" />
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    {postComments.length > 0
                      ? postComments.length === 1
                        ? t("commentsOne")
                        : t("commentsCount", { count: postComments.length })
                      : post.commentsEnabled
                        ? t("commentsZero")
                        : t("commentsOff")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Article Body ── */}
          <div>
            {post.content}

            {/* Footer Tags */}
            <div className="mt-16 pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("tags")}</span>
                {(post.tags ? post.tags.split(",") : ["Dental Health", "Hygiene"]).map((tag: string) => (
                  <span
                    key={tag.trim()}
                    className="px-4 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-[10px] font-bold border border-slate-100 dark:border-slate-800"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({ title: post.title, url: window.location.href }).catch(() => {});
                  } else if (typeof navigator !== "undefined") {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {t("shareArticle")}
              </button>
            </div>

            {/* ── Comments ── */}
            {post.commentsEnabled && (
              <BlogComments
                postId={post.id}
                initialComments={postComments}
                translations={{
                  commentsOne: t("commentsOne"),
                  commentsCount: t("commentsCount"),
                  joinConversation: t("joinConversation"),
                  addComment: t("addComment"),
                  cancel: t("cancel"),
                  leaveComment: t("leaveComment"),
                  name: t("name"),
                  emailOptional: t("emailOptional"),
                  comment: t("comment"),
                  yourName: t("yourName"),
                  yourEmail: t("yourEmail"),
                  shareThoughts: t("shareThoughts"),
                  postComment: t("postComment"),
                  posting: t("posting"),
                  noCommentsYet: t("noCommentsYet"),
                  commentPosted: t("commentPosted"),
                  failedToPost: t("failedToPost"),
                  justNow: t("justNow"),
                  minutesAgo: t("minutesAgo"),
                  hoursAgo: t("hoursAgo"),
                  daysAgo: t("daysAgo"),
                }}
              />
            )}
          </div>
        </article>
      </main>

      <OphthalmologyFooter branding={branding ?? undefined} footer={footer ?? undefined} contact={contact ?? undefined} social={social ?? undefined} />
      </div>
    </>
  );
}
