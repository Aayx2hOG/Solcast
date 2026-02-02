"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ParticleField, GradientMesh, GridPattern } from "@/components/effects/ParticleField";
import { LiveActivityTicker } from "@/components/ui/live-activity-feed";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

interface HeroSectionProps {
  stats: {
    totalVolume: string;
    activeMarkets: number;
    totalLiquidity: string;
    totalMarkets: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <GradientMesh className="opacity-20" />
      <GridPattern className="opacity-5" />
      <ParticleField 
        particleCount={25} 
        color="#6366f1" 
        speed={0.15}
        className="opacity-10"
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_50%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6"
          >
            <div className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs text-white/50">Built on Solana</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-semibold text-white mb-4 tracking-tight"
          >
            Prediction Markets
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-sm text-white/50 mb-8 max-w-md mx-auto"
          >
            Trade on future outcomes. Instant settlement. Minimal fees.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
          >
            <div className="wallet-adapter-button-trigger">
              <WalletMultiButton />
            </div>
            <Link href="/explorer">
              <Button
                variant="outline"
                size="sm"
                className="group border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/70 h-9 px-4 text-sm"
              >
                Browse Markets
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex justify-center mb-8"
          >
            <LiveActivityTicker className="px-3 py-2 rounded-full bg-white/[0.02] border border-white/[0.06] text-xs" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <StatCard
              label="Volume"
              value={parseFloat(stats.totalVolume) * 1_000_000}
              format="currency"
              decimals={2}
            />
            <StatCard
              label="Active"
              value={stats.activeMarkets}
            />
            <StatCard
              label="Liquidity"
              value={parseFloat(stats.totalLiquidity) * 1_000_000}
              format="currency"
              decimals={2}
            />
            <StatCard
              label="Total"
              value={stats.totalMarkets}
            />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  format?: "number" | "currency" | "percentage";
  decimals?: number;
}

function StatCard({ label, value, format = "number", decimals = 0 }: StatCardProps) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <div className="text-[10px] text-white/30 mb-1">{label}</div>
      <div className="text-lg font-semibold text-white tabular-nums">
        <AnimatedCounter 
          value={value} 
          format={format}
          decimals={decimals}
          duration={1.2}
        />
      </div>
    </div>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Instant",
      description: "Trades settle in seconds",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Non-Custodial",
      description: "Your keys, your funds",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "Real-Time",
      description: "Live price updates",
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
  ];

  return (
    <section className="py-8 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]"
            >
              <div className={`p-2 rounded-lg ${feature.bgColor} border ${feature.borderColor}`}>
                <span className={feature.color}>{feature.icon}</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{feature.title}</h3>
                <p className="text-xs text-white/40">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
