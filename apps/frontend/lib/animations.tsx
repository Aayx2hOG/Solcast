"use client";

import { motion, type Variants } from "framer-motion";

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

// Stagger children animation
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

// Scale up animation
export const scaleVariants: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
  },
};

// Slide in from side
export const slideInVariants = {
  left: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  },
  right: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  },
};

// Wrapper component for animated pages
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered list wrapper
interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggeredList({ children, className }: StaggeredListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual staggered item
interface StaggeredItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggeredItem({ children, className }: StaggeredItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Hover scale effect
interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export function HoverScale({ children, scale = 1.02, className }: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in on scroll
interface FadeInOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInOnScroll({ children, className, delay = 0 }: FadeInOnScrollProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
