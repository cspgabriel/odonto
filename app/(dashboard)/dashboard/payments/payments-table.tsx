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

interface Payment {
  id: string;
  appointmentId: string;
  totalAmount: string | null;
  status: string;
  issuedAt: Date;
  createdAt: Date;
  patientName: string;
  doctorName: string;
  startTime: Date;
}

export function PaymentsTable({ payments }: { payments: Payment[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Appointment Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.patientName}</TableCell>
              <TableCell>{payment.doctorName}</TableCell>
              <TableCell>
                {format(new Date(payment.startTime), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(Number(payment.totalAmount || 0))}
              </TableCell>
              <TableCell>
                {format(new Date(payment.createdAt), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/dashboard/billing/${payment.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View Invoice
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
