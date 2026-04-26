"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_FONT_HEADING, OPHTHALMOLOGY_MAX_WIDTH } from "./config";
import { LandingButton } from "@/components/ui/landing-button";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { ContentSettings } from "@/lib/validations/landing-settings";

const HERO_BG_IMAGE = "/landing/ophthalmology/images/hero.png";

/** 3 illustrations around the hero content (left, right, bottom) – not overlapping text */
const HERO_ILLUSTRATIONS = [
  { src: "/landing/ophthalmology/images/hero-illus-3.png", position: "right-0 top-1/2 -translate-y-1/2 translate-x-full xl:translate-x-[120%]", size: "w-20 h-auto max-w-[80px]", label: "eyeglasses" },
  { src: "/landing/ophthalmology/images/hero-illus-4.png", position: "left-0 top-1/2 -translate-y-1/2 -translate-x-full xl:-translate-x-[120%]", size: "w-24 h-auto max-w-[96px]", label: "phoropter" },
  { src: "/landing/ophthalmology/images/hero-illus-5.png", position: "left-1/2 -translate-x-1/2 -translate-y-full bottom-0 -mb-2", size: "w-28 h-auto max-w-[112px]", label: "Snellen chart" },
] as const;

const TITLE_ILLU_SVG = "/landing/ophthalmology/images/title-illu.svg";

const FADE_IN_VARIANTS = (reduced: boolean) => ({
  hidden: reduced ? {} : { opacity: 0, y: 10 },
  show: reduced
    ? {}
    : { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
});

export function OphthalmologyHero({ hero }: { hero?: ContentSettings["hero"] }) {
  const t = useTranslations("landing.hero");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const variants = FADE_IN_VARIANTS(reduced);

  const rawHeadline = (locale === "en" && hero?.headline) ? hero.headline : t("headline");
  const headline = rawHeadline === "See the World More Clearly" ? "Your Vision is our Mission" : rawHeadline;
  const subtitle = (locale === "en" && hero?.subtitle) ? hero.subtitle : t("subtitle");
  const tagline = t("tagline");
  const ctaText = t("heroCta");

  // Full viewport height + nav offset; shorter on mobile
  const sectionHeightWithNav = "min-h-[calc(100vh+8rem)] min-h-[calc(100dvh+8rem)] h-[calc(100dvh+8rem)] max-md:min-h-[calc(85dvh+5.5rem)] max-md:h-[calc(85dvh+5.5rem)]";

  return (
    <section
      id="hero"
      className={cn(
        "relative z-0 w-full overflow-hidden",
        sectionHeightWithNav,
        "flex flex-col items-center text-center px-4",
        "-mt-[8rem] pt-[8rem] max-md:-mt-[5.5rem] max-md:pt-[5.5rem]"
      )}
    >
      {/* Hero image – behind everything; object-position improves mobile crop */}
      <div className={cn("absolute inset-0 -z-[1] w-full overflow-hidden", sectionHeightWithNav)} aria-hidden>
        <Image
          src={HERO_BG_IMAGE}
          alt="Ophthalmology clinic hero — professional eye care and vision health"
          fill
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EACMQAAIBBAIDAQAAAAAAAAAAAAECAAMEBREhMRIiQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Amr+zLXSrTLpKrERRbPQ3sY1b0q9eDvjLxjmgm5Q2xAeJqeT56YrmhJJJJJP/2Q=="
          sizes="100vw"
          className="object-cover object-center max-md:object-[center_35%]"
        />
      </div>
      {/* Overlay: dark in light mode, dark in dark mode – ensures readable contrast */}
      <div
        className={cn(
          "absolute inset-0 -z-[0] w-full",
          "bg-gradient-to-b from-black/35 via-black/45 to-black/40",
          "dark:from-slate-950/50 dark:via-slate-950/60 dark:to-slate-950/55",
          sectionHeightWithNav
        )}
        aria-hidden
      />

      {/* Viewport-height wrapper so content is centered in the middle of the screen */}
      <div className={cn("relative z-10 flex flex-1 flex-col items-center justify-center w-full min-h-[100vh] min-h-[100dvh] max-md:min-h-[70dvh] pt-8 md:pt-12")}>
        <div className={cn("relative flex flex-col items-center w-full", OPHTHALMOLOGY_MAX_WIDTH)}>
        {/* Tagline – small, compact badge */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={variants}
          className="mb-4 inline-flex items-center rounded-full border border-white/50 bg-white/10 dark:bg-primary/10 dark:border-primary/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white dark:text-teal-400 backdrop-blur-sm"
        >
          {tagline}
        </motion.div>

        {/* Main Title – centred, with decorative SVG above left */}
        <div className="relative inline-block">
          <Image
            src={TITLE_ILLU_SVG}
            alt=""
            width={42}
            height={36}
            className="absolute -top-5 -left-8 sm:-left-12 w-8 h-auto sm:w-10"
            aria-hidden
          />
          <motion.h1
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: reduced ? {} : { staggerChildren: 0.08 } },
            }}
            className={cn(
              "text-5xl font-bold leading-tight tracking-tight text-white dark:text-white sm:text-6xl lg:text-7xl",
              OPHTHALMOLOGY_FONT_HEADING
            )}
          >
          {typeof headline === "string"
            ? headline.split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  variants={variants}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))
            : headline}
          </motion.h1>
        </div>

        {/* Description – centred, visible in light mode */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={variants}
          transition={reduced ? {} : { delay: 0.35 }}
          className="mt-6 max-w-xl text-lg text-white/90 dark:text-slate-300 mx-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
        >
          {subtitle}
        </motion.p>

        {/* CTA – centred: Schedule your visit + Contact */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={variants}
          transition={reduced ? {} : { delay: 0.45 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <LandingButton
            size="default"
            variant="primary"
            className="rounded-full min-w-[8.5rem] h-10 px-8 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 shadow-lg shadow-primary/20"
            asChild
          >
            <Link href="/appointment">{ctaText}</Link>
          </LandingButton>
          <LandingButton
            size="default"
            variant="secondary"
            className="rounded-full h-10 px-8 border-2 border-white/60 dark:border-slate-600 bg-white/10 dark:bg-slate-800/80 text-white dark:text-slate-200 hover:bg-white/20 dark:hover:bg-slate-700/80 backdrop-blur-sm"
            asChild
          >
            <Link
              href="#contact"
              onClick={(e) => {
                const el = document.getElementById("contact");
                if (el) {
                  e.preventDefault();
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              {t("contact")}
            </Link>
          </LandingButton>
        </motion.div>

        {/* 3 illustrations around content (left, right, below) – visible, not overlapping text */}
        {HERO_ILLUSTRATIONS.map((illus) => (
          <div
            key={illus.label}
            className={cn(
              "absolute z-[1] pointer-events-none opacity-70 dark:opacity-75 mix-blend-lighten max-md:hidden",
              illus.position,
              illus.size
            )}
            aria-hidden
          >
            <Image
              src={illus.src}
              alt=""
              width={128}
              height={128}
              className="w-full h-auto object-contain"
            />
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
