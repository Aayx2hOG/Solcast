"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PricePoint } from "@/lib/types";
import { useState, useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { format } from "date-fns";

interface PriceChartProps {
  data: PricePoint[];
  className?: string;
}

const timeframes = [
  { label: "1H", value: 60 },
  { label: "24H", value: 1440 },
  { label: "7D", value: 10080 },
  { label: "30D", value: 43200 },
  { label: "ALL", value: -1 },
];

export function PriceChart({ data, className }: PriceChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(1440); // 24H default

  const filteredData = useMemo(() => {
    if (selectedTimeframe === -1) return data;
    
    const cutoff = Date.now() - selectedTimeframe * 60 * 1000;
    return data.filter((point) => point.timestamp >= cutoff);
  }, [data, selectedTimeframe]);

  const chartData = useMemo(() => {
    return filteredData.map((point) => ({
      time: point.timestamp,
      Yes: (point.yesPrice * 100).toFixed(2),
      No: (point.noPrice * 100).toFixed(2),
    }));
  }, [filteredData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">
            {format(new Date(label), "MMM d, HH:mm")}
          </p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2 text-sm">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Price History</CardTitle>
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
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="time"
              tickFormatter={(time) => format(new Date(time), "MMM d")}
              className="text-xs"
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Yes"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="No"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
