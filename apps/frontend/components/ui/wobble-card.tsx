"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const WobbleCard = ({
  children,
  containerClassName,
  className,
  glowColor = "132, 0, 255",
}: {
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
  glowColor?: string;
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (clientX - (rect.left + rect.width / 2)) / 20;
    const y = (clientY - (rect.top + rect.height / 2)) / 20;
    setMousePosition({ x, y });
  };

  return (
    <motion.section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      style={{
        transform: isHovering
          ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) scale3d(1, 1, 1)`
          : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
        transition: "transform 0.1s ease-out",
      }}
      className={cn(
        "mx-auto w-full bg-indigo-800 relative rounded-2xl overflow-hidden",
        containerClassName
      )}
    >
      <div
        className="relative h-full [background-image:radial-gradient(88%_100%_at_top,rgba(255,255,255,0.5),rgba(255,255,255,0))] sm:mx-0 sm:rounded-2xl overflow-hidden"
        style={{
          boxShadow: isHovering
            ? `0 10px 32px rgba(${glowColor}, 0.37), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(${glowColor}, 0.12), 0 4px 6px rgba(${glowColor}, 0.12), 0 24px 108px rgba(${glowColor}, 0.12)`
            : "0 10px 32px rgba(34, 42, 53, 0.12), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.05), 0 4px 6px rgba(34, 42, 53, 0.08), 0 24px 108px rgba(47, 48, 55, 0.10)",
          transition: "box-shadow 0.3s ease-out",
        }}
      >
        <motion.div
          style={{
            transform: isHovering
              ? `translate3d(${-mousePosition.x}px, ${-mousePosition.y}px, 0) scale3d(1.03, 1.03, 1)`
              : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
            transition: "transform 0.1s ease-out",
          }}
          className={cn("h-full px-4 py-20 sm:px-10", className)}
        >
          <Noise />
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
};

const Noise = () => {
  return (
    <div
      className="absolute inset-0 w-full h-full scale-[1.2] transform opacity-10 [mask-image:radial-gradient(#fff,transparent,75%)]"
      style={{
        backgroundImage: "url(/noise.webp)",
        backgroundSize: "30%",
      }}
    ></div>
  );
};

// Simpler WobbleCard variant for stats/info cards
export const WobbleCardSimple = ({
  children,
  containerClassName,
  className,
  glowColor = "132, 0, 255",
}: {
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
  glowColor?: string;
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (clientX - (rect.left + rect.width / 2)) / 30;
    const y = (clientY - (rect.top + rect.height / 2)) / 30;
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      style={{
        transform: isHovering
          ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) scale3d(1.02, 1.02, 1)`
          : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
        transition: "transform 0.15s ease-out",
      }}
      className={cn(
        "relative rounded-xl overflow-hidden bg-card border border-white/[0.08]",
        containerClassName
      )}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(600px circle at ${mousePosition.x + 50}% ${mousePosition.y + 50}%, rgba(${glowColor}, 0.15), transparent 40%)`,
        }}
      />
      
      {/* Inner glow */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(300px circle at ${mousePosition.x + 50}% ${mousePosition.y + 50}%, rgba(${glowColor}, 0.1), transparent 40%)`,
        }}
      />

      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovering ? 1 : 0,
          boxShadow: `inset 0 0 0 1px rgba(${glowColor}, 0.3), 0 0 20px rgba(${glowColor}, 0.15)`,
        }}
      />

      <motion.div
        style={{
          transform: isHovering
            ? `translate3d(${-mousePosition.x * 0.5}px, ${-mousePosition.y * 0.5}px, 0)`
            : "translate3d(0px, 0px, 0)",
          transition: "transform 0.15s ease-out",
        }}
        className={cn("relative h-full", className)}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
