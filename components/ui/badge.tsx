import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border", {
  variants: {
    tone: {
      neutral: "border-border bg-surface-2 text-muted",
      brand: "border-brand/30 bg-brand/10 text-brand",
      success: "border-success/30 bg-success/10 text-success",
      warn: "border-warn/30 bg-warn/10 text-warn",
      danger: "border-danger/30 bg-danger/10 text-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
