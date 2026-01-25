"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Briefcase,
  PlusCircle,
  Trophy,
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/explorer", icon: Search },
  { name: "Create", href: "/create", icon: PlusCircle },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Ranks", href: "/leaderboard", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-[#0d1117]/90 backdrop-blur-xl border-t border-white/[0.06]" />
      
      {/* Safe area padding for notched phones */}
      <div className="relative flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 py-2"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -inset-2 rounded-xl bg-white/10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative h-5 w-5 transition-colors",
                    isActive ? "text-white" : "text-white/40"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium transition-colors",
                  isActive ? "text-white" : "text-white/40"
                )}
              >
                {item.name}
              </span>
              
              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 h-1 w-1 rounded-full bg-emerald-400"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Floating action button variant
export function FloatingCreateButton() {
  return (
    <Link
      href="/create"
      className="fixed bottom-20 right-4 z-50 md:hidden"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25"
      >
        <PlusCircle className="h-6 w-6 text-white" />
      </motion.div>
    </Link>
  );
}
