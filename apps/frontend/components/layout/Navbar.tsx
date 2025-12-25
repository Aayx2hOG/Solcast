"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Search, 
  Briefcase, 
  PlusCircle, 
  Trophy, 
  BarChart3,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Dynamically import to avoid SSR hydration mismatch
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const navigation = [
  { name: "Markets", href: "/", icon: TrendingUp },
  { name: "Explorer", href: "/explorer", icon: Search },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Create", href: "/create", icon: PlusCircle },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/[0.06] bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-5">
        <div className="flex h-12 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex h-6 w-6 items-center justify-center border border-border/[0.06] bg-card">
              <TrendingUp className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-semibold tracking-tight text-foreground">
              Solcast
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1.5 px-2.5 py-1.5 text-[11px] font-medium transition-opacity",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:opacity-70"
                  )}
                >
                  <Icon className="h-3 w-3" strokeWidth={1.5} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2.5">
            <div className="text-[11px]">
              <WalletMultiButton />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border/[0.06] py-2.5 md:hidden">
            <div className="space-y-0.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-2 px-2.5 py-1.5 text-[11px] font-medium transition-opacity",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={1.5} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
