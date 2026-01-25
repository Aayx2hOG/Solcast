"use client";

import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
  trigger?: boolean;
  duration?: number;
  particleCount?: number;
}

export function useConfetti() {
  const fire = useCallback((options?: confetti.Options) => {
    const defaults: confetti.Options = {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"],
    };

    confetti({
      ...defaults,
      ...options,
    });
  }, []);

  const fireWorkAnimation = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#22c55e", "#3b82f6", "#a855f7"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#f59e0b", "#ef4444", "#ec4899"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const sideCanons = useCallback(() => {
    const end = Date.now() + 1000;
    const colors = ["#22c55e", "#3b82f6", "#a855f7"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const schoolPride = useCallback(() => {
    const end = Date.now() + 2000;
    const colors = ["#22c55e", "#3b82f6"];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return { fire, fireWorkAnimation, sideCanons, schoolPride };
}

export function Confetti({ trigger = false, duration = 3000, particleCount = 100 }: ConfettiProps) {
  const { fire } = useConfetti();

  useEffect(() => {
    if (trigger) {
      fire({ particleCount });
    }
  }, [trigger, fire, particleCount]);

  return null;
}

// Price flash effect component
interface PriceFlashProps {
  direction: "up" | "down";
  children: React.ReactNode;
  className?: string;
}

export function PriceFlash({ direction, children, className }: PriceFlashProps) {
  return (
    <span
      className={`
        relative inline-flex items-center
        ${direction === "up" ? "text-emerald-400" : "text-red-400"}
        ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
      <span
        className={`
          absolute inset-0 rounded opacity-0 animate-flash
          ${direction === "up" ? "bg-emerald-400/20" : "bg-red-400/20"}
        `}
      />
    </span>
  );
}
