import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/lib/contexts/WalletContext";
import { SolanaProvider } from "@/lib/contexts/SolanaContext";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solcast - Decentralized Prediction Markets",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <WalletContextProvider>
          <SolanaProvider>
            <Navbar />
            <main className="flex-1 bg-background">
              {children}
            </main>
            <footer className="border-t border-border/[0.06] bg-background py-8">
              <div className="container mx-auto px-5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-6 w-6 items-center justify-center border border-border/[0.06] bg-card">
                      <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 17L12 22L22 17M2 12L12 17L22 12M12 2L2 7L12 12L22 7L12 2Z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-foreground">Solcast</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Decentralized prediction markets on Solana
                  </p>
                  <div className="flex items-center gap-4">
                    <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                      Docs
                    </a>
                    <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                      GitHub
                    </a>
                    <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                      Discord
                    </a>
                  </div>
                </div>
              </div>
            </footer>
            <Toaster richColors position="top-right" />
          </SolanaProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
