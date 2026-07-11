"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  indicatorClassName?: string;
  showValue?: boolean;
  size?: "sm" | "default" | "lg";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    { className, value = 0, indicatorClassName, showValue = false, size = "default", ...props },
    ref
  ) => {
    const safeValue = Math.min(100, Math.max(0, value));

    return (
      <div className="relative">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-full bg-muted",
            {
              "h-1": size === "sm",
              "h-2.5": size === "default",
              "h-4": size === "lg",
            },
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full w-full flex-1 rounded-full bg-primary transition-all duration-500 ease-out",
              indicatorClassName
            )}
            style={{ transform: `translateX(-${100 - safeValue}%)` }}
          />
        </ProgressPrimitive.Root>
        {showValue && (
          <span className="absolute right-0 -top-5 text-xs font-medium text-muted-foreground">
            {Math.round(safeValue)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
