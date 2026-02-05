"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface OracleResolution {
  marketId: string;
  status: string;
  value: number;
  confidence: number;
  ts: number;
}

interface UseOracleWebSocketReturn {
  resolutions: OracleResolution[];
  isConnected: boolean;
  latestPrice: OracleResolution | null;
  error: string | null;
  reconnect: () => void;
}

export function useOracleWebSocket(marketId?: string): UseOracleWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [resolutions, setResolutions] = useState<OracleResolution[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical data on mount
  useEffect(() => {
    async function fetchHistory() {
      try {
        const url = marketId 
          ? `${API_BASE_URL}/api/oracle/history?marketId=${marketId}&limit=500`
          : `${API_BASE_URL}/api/oracle/history?limit=500`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const history = data.resolutions.map((r: any, idx: number) => ({
            marketId: r.marketId,
            status: r.status,
            value: r.value || 0,
            confidence: r.confidence,
            ts: r.ts || (r.createdAt ? new Date(r.createdAt).getTime() : Date.now() - (data.resolutions.length - idx) * 10000),
          }));
          setResolutions(history);
        }
      } catch (err) {
        console.error("Failed to fetch oracle history:", err);
      }
    }
    fetchHistory();
  }, [marketId]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(WS_BASE_URL);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to oracle feed
        wsRef.current?.send(JSON.stringify({ action: "subscribe_oracle" }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "ORACLE_RESOLUTION") {
            const resolution: OracleResolution = {
              marketId: data.marketId,
              status: data.status,
              value: data.value,
              confidence: data.confidence,
              ts: data.ts,
            };

            // Filter by marketId if specified
            if (!marketId || resolution.marketId === marketId) {
              setResolutions((prev) => {
                const updated = [...prev, resolution];
                // Keep last 1000 data points
                if (updated.length > 1000) {
                  return updated.slice(-1000);
                }
                return updated;
              });
            }
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("Connection error");
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);

        // Auto-reconnect
        if (reconnectAttemptsRef.current < 10) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (err: any) {
      setError(err.message);
    }
  }, [marketId]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const latestPrice = resolutions.length > 0 
    ? resolutions[resolutions.length - 1] 
    : null;

  return {
    resolutions,
    isConnected,
    latestPrice,
    error,
    reconnect,
  };
}
