"use client";

import React, { useState, useRef } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  GENERAL_MAX_WIDTH,
  GENERAL_SECTION_TITLE,
  GENERAL_SECTION_PADDING,
  GENERAL_SECTION_BORDER,
  GENERAL_SECTION_BG,
  GENERAL_TITLE_DESCRIPTION_GAP,
  GENERAL_HEADER_CONTENT_GAP,
  GENERAL_RADIUS_SMALL,
  GENERAL_FONT_HEADING,
} from "./config";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const CATEGORY_KEYS = ["appointments", "services", "insurance", "general"] as const;
const FAQ_COUNT_PER_CATEGORY = 6;

function buildFaqData(t: (key: string) => string) {
  const faqData: Record<string, { question: string; answer: string }[]> = {};
  for (const cat of CATEGORY_KEYS) {
    faqData[cat] = [];
    for (let i = 1; i <= FAQ_COUNT_PER_CATEGORY; i++) {
      faqData[cat].push({
        question: t(`${cat}${i}Question`),
        answer: t(`${cat}${i}Answer`),
      });
    }
  }
  return faqData;
}

function FAQItem({
  question,
  answer,
  reduced,
}: {
  question: string;
  answer: string;
  reduced: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className={cn(
        "rounded-xl border transition-colors duration-200",
        GENERAL_RADIUS_SMALL,
        isOpen
          ? "border-slate-300 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-800/50"
          : "border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-900/50"
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <span
          className={cn(
            "text-base font-semibold transition-colors break-words text-left",
            GENERAL_FONT_HEADING,
            isOpen
              ? "text-slate-900 dark:text-white"
              : "text-slate-700 dark:text-slate-300"
          )}
        >
          {question}
        </span>
        <motion.span
          variants={{ open: { rotate: 45 }, closed: { rotate: 0 } }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <Plus
            className={cn(
              "h-5 w-5 transition-colors",
              isOpen ? "text-primary" : "text-slate-500 dark:text-slate-400"
            )}
          />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="border-t border-slate-200/60 px-4 pb-4 pt-2 text-sm text-slate-600 dark:border-slate-800/60 dark:text-slate-400">
          {answer}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function GeneralFaq() {
  const t = useTranslations("landing.faq");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_KEYS[0]);

  const categories: Record<string, string> = {
    appointments: t("categoryAppointments"),
    services: t("categoryServices"),
    insurance: t("categoryInsurance"),
    general: t("categoryGeneral"),
  };
  const faqData = buildFaqData((k) => t(k));

  const initial = reduced ? {} : { opacity: 0, y: 20 };
  const animate = reduced || !isInView ? {} : { opacity: 1, y: 0 };

  return (
    <section
      id="faq"
      ref={containerRef}
      className={cn("relative overflow-hidden", GENERAL_SECTION_BORDER, GENERAL_SECTION_BG, GENERAL_SECTION_PADDING)}
    >
      <div className={cn("mx-auto px-4 relative z-10", GENERAL_MAX_WIDTH)}>
        {/* Header – same section style as others */}
        <div className={cn("flex flex-col items-center text-center", GENERAL_HEADER_CONTENT_GAP)}>
          <h2 className={cn(GENERAL_SECTION_TITLE, GENERAL_TITLE_DESCRIPTION_GAP)}>
            {t("title")}
          </h2>
          <p className="max-w-2xl text-sm md:text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Tabs – CareNova style */}
        <motion.div
          initial={initial}
          animate={animate}
          transition={{ duration: 0.4 }}
          className={cn("flex flex-wrap items-center justify-center gap-2 md:gap-3", GENERAL_HEADER_CONTENT_GAP)}
        >
          {CATEGORY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                GENERAL_RADIUS_SMALL,
                selectedCategory === key
                  ? "border-primary bg-primary text-primary-foreground shadow-none"
                  : "border-slate-200/60 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
              )}
            >
              {categories[key]}
            </button>
          ))}
        </motion.div>

        {/* FAQ list */}
        <motion.div
          initial={initial}
          animate={animate}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mx-auto max-w-4xl w-full"
        >
          <AnimatePresence mode="wait">
            {CATEGORY_KEYS.map((cat) => {
              if (selectedCategory !== cat) return null;
              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-3"
                >
                  {faqData[cat].map((item, index) => (
                    <FAQItem
                      key={index}
                      question={item.question}
                      answer={item.answer}
                      reduced={reduced}
                    />
                  ))}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
