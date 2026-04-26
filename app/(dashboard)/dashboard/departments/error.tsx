"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DepartmentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] w-full items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An error occurred while loading the departments page.
        </p>
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
      </div>
    </div>
  );
}
