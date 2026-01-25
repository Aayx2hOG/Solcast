"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, AreaSeries, HistogramSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { cn } from "@/lib/utils";

interface TradingChartProps {
  data: { time: string; value: number }[];
  className?: string;
  height?: number;
  lineColor?: string;
  areaTopColor?: string;
  areaBottomColor?: string;
  showVolume?: boolean;
  volumeData?: { time: string; value: number; color?: string }[];
}

export function TradingChart({
  data,
  className,
  height = 300,
  lineColor = "#22c55e",
  areaTopColor = "rgba(34, 197, 94, 0.4)",
  areaBottomColor = "rgba(34, 197, 94, 0)",
  showVolume = false,
  volumeData,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#1a1a2e",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#1a1a2e",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Area series - v5 API: addSeries(SeriesType, options)
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: lineColor,
      crosshairMarkerBackgroundColor: "#0d1117",
    });

    areaSeriesRef.current = areaSeries;

    // Add volume if provided
    if (showVolume && volumeData) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: "#3b82f6",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      volumeSeries.setData(
        volumeData.map((d) => ({
          time: d.time,
          value: d.value,
          color: d.color || "rgba(59, 130, 246, 0.3)",
        }))
      );
    }

    // Set data
    areaSeries.setData(data);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (areaSeriesRef.current && data.length > 0) {
      areaSeriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      className={cn("w-full", className)}
      style={{ height }}
    />
  );
}

// Simple mini chart for cards
interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

export function MiniChart({
  data,
  width = 120,
  height = 40,
  className,
  color,
}: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Determine color based on trend
    const isUp = data[data.length - 1] >= data[0];
    const lineColor = color || (isUp ? "#22c55e" : "#ef4444");

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${lineColor}40`);
    gradient.addColorStop(1, `${lineColor}00`);

    // Draw area
    ctx.beginPath();
    ctx.moveTo(0, height);

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        // Smooth curve
        const prevX = ((index - 1) / (data.length - 1)) * width;
        const prevY = height - ((data[index - 1] - min) / range) * (height - 8) - 4;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        ctx.quadraticCurveTo(cpX, (prevY + y) / 2, x, y);
      }
    });

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = ((index - 1) / (data.length - 1)) * width;
        const prevY = height - ((data[index - 1] - min) / range) * (height - 8) - 4;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        ctx.quadraticCurveTo(cpX, (prevY + y) / 2, x, y);
      }
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw endpoint
    const lastX = width;
    const lastY = height - ((data[data.length - 1] - min) / range) * (height - 8) - 4;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
  }, [data, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height }}
    />
  );
}
