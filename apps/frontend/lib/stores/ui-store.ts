import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Theme & Preferences
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Notifications
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  // Trading preferences
  defaultSlippage: number;
  setDefaultSlippage: (slippage: number) => void;
  
  confirmTrades: boolean;
  setConfirmTrades: (confirm: boolean) => void;

  // Watchlist
  watchlist: number[];
  addToWatchlist: (marketId: number) => void;
  removeFromWatchlist: (marketId: number) => void;
  isInWatchlist: (marketId: number) => boolean;

  // Recent searches
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Command Palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      // Theme & Preferences
      soundEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      // Notifications
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      // Trading preferences
      defaultSlippage: 0.5,
      setDefaultSlippage: (slippage) => set({ defaultSlippage: slippage }),

      confirmTrades: true,
      setConfirmTrades: (confirm) => set({ confirmTrades: confirm }),

      // Watchlist
      watchlist: [],
      addToWatchlist: (marketId) =>
        set((state) => ({
          watchlist: state.watchlist.includes(marketId)
            ? state.watchlist
            : [...state.watchlist, marketId],
        })),
      removeFromWatchlist: (marketId) =>
        set((state) => ({
          watchlist: state.watchlist.filter((id) => id !== marketId),
        })),
      isInWatchlist: (marketId) => get().watchlist.includes(marketId),

      // Recent searches
      recentSearches: [],
      addRecentSearch: (query) =>
        set((state) => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter((q) => q !== query),
          ].slice(0, 10),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "solcast-ui-storage",
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        notificationsEnabled: state.notificationsEnabled,
        defaultSlippage: state.defaultSlippage,
        confirmTrades: state.confirmTrades,
        watchlist: state.watchlist,
        recentSearches: state.recentSearches,
      }),
    }
  )
);

// Trading state store
interface TradingState {
  selectedOutcome: "Yes" | "No";
  setSelectedOutcome: (outcome: "Yes" | "No") => void;
  
  tradeMode: "buy" | "sell";
  setTradeMode: (mode: "buy" | "sell") => void;
  
  amount: string;
  setAmount: (amount: string) => void;
  
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  selectedOutcome: "Yes",
  setSelectedOutcome: (outcome) => set({ selectedOutcome: outcome }),

  tradeMode: "buy",
  setTradeMode: (mode) => set({ tradeMode: mode }),

  amount: "",
  setAmount: (amount) => set({ amount }),

  isProcessing: false,
  setIsProcessing: (processing) => set({ isProcessing: processing }),
}));
