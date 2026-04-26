"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/preferences-context";
import { MarkInvoicePaidButton } from "./mark-invoice-paid-button";
import { useTranslations } from "@/lib/i18n";

type BillingRow = {
  id: string;
  appointmentId: string;
  totalAmount: string | number;
  status: string;
  issuedAt: Date;
  patientName: string | null;
  doctorName: string | null;
  startTime: Date;
};

export function BillingTable({ list }: { list: BillingRow[] }) {
  const t = useTranslations("billing");
  const { formatAmount, formatDate } = usePreferences();

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("tablePatient")}</TableHead>
            <TableHead>{t("tableAmount")}</TableHead>
            <TableHead>{t("tableStatus")}</TableHead>
            <TableHead>{t("tableIssued")}</TableHead>
            <TableHead className="text-right">{t("tableActions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.patientName}</TableCell>
              <TableCell>
                {formatAmount(
                  typeof inv.totalAmount === "string"
                    ? parseFloat(inv.totalAmount)
                    : Number(inv.totalAmount)
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{inv.status}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(inv.issuedAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/billing/${inv.id}`}>{t("view")}</Link>
                  </Button>
                  {inv.status === "unpaid" && (
                    <MarkInvoicePaidButton invoiceId={inv.id} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
