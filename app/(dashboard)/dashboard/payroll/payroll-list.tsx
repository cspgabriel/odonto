"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PayrollEntry {
  id: string;
  staffId: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: string | null;
  bonuses: string | null;
  deductions: string | null;
  netAmount: string | null;
  status: string;
  paidAt: Date | null;
  staffName: string;
}

export function PayrollList({ payroll }: { payroll: PayrollEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff Member</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Base Salary</TableHead>
            <TableHead>Bonuses</TableHead>
            <TableHead>Deductions</TableHead>
            <TableHead>Net Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payroll.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.staffName}</TableCell>
              <TableCell>
                {format(new Date(entry.periodStart), "MMM dd")} -{" "}
                {format(new Date(entry.periodEnd), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                {entry.baseSalary
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Number(entry.baseSalary))
                  : "-"}
              </TableCell>
              <TableCell>
                {entry.bonuses
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Number(entry.bonuses))
                  : "-"}
              </TableCell>
              <TableCell>
                {entry.deductions
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Number(entry.deductions))
                  : "-"}
              </TableCell>
              <TableCell className="font-medium">
                {entry.netAmount
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Number(entry.netAmount))
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={entry.status === "paid" ? "default" : "secondary"}>
                  {entry.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/dashboard/payroll/${entry.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
