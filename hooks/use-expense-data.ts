"use client";

import { useState, useEffect } from "react";
import { getExpense } from "@/lib/actions/expense-actions";
import type { expenses } from "@/lib/db/schema";

export type ExpenseData = (typeof expenses.$inferSelect) | null;

export function useExpenseData(expenseId: string | null) {
  const [data, setData] = useState<ExpenseData>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!expenseId) {
      setData(null);
      return;
    }
    setIsLoading(true);
    getExpense(expenseId)
      .then((result) => {
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setData(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, [expenseId]);

  return { data, isLoading };
}
