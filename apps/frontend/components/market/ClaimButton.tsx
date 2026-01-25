"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trophy, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClaimButtonProps {
  marketId: number;
  claimableAmount: number;
  onClaim: (marketId: number) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function ClaimButton({
  marketId,
  claimableAmount,
  onClaim,
  disabled = false,
  className,
}: ClaimButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      await onClaim(marketId);
      setIsClaimed(true);
      toast.success("Winnings claimed successfully!", {
        description: `$${claimableAmount.toFixed(2)} USDC has been sent to your wallet.`,
        icon: <Sparkles className="h-4 w-4 text-yellow-500" />,
      });
      setTimeout(() => {
        setIsDialogOpen(false);
      }, 1500);
    } catch (error: any) {
      toast.error("Failed to claim winnings", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isClaimed) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={cn("gap-2", className)}
      >
        <CheckCircle className="h-4 w-4 text-emerald-500" />
        Claimed
      </Button>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          disabled={disabled || claimableAmount <= 0}
          className={cn(
            "gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
            className
          )}
        >
          <Trophy className="h-4 w-4" />
          Claim ${claimableAmount.toFixed(2)}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Claim Your Winnings
          </DialogTitle>
          <DialogDescription>
            Congratulations! You're about to claim your prediction market winnings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Amount Display */}
          <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-6 text-center border border-emerald-500/20">
            <div className="text-sm text-muted-foreground mb-1">Claimable Amount</div>
            <div className="text-4xl font-bold text-emerald-500">
              ${claimableAmount.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">USDC</div>
          </div>
          
          {/* Info */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Your winnings will be sent directly to your connected wallet
            </p>
            <p>
              • This action cannot be undone
            </p>
            <p>
              • A small network fee may apply
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClaim}
            disabled={isLoading}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Confirm Claim
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Inline claim button for compact displays
export function ClaimButtonInline({
  marketId,
  claimableAmount,
  onClaim,
  disabled = false,
}: ClaimButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      await onClaim(marketId);
      toast.success("Winnings claimed!", {
        description: `$${claimableAmount.toFixed(2)} USDC sent to your wallet.`,
      });
    } catch (error: any) {
      toast.error("Failed to claim", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClaim}
      disabled={disabled || isLoading || claimableAmount <= 0}
      className="h-7 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <>
          <Trophy className="h-3 w-3 mr-1" />
          Claim ${claimableAmount.toFixed(2)}
        </>
      )}
    </Button>
  );
}
