"use client";

import { cn } from "@/lib/utils";
import React from "react";

export function CircularLoader({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  };

  return (
    <div
      className={cn(
        "border-primary animate-spin rounded-full border-2 border-t-transparent",
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function PageLoader({ pageName }: { pageName: string }) {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center gap-4">
      <CircularLoader size="lg" />
      <p className="text-sm font-medium text-muted-foreground">
        Loading {pageName}
      </p>
    </div>
  );
}
