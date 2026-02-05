"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOracleWebSocket } from "@/lib/hooks/useOracleWebSocket";
import { format } from "date-fns";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function OracleFeed() {
  const { resolutions, isConnected } = useOracleWebSocket();

  // Get last 50 resolutions in reverse order (newest first)
  const recentResolutions = [...resolutions].reverse().slice(0, 50);

  const getPriceChange = (index: number) => {
    if (index >= recentResolutions.length - 1) return null;
    const current = recentResolutions[index];
    const previous = recentResolutions[index + 1];
    
    if (current.marketId !== previous.marketId) return null;
    
    const change = current.value - previous.value;
    const percentage = previous.value > 0 ? (change / previous.value) * 100 : 0;
    
    return { change, percentage };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Live Oracle Feed</CardTitle>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "● Connected" : "○ Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {recentResolutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Activity className="h-12 w-12 mb-4 animate-pulse" />
              <p>Waiting for oracle updates...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentResolutions.map((resolution, index) => {
                const priceChange = getPriceChange(index);
                
                return (
                  <div
                    key={`${resolution.marketId}-${resolution.ts}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {resolution.marketId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(resolution.ts), "HH:mm:ss")}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono font-bold">
                          ${typeof resolution.value === 'number' 
                            ? resolution.value.toLocaleString() 
                            : resolution.value}
                        </div>
                        {priceChange && (
                          <div className={`text-xs flex items-center gap-1 justify-end ${
                            priceChange.change > 0 
                              ? 'text-green-500' 
                              : priceChange.change < 0 
                                ? 'text-red-500' 
                                : 'text-muted-foreground'
                          }`}>
                            {priceChange.change > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : priceChange.change < 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                            {priceChange.percentage >= 0 ? '+' : ''}
                            {priceChange.percentage.toFixed(2)}%
                          </div>
                        )}
                      </div>
                      
                      <Badge 
                        variant={resolution.confidence >= 0.9 ? "default" : resolution.confidence >= 0.7 ? "secondary" : "destructive"}
                        className="min-w-[60px] justify-center"
                      >
                        {(resolution.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
