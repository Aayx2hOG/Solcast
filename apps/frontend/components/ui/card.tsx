"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface CardProps {
  enableGlow?: boolean;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: () => void;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, enableGlow = true, glowColor = "132, 0, 255", style, children, onClick }, ref) => {
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
      if (!enableGlow || !cardRef.current) return;
      const { clientX, clientY } = event;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (clientX - (rect.left + rect.width / 2)) / 30;
      const y = (clientY - (rect.top + rect.height / 2)) / 30;
      setMousePosition({ x, y });
    };

    return (
      <motion.div
        ref={(node) => {
          (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setMousePosition({ x: 0, y: 0 });
        }}
        onClick={onClick}
        style={{
          transform: enableGlow && isHovering
            ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) scale3d(1.02, 1.02, 1)`
            : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
          transition: "transform 0.15s ease-out",
          ...style,
        }}
        className={cn(
          "relative rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm border border-white/[0.08] text-card-foreground",
          className
        )}
      >
        {/* Glow effect overlay */}
        {enableGlow && (
          <>
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: isHovering ? 1 : 0,
                background: `radial-gradient(600px circle at ${50 + mousePosition.x * 2}% ${50 + mousePosition.y * 2}%, rgba(${glowColor}, 0.15), transparent 40%)`,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: isHovering ? 1 : 0,
                background: `radial-gradient(300px circle at ${50 + mousePosition.x * 2}% ${50 + mousePosition.y * 2}%, rgba(${glowColor}, 0.1), transparent 40%)`,
              }}
            />
            <div
              className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
              style={{
                opacity: isHovering ? 1 : 0,
                boxShadow: `inset 0 0 0 1px rgba(${glowColor}, 0.3), 0 0 20px rgba(${glowColor}, 0.15)`,
              }}
            />
          </>
        )}
        
        {/* Content with subtle parallax */}
        <motion.div
          style={{
            transform: enableGlow && isHovering
              ? `translate3d(${-mousePosition.x * 0.5}px, ${-mousePosition.y * 0.5}px, 0)`
              : "translate3d(0px, 0px, 0)",
            transition: "transform 0.15s ease-out",
          }}
          className="relative h-full"
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1 p-4", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xs font-semibold leading-none tracking-wide uppercase text-muted-foreground", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-5 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
