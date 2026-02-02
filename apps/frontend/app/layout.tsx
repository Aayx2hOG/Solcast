import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/lib/contexts/WalletContext";
import { SolanaProvider } from "@/lib/contexts/SolanaContext";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { GlobalProviders } from "@/components/providers/GlobalProviders";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solcast - Prediction Markets",
  description: "Trade on the future with decentralized prediction markets on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased bg-black`}
      >
        <WalletContextProvider>
          <SolanaProvider>
            <GlobalProviders>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 pt-16 pb-20 md:pb-0">
                  {children}
                </main>
                <BottomNav />
                <footer className="hidden md:flex h-14 items-center border-t border-white/[0.06] bg-black shrink-0">
                  <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center bg-white/[0.03] border border-white/[0.08] rounded-lg">
                          <svg className="h-3.5 w-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 17L12 22L22 17M2 12L12 17L22 12M12 2L2 7L12 12L22 7L12 2Z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-white">Solcast</span>
                      </div>
                      <p className="text-xs text-white/30">
                        Prediction markets on Solana
                      </p>
                      <div className="flex items-center gap-5">
                        <a href="#" className="text-xs text-white/40 hover:text-white transition-colors">
                          Docs
                        </a>
                        <a href="#" className="text-xs text-white/40 hover:text-white transition-colors">
                          GitHub
                        </a>
                        <a href="#" className="text-xs text-white/40 hover:text-white transition-colors">
                          Discord
                        </a>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
              <Toaster 
                richColors 
                position="top-right" 
                toastOptions={{
                  style: {
                    background: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e5e7eb',
                  },
                }}
              />
            </GlobalProviders>
          </SolanaProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
