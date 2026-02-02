"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { 
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
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  NavbarWalletWrapper,
} from "@/components/ui/resizable-navbar";
import { cn } from "@/lib/utils";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const navigation = [
  { name: "Markets", link: "/explorer", icon: <Search className="h-4 w-4" /> },
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
        <NavBody>
          <NavbarLogo />
          <NavItems items={navigation} />
          <div className="flex items-center gap-3">
            <NavbarWalletWrapper>
              <WalletMultiButton />
            </NavbarWalletWrapper>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-3">
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
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                  pathname === item.link
                    ? "text-white bg-white/[0.08]"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
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
