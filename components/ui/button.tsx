import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] text-body font-medium subtle-hover focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent-primary text-white shadow-enterprise hover:bg-accent-primary-hover hover:-translate-y-px",
        secondary: "bg-surface border border-border-soft text-text-secondary hover:bg-hover",
        ghost: "bg-transparent text-text-secondary hover:bg-hover hover:text-text-primary",
        danger: "bg-error text-white shadow-soft hover:bg-error-hover",
        ai: "border border-accent-primary/25 bg-linear-to-r from-accent-primary/12 via-surface to-accent-secondary/12 text-text-primary shadow-[0_2px_10px_rgba(37,99,235,0.14)] hover:border-accent-primary/45 hover:-translate-y-px",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={loading || props.disabled} {...props}>
        {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
