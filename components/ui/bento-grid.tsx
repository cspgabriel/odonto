"use client";

import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Animation variants for the container to stagger children
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Animation variants for each grid item
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    } as any, // Cast to avoid specific transition type conflicts
  },
};

/**
 * Props for the BentoGridShowcase component.
 * Each prop represents a "slot" in the grid.
 */
interface BentoGridShowcaseProps {
  /** Slot for the top-left card */
  slot1: React.ReactNode;
  /** Slot for the middle card (Main Feature - Full Height) */
  slot2: React.ReactNode;
  /** Slot for the top-right card */
  slot3: React.ReactNode;
  /** Slot for the middle-left card */
  slot4: React.ReactNode;
  /** Slot for the middle-right card */
  slot5: React.ReactNode;
  /** Slot for the bottom card */
  slot6: React.ReactNode;
  /** Optional class names for the grid container */
  className?: string;
}

/**
 * A responsive, animated 3-column bento grid layout component.
 * Middle column spans full height, side cards have uniform height.
 */
export const BentoGridShowcase = ({
  slot1,
  slot2,
  slot3,
  slot4,
  slot5,
  slot6,
  className,
}: BentoGridShowcaseProps) => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        "lg:grid-rows-[1fr_1fr]", // 2 equal rows on desktop only
        "lg:h-[500px]", // Fixed height on desktop only
        className
      )}
    >
      {/* Mobile: Stack all cards vertically (1 column) */}
      {/* Tablet: 2 columns grid */}
      {/* Desktop: 3 columns bento layout */}
      
      {/* Slot 1: Top-left */}
      <motion.div variants={itemVariants} className="lg:col-start-1 lg:row-start-1 lg:row-span-1 h-full">
        {slot1}
      </motion.div>

      {/* Slot 2: Middle (Full Height on desktop) */}
      <motion.div variants={itemVariants} className="lg:col-start-2 lg:row-start-1 lg:row-span-2 h-full">
        {slot2}
      </motion.div>

      {/* Slot 3: Top-right */}
      <motion.div variants={itemVariants} className="lg:col-start-3 lg:row-start-1 lg:row-span-1 h-full">
        {slot3}
      </motion.div>

      {/* Slot 4: Bottom-left */}
      <motion.div variants={itemVariants} className="lg:col-start-1 lg:row-start-2 lg:row-span-1 h-full">
        {slot4}
      </motion.div>

      {/* Slot 5: Bottom-right */}
      <motion.div variants={itemVariants} className="lg:col-start-3 lg:row-start-2 lg:row-span-1 h-full">
        {slot5}
      </motion.div>

      {/* Slot 6: Additional card for mobile/tablet */}
      <motion.div variants={itemVariants} className="lg:hidden h-full">
        {slot6}
      </motion.div>
    </motion.section>
  );
};
