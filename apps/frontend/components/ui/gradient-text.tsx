"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  gradient?: "primary" | "success" | "warning" | "danger" | "purple" | "rainbow";
  animated?: boolean;
}

const gradients = {
  primary: "from-blue-400 via-indigo-500 to-purple-600",
  success: "from-emerald-400 via-green-500 to-teal-600",
  warning: "from-amber-400 via-orange-500 to-red-500",
  danger: "from-red-400 via-rose-500 to-pink-600",
  purple: "from-purple-400 via-violet-500 to-indigo-600",
  rainbow: "from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500",
};

export function GradientText({
  children,
  className,
  gradient = "primary",
  animated = false,
}: GradientTextProps) {
  const baseClasses = cn(
    "bg-gradient-to-r bg-clip-text text-transparent",
    gradients[gradient],
    className
  );

  if (animated) {
    return (
      <motion.span
        className={cn(baseClasses, "bg-[length:200%_auto]")}
        animate={{
          backgroundPosition: ["0% center", "100% center", "0% center"],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
      </motion.span>
    );
  }

  return <span className={baseClasses}>{children}</span>;
}

// Glowing text effect
interface GlowTextProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function GlowText({ children, className, color = "#3b82f6" }: GlowTextProps) {
  return (
    <span
      className={cn("relative", className)}
      style={{
        textShadow: `0 0 20px ${color}40, 0 0 40px ${color}20, 0 0 60px ${color}10`,
      }}
    >
      {children}
    </span>
  );
}

// Typewriter effect
interface TypewriterProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export function Typewriter({ text, className, speed = 50, delay = 0 }: TypewriterProps) {
  return (
    <motion.span className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.05,
            delay: delay + index * (speed / 1000),
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
