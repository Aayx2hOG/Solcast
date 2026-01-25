"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Zap, User } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "buy" | "sell" | "claim" | "create";
  user: string;
  market: string;
  outcome?: "Yes" | "No";
  amount?: number;
  shares?: number;
  timestamp: Date;
}

interface LiveActivityFeedProps {
  className?: string;
  maxItems?: number;
}

// Generate mock activity for demo
function generateMockActivity(): ActivityItem {
  const types = ["buy", "sell", "claim", "create"] as const;
  const outcomes = ["Yes", "No"] as const;
  const markets = [
    "Will BTC reach $100K by Dec 2026?",
    "Will ETH hit $5K in Q1 2026?",
    "Trump wins 2028 election?",
    "SOL reaches $200 by March?",
    "Fed cuts rates in February?",
    "Apple announces VR headset 2.0?",
  ];
  const users = [
    "0x7a9f...3b2d",
    "0x2c4e...8f1a",
    "0x9d3c...6e7b",
    "0x1f8a...4c9e",
    "0x5e2d...7a3f",
    "whale.sol",
    "degen.sol",
    "trader.sol",
  ];

  const type = types[Math.floor(Math.random() * types.length)];

  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    user: users[Math.floor(Math.random() * users.length)],
    market: markets[Math.floor(Math.random() * markets.length)],
    outcome: type !== "create" ? outcomes[Math.floor(Math.random() * outcomes.length)] : undefined,
    amount: type !== "create" ? Math.floor(Math.random() * 5000) + 100 : undefined,
    shares: type === "buy" || type === "sell" ? Math.floor(Math.random() * 1000) + 10 : undefined,
    timestamp: new Date(),
  };
}

export function LiveActivityFeed({ className, maxItems = 5 }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Initialize with some activities
    const initial = Array.from({ length: 3 }, () => generateMockActivity());
    setActivities(initial);

    // Add new activity every 3-8 seconds
    const interval = setInterval(() => {
      setActivities((prev) => {
        const newActivity = generateMockActivity();
        return [newActivity, ...prev].slice(0, maxItems);
      });
    }, Math.random() * 5000 + 3000);

    return () => clearInterval(interval);
  }, [maxItems]);

  const getActivityIcon = (type: ActivityItem["type"], outcome?: "Yes" | "No") => {
    switch (type) {
      case "buy":
        return outcome === "Yes" ? (
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-red-400" />
        );
      case "sell":
        return <TrendingDown className="h-3.5 w-3.5 text-orange-400" />;
      case "claim":
        return <Zap className="h-3.5 w-3.5 text-yellow-400" />;
      case "create":
        return <Zap className="h-3.5 w-3.5 text-purple-400" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "buy":
        return (
          <>
            bought{" "}
            <span className={activity.outcome === "Yes" ? "text-emerald-400" : "text-red-400"}>
              {activity.shares} {activity.outcome}
            </span>{" "}
            for <span className="text-white">${activity.amount}</span>
          </>
        );
      case "sell":
        return (
          <>
            sold{" "}
            <span className="text-orange-400">
              {activity.shares} {activity.outcome}
            </span>{" "}
            for <span className="text-white">${activity.amount}</span>
          </>
        );
      case "claim":
        return (
          <>
            claimed <span className="text-yellow-400">${activity.amount}</span> winnings
          </>
        );
      case "create":
        return (
          <>
            created a <span className="text-purple-400">new market</span>
          </>
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs font-medium text-white/60">Live Activity</span>
      </div>

      <div className="space-y-1.5 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group"
            >
              <div className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2 border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] shrink-0">
                  {getActivityIcon(activity.type, activity.outcome)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 leading-relaxed">
                    <span className="font-medium text-white/90">{activity.user}</span>{" "}
                    {getActivityText(activity)}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5 truncate">{activity.market}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Compact horizontal variant
export function LiveActivityTicker({ className }: { className?: string }) {
  const [activity, setActivity] = useState<ActivityItem | null>(null);

  useEffect(() => {
    setActivity(generateMockActivity());

    const interval = setInterval(() => {
      setActivity(generateMockActivity());
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  if (!activity) return null;

  return (
    <div className={cn("overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 text-xs text-white/60"
        >
          <div className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="font-medium text-white/80">{activity.user}</span>
          <span>
            {activity.type === "buy" ? "bought" : activity.type === "sell" ? "sold" : "claimed"}{" "}
            <span className={activity.outcome === "Yes" ? "text-emerald-400" : "text-red-400"}>
              {activity.outcome}
            </span>
          </span>
          <span className="text-white/40 truncate max-w-[200px]">{activity.market}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
