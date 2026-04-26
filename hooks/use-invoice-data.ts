"use client";

import { useState, useEffect } from "react";
import { getInvoice } from "@/lib/actions/invoice-actions";

export type InvoiceDetailData = {
  invoice: { id: string; invoiceNumber: string | null; totalAmount: string; status: string; issuedAt: string; dueAt: string | null; discount: string; taxPercent: string; notes: string | null };
  items: { id: string; description: string; itemType: string | null; quantity: number; unitPrice: string }[];
  patientName: string | null;
  patientPhone: string | null;
  doctorName: string | null;
  serviceName: string | null;
  departmentName: string | null;
  appointmentDate: string | null;
} | null;

export function useInvoiceData(invoiceId: string | null) {
  const [data, setData] = useState<InvoiceDetailData>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setData(null);
      return;
    }
    setIsLoading(true);
    getInvoice(invoiceId)
      .then((result) => {
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setData(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, [invoiceId]);

  return { data, isLoading };
}
