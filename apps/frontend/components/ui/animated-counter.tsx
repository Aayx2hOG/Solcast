"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: "number" | "currency" | "percentage";
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 2,
  format = "number",
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => {
    const num = Math.max(0, current);
    
    if (format === "currency") {
      if (num >= 1_000_000) {
        return `${prefix}$${(num / 1_000_000).toFixed(decimals)}M${suffix}`;
      } else if (num >= 1_000) {
        return `${prefix}$${(num / 1_000).toFixed(decimals)}K${suffix}`;
      }
      return `${prefix}$${num.toFixed(decimals)}${suffix}`;
    }
    
    if (format === "percentage") {
      return `${prefix}${num.toFixed(decimals)}%${suffix}`;
    }
    
    if (num >= 1_000_000) {
      return `${prefix}${(num / 1_000_000).toFixed(decimals)}M${suffix}`;
    } else if (num >= 1_000) {
      return `${prefix}${(num / 1_000).toFixed(decimals)}K${suffix}`;
    }
    
    return `${prefix}${num.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      spring.set(value);
      setHasAnimated(true);
    }
  }, [isInView, value, spring, hasAnimated]);

  // Update value when it changes after initial animation
  useEffect(() => {
    if (hasAnimated) {
      spring.set(value);
    }
  }, [value, spring, hasAnimated]);

  return (
    <motion.span
      ref={ref}
      className={cn("tabular-nums", className)}
    >
      {display}
    </motion.span>
  );
}

// Simple number ticker for smaller numbers
interface NumberTickerProps {
  value: number;
  className?: string;
}

export function NumberTicker({ value, className }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 1500;
    const startTime = performance.now();
    const startValue = displayValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const current = startValue + (value - startValue) * easeOut;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {displayValue.toLocaleString()}
    </span>
  );
}
