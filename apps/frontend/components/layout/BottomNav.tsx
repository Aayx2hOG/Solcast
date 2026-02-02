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
  { name: "Markets", href: "/explorer", icon: Search },
  { name: "Create", href: "/create", icon: PlusCircle },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Ranks", href: "/leaderboard", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-lg border-t border-white/[0.06]" />
      
      <div className="relative flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-14 py-2"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -inset-2 rounded-lg bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative h-5 w-5 transition-colors",
                    isActive ? "text-white" : "text-white/30"
                  )}
                  strokeWidth={1.5}
                />
              </div>
              <span
                className={cn(
                  "mt-1 text-[9px] transition-colors",
                  isActive ? "text-white" : "text-white/30"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function FloatingCreateButton() {
  return (
    <Link
      href="/create"
      className="fixed bottom-20 right-4 z-50 md:hidden"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/20"
      >
        <PlusCircle className="h-5 w-5 text-white" />
      </motion.div>
    </Link>
  );
}
