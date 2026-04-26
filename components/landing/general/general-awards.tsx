"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  GENERAL_SECTION_TITLE,
  GENERAL_RADIUS_CARD,
  GENERAL_FONT_HEADING,
  GENERAL_GRADIENT,
} from "./config";
import { GENERAL_IMAGES } from "./constants";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const CARD_WIDTH = 260;
const CARD_HEIGHT = 200;
const CARD_GAP = 20;

const YEARS = ["2024", "2023", "2022", "2021", "2020", "2019"] as const;
const AWARD_LOGOS = [GENERAL_IMAGES.aboutLogo1, GENERAL_IMAGES.aboutLogo2] as const;

export function GeneralAwards() {
  const t = useTranslations("landing.awards");
  const containerRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const [selectedYear, setSelectedYear] = useState<string | "all">("all");
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScroll, setDragStartScroll] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const getMaxScroll = useCallback(() => {
    if (!viewportRef.current || !trackRef.current) return 0;
    return Math.max(0, trackRef.current.offsetWidth - viewportRef.current.clientWidth);
  }, []);

  const clampScroll = useCallback(
    (value: number) => Math.max(0, Math.min(value, getMaxScroll())),
    [getMaxScroll]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.pageX);
    setDragStartScroll(scrollLeft);
  }, [scrollLeft]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const walk = (e.pageX - dragStartX) * 1.2;
      setScrollLeft(clampScroll(dragStartScroll - walk));
    },
    [dragStartX, dragStartScroll, clampScroll]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 2) return;
      e.preventDefault();
      setScrollLeft((prev) => clampScroll(prev + delta));
    },
    [clampScroll]
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const awards = [
    { year: "2024", titleKey: "award1Title", bodyKey: "award1Body", affiliationKey: "award1Affiliation", logoIdx: 0 },
    { year: "2024", titleKey: "award2Title", bodyKey: "award2Body", affiliationKey: "award2Affiliation", logoIdx: 1 },
    { year: "2023", titleKey: "award3Title", bodyKey: "award3Body", affiliationKey: "award3Affiliation", logoIdx: 0 },
    { year: "2023", titleKey: "award4Title", bodyKey: "award4Body", affiliationKey: "award4Affiliation", logoIdx: 1 },
    { year: "2022", titleKey: "award5Title", bodyKey: "award5Body", affiliationKey: "award5Affiliation", logoIdx: 0 },
    { year: "2022", titleKey: "award6Title", bodyKey: "award6Body", affiliationKey: "award6Affiliation", logoIdx: 1 },
    { year: "2021", titleKey: "award7Title", bodyKey: "award7Body", affiliationKey: "award7Affiliation", logoIdx: 0 },
    { year: "2021", titleKey: "award8Title", bodyKey: "award8Body", affiliationKey: "award8Affiliation", logoIdx: 1 },
    { year: "2020", titleKey: "award9Title", bodyKey: "award9Body", affiliationKey: "award9Affiliation", logoIdx: 0 },
    { year: "2020", titleKey: "award10Title", bodyKey: "award10Body", affiliationKey: "award10Affiliation", logoIdx: 1 },
    { year: "2019", titleKey: "award11Title", bodyKey: "award11Body", affiliationKey: "award11Affiliation", logoIdx: 0 },
    { year: "2019", titleKey: "award12Title", bodyKey: "award12Body", affiliationKey: "award12Affiliation", logoIdx: 1 },
  ] as const;

  const filtered =
    selectedYear === "all"
      ? awards
      : awards.filter((a) => a.year === selectedYear);

  const cardStep = CARD_WIDTH + CARD_GAP;
  const viewportCenter = scrollLeft + viewportWidth / 2;
  const centerIndex = Math.round(viewportCenter / cardStep - 0.5);
  const featuredIndex =
    filtered.length > 0
      ? Math.max(0, Math.min(centerIndex, filtered.length - 1))
      : 0;

  // Track viewport width so we know which card is at center
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const setW = () => setViewportWidth(el.clientWidth);
    setW();
    const ro = new ResizeObserver(setW);
    ro.observe(el);
    return () => ro.unobserve(el);
  }, []);

  // Reset scroll when switching year so the new cards are in view
  useEffect(() => {
    setScrollLeft(0);
  }, [selectedYear]);

  const initial = reduced ? {} : { opacity: 0, y: 20 };
  const animate = reduced || !isInView ? {} : { opacity: 1, y: 0 };

  return (
    <section
      id="awards"
      ref={containerRef}
      className={cn(
        "relative border-t border-slate-200/60 dark:border-t-0 overflow-x-hidden overflow-y-hidden py-8 lg:py-10",
        GENERAL_GRADIENT
      )}
    >
      {/* Subtle grid – matches stats section */}
      <div className="absolute inset-0 -z-10 opacity-[0.5] bg-[linear-gradient(to_right,#0cc0df08_1px,transparent_1px),linear-gradient(to_bottom,#0cc0df08_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="relative z-10 mx-auto px-4 w-full lg:max-w-7xl py-0">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
          {/* Left: Title, description, year filters */}
          <div className="space-y-4">
            <motion.h2
              initial={initial}
              animate={animate}
              transition={{ duration: 0.4 }}
              className={cn(GENERAL_SECTION_TITLE)}
            >
              {t("title")}
            </motion.h2>
            <motion.p
              initial={initial}
              animate={animate}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed"
            >
              {t("description")}
            </motion.p>
            <motion.div
              initial={initial}
              animate={animate}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col gap-2"
            >
              <div className="flex flex-wrap gap-2">
                {YEARS.slice(0, 3).map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      selectedYear === year
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/60 text-primary hover:bg-primary/10 dark:border-primary/60 dark:text-primary dark:hover:bg-primary/20"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {YEARS.slice(3).map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      selectedYear === year
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/60 text-primary hover:bg-primary/10 dark:border-primary/60 dark:text-primary dark:hover:bg-primary/20"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Transform-based scroll – no overflow so no scrollbar ever */}
          <div className="-mr-4 lg:mr-[calc(-50vw+50%)]">
            <motion.div initial={initial} animate={animate} transition={{ duration: 0.4, delay: 0.1 }}>
              <div
                ref={viewportRef}
                role="region"
                aria-label="Awards carousel"
                onMouseDown={handleMouseDown}
                className={cn(
                  "overflow-hidden pl-0 pr-0 select-none cursor-grab",
                  isDragging && "cursor-grabbing"
                )}
              >
                <div
                  ref={trackRef}
                  className="flex min-w-max items-stretch will-change-transform"
                  style={{
                    gap: CARD_GAP,
                    transform: `translateX(-${scrollLeft}px)`,
                    transition: isDragging ? "none" : "transform 0.3s ease-out",
                  }}
                >
              {filtered.map((award, idx) => {
                const isFeatured = idx === featuredIndex;
                return (
                  <motion.div
                    key={`${award.year}-${award.titleKey}-${idx}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                      width: CARD_WIDTH,
                      minHeight: CARD_HEIGHT,
                      flexShrink: 0,
                    }}
                    className={cn(
                      "flex flex-col rounded-2xl border border-slate-200/50 p-4",
                      "bg-white dark:bg-slate-900/90 dark:border-slate-700/50",
                      "shadow-none",
                      GENERAL_RADIUS_CARD
                    )}
                    animate={
                      reduced ? undefined : { scale: isFeatured ? 1.08 : 1 }
                    }
                  >
                    <div className="flex justify-center mb-3">
                      <Image
                        src={AWARD_LOGOS[award.logoIdx]}
                        alt=""
                        width={80}
                        height={80}
                        className="object-contain h-16 w-16 sm:h-20 sm:w-20 max-w-full"
                      />
                    </div>
                    <h3
                      className={cn(
                        "text-center text-base font-bold text-slate-900 dark:text-white mb-1.5",
                        GENERAL_FONT_HEADING
                      )}
                    >
                      {t(award.titleKey)}
                    </h3>
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 leading-snug">
                      {t(award.bodyKey)}
                    </p>
                    <div className="flex-1 min-h-[0.5rem]" />
                    <p className="text-center text-sm font-medium text-primary pt-2">
                      {t(award.affiliationKey)}
                    </p>
                  </motion.div>
                );
              })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
