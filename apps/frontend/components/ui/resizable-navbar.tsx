"use client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import Link from "next/link";
import React, { useState, createContext, useContext } from "react";

interface NavbarContextType {
  isScrolled: boolean;
}

const NavbarContext = createContext<NavbarContextType>({ isScrolled: false });

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <NavbarContext.Provider value={{ isScrolled }}>
      <nav
        className={cn(
          "fixed top-4 inset-x-0 mx-auto z-[5000] w-full max-w-7xl px-4",
          className
        )}
      >
        {children}
      </nav>
    </NavbarContext.Provider>
  );
};

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const NavBody = ({ children, className }: NavBodyProps) => {
  const { isScrolled } = useContext(NavbarContext);

  return (
    <motion.div
      animate={{
        width: isScrolled ? "40%" : "100%",
        backgroundColor: isScrolled
          ? "rgba(0, 0, 0, 0.9)"
          : "rgba(0, 0, 0, 0.7)",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className={cn(
        "hidden md:flex items-center justify-between mx-auto",
        "rounded-full border border-white/[0.1]",
        "backdrop-blur-md shadow-lg",
        "px-4 py-2",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

interface NavItemsProps {
  items: { name: string; link: string; icon?: React.ReactNode }[];
  className?: string;
}

export const NavItems = ({ items, className }: NavItemsProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {items.map((item, idx) => (
        <Link
          key={`nav-item-${idx}`}
          href={item.link}
          className={cn(
            "relative px-3 py-2 text-sm font-medium",
            "text-neutral-400 hover:text-white",
            "rounded-full hover:bg-white/[0.05]",
            "transition-colors duration-200",
            "flex items-center gap-1.5"
          )}
        >
          {item.icon && <span className="h-4 w-4">{item.icon}</span>}
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

interface NavbarLogoProps {
  className?: string;
}

export const NavbarLogo = ({ className }: NavbarLogoProps) => {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-full",
        "hover:bg-white/[0.05] transition-colors",
        className
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 text-white"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      </div>
      <span className="text-sm font-semibold text-white">Solcast</span>
    </Link>
  );
};

interface NavbarButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
}

export const NavbarButton = ({
  children,
  variant = "primary",
  className,
  onClick,
}: NavbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
        variant === "primary" && [
          "bg-white text-black",
          "hover:bg-neutral-200",
          "shadow-[0px_0px_12px_rgba(255,255,255,0.15)]",
        ],
        variant === "secondary" && [
          "border border-white/[0.2] text-white",
          "hover:bg-white/[0.05]",
        ],
        className
      )}
    >
      {children}
      {variant === "primary" && (
        <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-purple-500 to-transparent h-px" />
      )}
    </button>
  );
};

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileNav = ({ children, className }: MobileNavProps) => {
  return (
    <div className={cn("md:hidden", className)}>
      {children}
    </div>
  );
};

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileNavHeader = ({ children, className }: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full",
        "rounded-full border border-white/[0.1]",
        "bg-black/80 backdrop-blur-md",
        "px-4 py-2",
        className
      )}
    >
      {children}
    </div>
  );
};

interface MobileNavToggleProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const MobileNavToggle = ({ isOpen, onClick, className }: MobileNavToggleProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-full text-white",
        "hover:bg-white/[0.05] transition-colors",
        className
      )}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
    </button>
  );
};

interface MobileNavMenuProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const MobileNavMenu = ({
  children,
  isOpen,
  onClose,
  className,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[4999]"
          />
          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute top-16 inset-x-4 z-[5000]",
              "flex flex-col gap-4 p-6",
              "rounded-2xl border border-white/[0.1]",
              "bg-black/95 backdrop-blur-md",
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
