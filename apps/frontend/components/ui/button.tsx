import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:opacity-80 border border-primary",
        destructive:
          "bg-card text-red-400/80 border border-red-900/20 hover:opacity-80",
        outline:
          "border border-border/[0.06] bg-transparent text-foreground hover:border-border/[0.12]",
        secondary:
          "bg-secondary text-foreground hover:opacity-80",
        ghost: "text-muted-foreground hover:text-foreground hover:opacity-80",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-card text-emerald-400/80 border border-emerald-900/20 hover:opacity-80",
        danger: "bg-card text-red-400/80 border border-red-900/20 hover:opacity-80",
      },
      size: {
        default: "h-8 px-3.5 py-2",
        sm: "h-7 px-2.5 text-[11px]",
        lg: "h-9 px-5",
        xl: "h-10 px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
