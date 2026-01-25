"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ParticleFieldProps {
  className?: string;
  particleCount?: number;
  color?: string;
  speed?: number;
  interactive?: boolean;
}

export function ParticleField({
  className,
  particleCount = 50,
  color = "#3b82f6",
  speed = 1,
  interactive = true,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Store canvas dimensions as variables
    let canvasWidth = canvas.offsetWidth;
    let canvasHeight = canvas.offsetHeight;

    // Set canvas size
    const resizeCanvas = () => {
      canvasWidth = canvas.offsetWidth;
      canvasHeight = canvas.offsetHeight;
      canvas.width = canvasWidth * window.devicePixelRatio;
      canvas.height = canvasHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.radius = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < 0) this.x = canvasWidth;
        if (this.x > canvasWidth) this.x = 0;
        if (this.y < 0) this.y = canvasHeight;
        if (this.y > canvasHeight) this.y = 0;

        // Mouse interaction
        if (interactive) {
          const dx = mouseRef.current.x - this.x;
          const dy = mouseRef.current.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const force = (100 - dist) / 100;
            this.vx -= (dx / dist) * force * 0.1;
            this.vy -= (dy / dist) * force * 0.1;
          }
        }

        // Limit velocity
        const maxVel = 2;
        this.vx = Math.max(-maxVel, Math.min(maxVel, this.vx));
        this.vy = Math.max(-maxVel, Math.min(maxVel, this.vy));
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.floor(this.opacity * 255).toString(16).padStart(2, "0")}`;
        ctx.fill();
      }
    }

    // Create particles
    const particles: Particle[] = Array.from({ length: particleCount }, () => new Particle());

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${color}${Math.floor((1 - dist / 120) * 30).toString(16).padStart(2, "0")}`;
            ctx.stroke();
          }
        });

        p1.update();
        p1.draw();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    if (interactive) {
      canvas.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
      if (interactive) {
        canvas.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [particleCount, color, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 pointer-events-auto", className)}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// Animated gradient mesh background
export function GradientMesh({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// Grid pattern overlay
export function GridPattern({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]",
        className
      )}
    >
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
