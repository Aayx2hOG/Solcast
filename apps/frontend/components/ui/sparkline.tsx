"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  className?: string;
  showGradient?: boolean;
  animated?: boolean;
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  strokeColor = "#22c55e",
  fillColor,
  strokeWidth = 1.5,
  className,
  showGradient = true,
  animated = true,
}: SparklineProps) {
  const pathRef = useRef<SVGPathElement>(null);

  if (!data || data.length < 2) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ width, height }}
      >
        <div className="h-[1px] w-full bg-white/10" />
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Calculate points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  // Create smooth path using bezier curves
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    
    const prev = points[index - 1];
    const cp1x = prev.x + (point.x - prev.x) / 3;
    const cp1y = prev.y;
    const cp2x = point.x - (point.x - prev.x) / 3;
    const cp2y = point.y;
    
    return `${path} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, "");

  // Area path (for gradient fill)
  const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  // Determine if trend is up or down
  const isUp = data[data.length - 1] >= data[0];
  const defaultStroke = isUp ? "#22c55e" : "#ef4444";
  const finalStroke = strokeColor === "#22c55e" ? defaultStroke : strokeColor;

  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (animated && pathRef.current) {
      const length = pathRef.current.getTotalLength();
      pathRef.current.style.strokeDasharray = `${length}`;
      pathRef.current.style.strokeDashoffset = `${length}`;
      pathRef.current.animate(
        [
          { strokeDashoffset: length },
          { strokeDashoffset: 0 },
        ],
        {
          duration: 1000,
          easing: "ease-out",
          fill: "forwards",
        }
      );
    }
  }, [animated, data]);

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={finalStroke} stopOpacity={0.3} />
            <stop offset="100%" stopColor={finalStroke} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      
      {showGradient && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          opacity={0.5}
        />
      )}
      
      <path
        ref={pathRef}
        d={pathData}
        fill="none"
        stroke={finalStroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Current point indicator */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={finalStroke}
      />
    </svg>
  );
}

// Mini bar chart variant
interface MiniBarChartProps {
  data: number[];
  width?: number;
  height?: number;
  barColor?: string;
  className?: string;
}

export function MiniBarChart({
  data,
  width = 100,
  height = 32,
  barColor = "#3b82f6",
  className,
}: MiniBarChartProps) {
  if (!data || data.length < 1) return null;

  const max = Math.max(...data);
  const barWidth = (width / data.length) * 0.7;
  const gap = (width / data.length) * 0.3;

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {data.map((value, index) => {
        const barHeight = (value / max) * (height - 2);
        const x = index * (barWidth + gap);
        const y = height - barHeight;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={1}
            fill={barColor}
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
}
