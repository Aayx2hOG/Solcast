"use client";

import { useState } from "react";
import { CommandPalette } from "@/components/ui/command-palette";
import { AnimatePresence, motion } from "framer-motion";

interface GlobalProvidersProps {
  children: React.ReactNode;
}

export function GlobalProviders({ children }: GlobalProvidersProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <>
      {/* Command Palette (⌘K) */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />
      
      {/* Page Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      
      {/* Keyboard shortcut hint (shows briefly on first visit) */}
      <KeyboardHint />
    </>
  );
}

function KeyboardHint() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show hint after a delay on first visit
  useState(() => {
    if (typeof window === "undefined") return;
    
    const hasSeenHint = localStorage.getItem("solcast-keyboard-hint");
    if (!hasSeenHint) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem("solcast-keyboard-hint", "true");
        
        // Auto dismiss after 5 seconds
        setTimeout(() => setDismissed(true), 5000);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  });

  if (!show || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <div 
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl cursor-pointer"
        onClick={() => setDismissed(true)}
      >
        <span className="text-xs text-white/70">Press</span>
        <kbd className="px-2 py-0.5 rounded bg-white/20 text-xs font-medium text-white">⌘K</kbd>
        <span className="text-xs text-white/70">to search</span>
      </div>
    </motion.div>
  );
}
