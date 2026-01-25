"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  Briefcase,
  PlusCircle,
  Trophy,
  BarChart3,
  Home,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSolana } from "@/lib/contexts/SolanaContext";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { markets } = useSolana();
  const [search, setSearch] = React.useState("");

  const filteredMarkets = React.useMemo(() => {
    if (!search) return markets.slice(0, 5);
    return markets
      .filter((m) =>
        m.question.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 5);
  }, [markets, search]);

  const runCommand = React.useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Command Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-[640px] -translate-x-1/2"
          >
            <Command
              className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]/95 shadow-2xl backdrop-blur-xl"
              loop
            >
              {/* Search Input */}
              <div className="flex items-center border-b border-white/10 px-4">
                <Search className="mr-3 h-4 w-4 shrink-0 text-white/40" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search markets, navigate, or type a command..."
                  className="flex h-14 w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/40"
                />
                <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-2 font-mono text-[10px] font-medium text-white/40 sm:flex">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-12 text-center text-sm text-white/40">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-white/20" />
                  No results found.
                </Command.Empty>

                {/* Quick Actions */}
                <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-medium text-white/40">
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/"))}
                    icon={<Home className="h-4 w-4" />}
                  >
                    Go to Home
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/explorer"))}
                    icon={<Search className="h-4 w-4" />}
                  >
                    Explore Markets
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/create"))}
                    icon={<PlusCircle className="h-4 w-4" />}
                  >
                    Create New Market
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/portfolio"))}
                    icon={<Briefcase className="h-4 w-4" />}
                  >
                    View Portfolio
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/leaderboard"))}
                    icon={<Trophy className="h-4 w-4" />}
                  >
                    Leaderboard
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/analytics"))}
                    icon={<BarChart3 className="h-4 w-4" />}
                  >
                    Analytics
                  </CommandItem>
                </Command.Group>

                {/* Markets */}
                {filteredMarkets.length > 0 && (
                  <Command.Group heading="Markets" className="px-2 py-1.5 text-xs font-medium text-white/40">
                    {filteredMarkets.map((market) => (
                      <CommandItem
                        key={market.marketId}
                        onSelect={() => runCommand(() => router.push(`/market/${market.marketId}`))}
                        icon={<TrendingUp className="h-4 w-4" />}
                      >
                        <div className="flex flex-1 items-center justify-between">
                          <span className="truncate">{market.question}</span>
                          <div className="ml-2 flex items-center gap-2">
                            <span className="text-xs text-emerald-400">
                              {(market.yesPrice * 100).toFixed(0)}%
                            </span>
                            <ArrowRight className="h-3 w-3 text-white/30" />
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </Command.Group>
                )}

                {/* Shortcuts */}
                <Command.Group heading="Shortcuts" className="px-2 py-1.5 text-xs font-medium text-white/40">
                  <div className="flex items-center justify-between px-2 py-2 text-xs text-white/50">
                    <span>Navigate</span>
                    <div className="flex gap-1">
                      <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px]">↑</kbd>
                      <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px]">↓</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 py-2 text-xs text-white/50">
                    <span>Select</span>
                    <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px]">Enter</kbd>
                  </div>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface CommandItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onSelect?: () => void;
}

function CommandItem({ children, icon, onSelect }: CommandItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 outline-none transition-colors data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5">
        {icon}
      </div>
      {children}
    </Command.Item>
  );
}

// Hook to use command palette
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  return { open, setOpen };
}
