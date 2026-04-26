"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { DENTAL_RADIUS_BUTTON, DENTAL_BUTTON_PRIMARY_BG, DENTAL_BUTTON_SECONDARY } from "@/lib/dental-branding";

/**
 * Dental/clinical landing buttons only. Uses branding: creative radius (rounded-xl), 2 colors, no animation.
 */
const landingButtonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap ${DENTAL_RADIUS_BUTTON} text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4`,
  {
    variants: {
      variant: {
        primary: `${DENTAL_BUTTON_PRIMARY_BG} text-white shadow-md dark:text-white`,
        secondary: DENTAL_BUTTON_SECONDARY,
        /** On dark sections (e.g. violet navbar/footer): white border, white text */
        primaryOnDark:
          "border border-white/30 bg-white/10 text-white hover:bg-white/20 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-4",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface LandingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof landingButtonVariants> {
  asChild?: boolean;
}

const LandingButton = React.forwardRef<HTMLButtonElement, LandingButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(landingButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
LandingButton.displayName = "LandingButton";

export { LandingButton, landingButtonVariants };
