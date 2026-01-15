"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  TrendingUp, 
  Search, 
  Briefcase, 
  PlusCircle, 
  Trophy, 
  BarChart3,
} from "lucide-react";
import {
  Navbar as NavbarWrapper,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { cn } from "@/lib/utils";

// Dynamically import to avoid SSR hydration mismatch
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const navigation = [
  { name: "Markets", link: "/", icon: <TrendingUp className="h-4 w-4" /> },
  { name: "Explorer", link: "/explorer", icon: <Search className="h-4 w-4" /> },
  { name: "Portfolio", link: "/portfolio", icon: <Briefcase className="h-4 w-4" /> },
  { name: "Create", link: "/create", icon: <PlusCircle className="h-4 w-4" /> },
  { name: "Leaderboard", link: "/leaderboard", icon: <Trophy className="h-4 w-4" /> },
  { name: "Analytics", link: "/analytics", icon: <BarChart3 className="h-4 w-4" /> },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <NavbarWrapper>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navigation} />
          <div className="flex items-center gap-2">
            <WalletMultiButton />
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-2">
              <WalletMultiButton />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navigation.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-lg transition-colors",
                  pathname === item.link
                    ? "text-white bg-white/[0.1]"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </NavbarWrapper>
    </div>
  );
}
