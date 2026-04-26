"use client";

import { useState, useEffect } from "react";
import {
  getDepartmentById,
  type DepartmentWithRelations,
} from "@/lib/actions/department-actions";

export type DepartmentData = DepartmentWithRelations;

export function useDepartmentData(departmentId: string | null) {
  const [data, setData] = useState<DepartmentData>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!departmentId) {
      setData(null);
      return;
    }
    setIsLoading(true);
    getDepartmentById(departmentId)
      .then((result) => {
        if (result.success) setData(result.data ?? null);
        else setData(null);
      })
      .finally(() => setIsLoading(false));
  }, [departmentId]);

  return { data, isLoading };
}
