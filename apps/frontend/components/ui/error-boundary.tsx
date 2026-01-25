"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorType: "wallet" | "network" | "transaction" | "unknown";
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorType: "unknown"
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Classify the error
    let errorType: ErrorBoundaryState["errorType"] = "unknown";
    
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes("wallet") ||
      errorMessage.includes("connect") ||
      errorMessage.includes("adapter")
    ) {
      errorType = "wallet";
    } else if (
      errorMessage.includes("network") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("timeout")
    ) {
      errorType = "network";
    } else if (
      errorMessage.includes("transaction") ||
      errorMessage.includes("signature") ||
      errorMessage.includes("rejected")
    ) {
      errorType = "transaction";
    }

    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorType: "unknown" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorType={this.state.errorType}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorType: "wallet" | "network" | "transaction" | "unknown";
  onRetry: () => void;
}

function ErrorFallback({ error, errorType, onRetry }: ErrorFallbackProps) {
  const getErrorContent = () => {
    switch (errorType) {
      case "wallet":
        return {
          icon: <Wallet className="h-12 w-12 text-orange-500" />,
          title: "Wallet Connection Issue",
          description: "There was a problem connecting to your wallet. Please try reconnecting.",
          action: "Reconnect Wallet",
        };
      case "network":
        return {
          icon: <WifiOff className="h-12 w-12 text-red-500" />,
          title: "Network Error",
          description: "Unable to connect to the network. Please check your connection and try again.",
          action: "Retry Connection",
        };
      case "transaction":
        return {
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
          title: "Transaction Failed",
          description: "The transaction could not be completed. This may be due to insufficient funds or network congestion.",
          action: "Try Again",
        };
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
          title: "Something Went Wrong",
          description: "An unexpected error occurred. Please try again or refresh the page.",
          action: "Retry",
        };
    }
  };

  const content = getErrorContent();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {content.icon}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{content.title}</h3>
            <p className="text-sm text-muted-foreground">{content.description}</p>
            {error && process.env.NODE_ENV === "development" && (
              <details className="text-left mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Error Details
                </summary>
                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto max-h-32">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {content.action}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Wallet Error Component
interface WalletErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function WalletError({ message, onRetry }: WalletErrorProps) {
  const { disconnect, connect, wallets, select } = useWallet();

  const handleReconnect = async () => {
    try {
      await disconnect();
      if (wallets.length > 0) {
        select(wallets[0].adapter.name);
        await connect();
      }
      onRetry?.();
    } catch (err: any) {
      toast.error("Failed to reconnect", {
        description: err.message,
      });
    }
  };

  return (
    <Card className="border-orange-500/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-orange-500/10">
            <Wallet className="h-6 w-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">Wallet Disconnected</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {message || "Your wallet connection was lost. Please reconnect to continue."}
            </p>
            <Button onClick={handleReconnect} size="sm" className="mt-3 gap-2">
              <RefreshCw className="h-3 w-3" />
              Reconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Transaction Error Component
interface TransactionErrorProps {
  error: string;
  signature?: string;
  onRetry?: () => void;
}

export function TransactionError({ error, signature, onRetry }: TransactionErrorProps) {
  return (
    <Card className="border-red-500/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">Transaction Failed</h4>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            {signature && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Signature: {signature.slice(0, 16)}...
              </p>
            )}
            {onRetry && (
              <Button onClick={onRetry} size="sm" variant="outline" className="mt-3 gap-2">
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Network Status Component
interface NetworkStatusProps {
  isOnline: boolean;
  isConnecting?: boolean;
  onRetry?: () => void;
}

export function NetworkStatus({ isOnline, isConnecting, onRetry }: NetworkStatusProps) {
  if (isOnline && !isConnecting) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Card className={isOnline ? "border-green-500/50" : "border-red-500/50"}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isConnecting ? "Reconnecting..." : isOnline ? "Connected" : "No Connection"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOnline
                    ? "You're back online"
                    : "Check your internet connection"}
                </p>
              </div>
            </div>
            {!isOnline && onRetry && (
              <Button size="sm" variant="ghost" onClick={onRetry}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
