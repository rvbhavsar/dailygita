import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Status badges are a light tint plus the -700 text step — orange-on-orange-50
// fails contrast, so the tinted variants never use the 500 step for text.
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-theme-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-50 text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400",
        secondary:
          "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        destructive:
          "border-transparent bg-error-50 text-error-700 dark:bg-error-500/[0.12] dark:text-error-400",
        success:
          "border-transparent bg-success-50 text-success-700 dark:bg-success-500/[0.12] dark:text-success-400",
        outline: "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
