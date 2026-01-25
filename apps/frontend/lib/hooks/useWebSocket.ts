"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";

interface MarketPriceUpdate {
  type: "MARKET_PRICE";
  marketId: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  ts: number;
}

interface TradeUpdate {
  type: "TRADE";
  marketId: string;
  outcome: "Yes" | "No";
  shares: number;
  price: number;
  timestamp: number;
}

interface OrderBookUpdate {
  type: "ORDERBOOK";
  marketId: string;
  bids: { price: number; quantity: number }[];
  asks: { price: number; quantity: number }[];
}

type WebSocketMessage = MarketPriceUpdate | TradeUpdate | OrderBookUpdate;

interface UseWebSocketOptions {
  onPriceUpdate?: (data: MarketPriceUpdate) => void;
  onTradeUpdate?: (data: TradeUpdate) => void;
  onOrderBookUpdate?: (data: OrderBookUpdate) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  subscribe: (marketId: string) => void;
  unsubscribe: (marketId: string) => void;
  subscriptions: Set<string>;
  reconnect: () => void;
  error: string | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onPriceUpdate,
    onTradeUpdate,
    onOrderBookUpdate,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(WS_BASE_URL);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Resubscribe to all previous subscriptions
        subscriptionsRef.current.forEach((marketId) => {
          wsRef.current?.send(JSON.stringify({ action: "subscribe", marketId }));
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(data);

          switch (data.type) {
            case "MARKET_PRICE":
              onPriceUpdate?.(data);
              break;
            case "TRADE":
              onTradeUpdate?.(data);
              break;
            case "ORDERBOOK":
              onOrderBookUpdate?.(data);
              break;
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);

        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError("Connection lost. Please refresh the page.");
        }
      };

      wsRef.current.onerror = () => {
        setError("WebSocket connection error");
      };
    } catch (err) {
      setError("Failed to connect to WebSocket");
    }
  }, [
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    onPriceUpdate,
    onTradeUpdate,
    onOrderBookUpdate,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const subscribe = useCallback((marketId: string) => {
    subscriptionsRef.current.add(marketId);
    setSubscriptions(new Set(subscriptionsRef.current));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "subscribe", marketId }));
    }
  }, []);

  const unsubscribe = useCallback((marketId: string) => {
    subscriptionsRef.current.delete(marketId);
    setSubscriptions(new Set(subscriptionsRef.current));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "unsubscribe", marketId }));
    }
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe,
    subscriptions,
    reconnect,
    error,
  };
}

// Hook for subscribing to a specific market's price updates
export function useMarketPrice(marketId: string | undefined) {
  const [prices, setPrices] = useState<{
    yesPrice: number;
    noPrice: number;
    volume: number;
    lastUpdate: number;
  } | null>(null);

  const { subscribe, unsubscribe, isConnected, error } = useWebSocket({
    onPriceUpdate: (data) => {
      if (data.marketId === marketId) {
        setPrices({
          yesPrice: data.yesPrice,
          noPrice: data.noPrice,
          volume: data.volume,
          lastUpdate: data.ts,
        });
      }
    },
  });

  useEffect(() => {
    if (marketId) {
      subscribe(marketId);
      return () => unsubscribe(marketId);
    }
  }, [marketId, subscribe, unsubscribe]);

  return { prices, isConnected, error };
}

// Hook for real-time trade feed
export function useTradeFeed(marketId: string | undefined) {
  const [trades, setTrades] = useState<TradeUpdate[]>([]);
  const maxTrades = 50;

  const { subscribe, unsubscribe, isConnected, error } = useWebSocket({
    onTradeUpdate: (data) => {
      if (!marketId || data.marketId === marketId) {
        setTrades((prev) => {
          const newTrades = [data, ...prev];
          return newTrades.slice(0, maxTrades);
        });
      }
    },
  });

  useEffect(() => {
    if (marketId) {
      subscribe(marketId);
      return () => unsubscribe(marketId);
    }
  }, [marketId, subscribe, unsubscribe]);

  return { trades, isConnected, error };
}
