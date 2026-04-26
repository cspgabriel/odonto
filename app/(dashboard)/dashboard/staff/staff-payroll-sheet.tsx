"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPayrollByStaffId } from "@/lib/actions/staff-actions";
import { format } from "date-fns";
import { Loader2, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PayrollRecord = {
  id: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: string;
  bonuses: string | null;
  deductions: string | null;
  netAmount: string;
  status: string;
  paidAt: Date | null;
};

export function StaffPayrollSheet({
  staffId,
  staffName,
  open,
  onOpenChange,
}: {
  staffId: string | null;
  staffName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("staff");
  const tStatus = useTranslations("status");
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !staffId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    getPayrollByStaffId(staffId)
      .then((res) => {
        if (res.success && res.data) setRecords(res.data);
        else setRecords([]);
      })
      .finally(() => setLoading(false));
  }, [open, staffId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] sm:max-w-[480px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
          <SheetTitle className="font-heading text-xl">{t("payrollTitle")}</SheetTitle>
          <p className="text-sm text-muted-foreground font-medium">{staffName}</p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">{t("loadingPayroll")}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wallet className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm font-medium">{t("noPayrollRecords")}</p>
              <p className="text-xs mt-1">{t("noPayrollDescription")}</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/dashboard/payroll">{t("goToPayroll")}</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">{t("period")}</TableHead>
                  <TableHead className="text-xs">{t("net")}</TableHead>
                  <TableHead className="text-xs">{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {format(new Date(r.periodStart), "MMM d")} – {format(new Date(r.periodEnd), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(r.netAmount))}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        r.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                      }`}>
                        {tStatus(r.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {records.length > 0 && (
          <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/payroll">{t("viewAllPayroll")}</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
