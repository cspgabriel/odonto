"use client";

import { usePreferences } from "@/contexts/preferences-context";

export function RevenueValue({ value }: { value: number }) {
  const { formatAmount } = usePreferences();
  return <>{formatAmount(value)}</>;
}
