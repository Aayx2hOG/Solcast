"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { useOracleWebSocket } from "@/lib/hooks/useOracleWebSocket";

interface OracleResolution {
  marketId: string;
  status: string;
  value: number;
  confidence: number;
  ts: number;
}

interface OracleChartProps {
  marketId?: string;
  className?: string;
}

const timeframes = [
  { label: "1M", value: 1 },
  { label: "5M", value: 5 },
  { label: "15M", value: 15 },
  { label: "1H", value: 60 },
  { label: "ALL", value: -1 },
];

export function OracleChart({ marketId, className }: OracleChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(15);
  const { resolutions, isConnected, latestPrice } = useOracleWebSocket(marketId);

  const filteredData = useMemo(() => {
    if (selectedTimeframe === -1) return resolutions;

    const cutoff = Date.now() - selectedTimeframe * 60 * 1000;
    return resolutions.filter((point) => point.ts >= cutoff);
  }, [resolutions, selectedTimeframe]);

  const chartData = useMemo(() => {
    return filteredData.map((point) => ({
      time: point.ts,
      price: point.value,
      confidence: (point.confidence * 100).toFixed(1),
    }));
  }, [filteredData]);

  const priceChange = useMemo(() => {
    if (chartData.length < 2) return { value: 0, percentage: 0 };
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    const change = last - first;
    const percentage = first > 0 ? ((change / first) * 100) : 0;
    return { value: change, percentage };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background/95 backdrop-blur p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">
            {format(new Date(label), "MMM d, HH:mm:ss")}
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium font-mono">
                ${Number(payload[0].value).toLocaleString()}
              </span>
            </div>
            {payload[1] && (
              <div className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-medium">{payload[1].value}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle>Oracle Price Feed</CardTitle>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Live" : "Disconnected"}
              </Badge>
            </div>
            {latestPrice && (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono">
                  ${latestPrice.value.toLocaleString()}
                </span>
                <span
                  className={`text-sm font-medium ${
                    priceChange.percentage >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {priceChange.percentage >= 0 ? "+" : ""}
                  {priceChange.percentage.toFixed(2)}%
                </span>
                <Badge variant="outline" className="text-xs">
                  Confidence: {(latestPrice.confidence * 100).toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={selectedTimeframe === tf.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTimeframe(tf.value)}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Waiting for oracle data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/30"
              />
              <XAxis
                dataKey="time"
                tickFormatter={(value) => format(new Date(value), "HH:mm:ss")}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
