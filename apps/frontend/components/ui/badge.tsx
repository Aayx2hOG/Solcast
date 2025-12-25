import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "success" | "danger" | "warning" | "secondary" | "info" | "outline" }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-opacity",
        {
          "border-border/[0.06] bg-card text-muted-foreground": variant === "default",
          "border-emerald-900/20 bg-emerald-950/20 text-emerald-400/80": variant === "success",
          "border-red-900/20 bg-red-950/20 text-red-400/80": variant === "danger",
          "border-amber-900/20 bg-amber-950/20 text-amber-400/80": variant === "warning",
          "border-border/[0.06] bg-secondary text-muted-foreground": variant === "secondary",
          "border-blue-900/20 bg-blue-950/20 text-blue-400/80": variant === "info",
          "border-border/[0.06] text-muted-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
