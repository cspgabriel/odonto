"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function PermissionErrorToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "no_permission") {
      toast.error("You don't have permission to access that page.");
    }
  }, [searchParams]);

  return null;
}
