"use server";

import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { payments, patients, invoices, appointments } from "@/lib/db/schema";
import { eq, desc, and, or, ilike, sql, count, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createPaymentSchema = z.object({
  patientId: z.string().uuid("Select a patient"),
  invoiceId: z.string().uuid().optional().nullable(),
  amount: z.number().min(0, "Amount must be at least 0"),
  paymentMethod: z.string().min(1, "Select a payment method"),
  transactionId: z.string().optional().nullable(),
  description: z.string().min(1, "Provide a description of the payment"),
  status: z.enum(["completed", "pending", "failed"]).optional().default("completed"),
});

const updatePaymentSchema = createPaymentSchema.extend({
  id: z.string().uuid(),
});

const deletePaymentSchema = z.object({
  paymentId: z.string().uuid(),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/** createPayment – gated by billing.edit */
export async function createPayment(
  input: z.infer<typeof createPaymentSchema>
): Promise<ActionResult<typeof payments.$inferSelect>> {
  try {
    await requirePermission("billing.edit");

    const parsed = createPaymentSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
      return { success: false, error: msg };
    }

    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.id, parsed.data.patientId))
      .limit(1);

    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    if (parsed.data.invoiceId) {
      const [invoice] = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.id, parsed.data.invoiceId))
        .limit(1);
      if (!invoice) {
        return { success: false, error: "Invoice not found" };
      }
    }

    const [inserted] = await db
      .insert(payments)
      .values({
        patientId: parsed.data.patientId,
        invoiceId: parsed.data.invoiceId ?? null,
        amount: String(parsed.data.amount),
        paymentMethod: parsed.data.paymentMethod,
        transactionId: parsed.data.transactionId?.trim() || null,
        description: parsed.data.description.trim(),
        status: parsed.data.status ?? "completed",
      })
      .returning();

    // Connection 3: auto-update invoice status when payment recorded
    if (inserted && parsed.data.invoiceId) {
      const [totals] = await db
        .select({
          invoiceTotal: invoices.totalAmount,
          paidTotal: sql<string>`coalesce(sum(${payments.amount})::text, '0')`,
        })
        .from(invoices)
        .leftJoin(payments, eq(payments.invoiceId, invoices.id))
        .where(eq(invoices.id, parsed.data.invoiceId))
        .groupBy(invoices.id, invoices.totalAmount);
      if (totals) {
        const invoiceTotal = parseFloat(String(totals.invoiceTotal ?? "0"));
        const paidTotal = parseFloat(String(totals.paidTotal ?? "0"));
        const newStatus = paidTotal >= invoiceTotal ? "paid" : "unpaid";
        await db
          .update(invoices)
          .set({ status: newStatus })
          .where(eq(invoices.id, parsed.data.invoiceId));
      }
    }

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/invoices");
    return { success: true, data: inserted };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to record payments." };
    }
    console.error("[CareNova] createPayment error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record payment",
    };
  }
}

/** updatePayment – gated by billing.edit */
export async function updatePayment(
  input: z.infer<typeof updatePaymentSchema>
): Promise<ActionResult<typeof payments.$inferSelect>> {
  try {
    await requirePermission("billing.edit");

    const parsed = updatePaymentSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
      return { success: false, error: msg };
    }

    const [existing] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.id, parsed.data.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Payment not found" };
    }

    const [updated] = await db
      .update(payments)
      .set({
        patientId: parsed.data.patientId,
        invoiceId: parsed.data.invoiceId ?? null,
        amount: String(parsed.data.amount),
        paymentMethod: parsed.data.paymentMethod,
        transactionId: parsed.data.transactionId?.trim() || null,
        description: parsed.data.description.trim(),
        status: parsed.data.status ?? "completed",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, parsed.data.id))
      .returning();

    revalidatePath("/dashboard/payments");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit payments." };
    }
    console.error("[CareNova] updatePayment error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update payment",
    };
  }
}

/** deletePayment – gated by billing.edit */
export async function deletePayment(
  input: z.infer<typeof deletePaymentSchema>
): Promise<ActionResult> {
  try {
    await requirePermission("billing.edit");

    const parsed = deletePaymentSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
      return { success: false, error: msg };
    }

    await db.delete(payments).where(eq(payments.id, parsed.data.paymentId));

    revalidatePath("/dashboard/payments");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete payments." };
    }
    console.error("[CareNova] deletePayment error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete payment",
    };
  }
}

/** getPayment – gated by billing.view */
export async function getPayment(id: string): Promise<{
  payment: typeof payments.$inferSelect & { patientName?: string | null; invoiceNumber?: string | null } | null;
}> {
  await requirePermission("billing.view");

  const [row] = await db
    .select({
      id: payments.id,
      patientId: payments.patientId,
      invoiceId: payments.invoiceId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      transactionId: payments.transactionId,
      description: payments.description,
      status: payments.status,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      patientName: patients.fullName,
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(payments)
    .leftJoin(patients, eq(payments.patientId, patients.id))
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(eq(payments.id, id))
    .limit(1);

  return { payment: row ?? null };
}

/** getPatientsForPaymentSelect – gated by billing.view */
export async function getPatientsForPaymentSelect(): Promise<
  { id: string; fullName: string }[]
> {
  await requirePermission("billing.view");

  const rows = await db
    .select({ id: patients.id, fullName: patients.fullName })
    .from(patients)
    .orderBy(patients.fullName);
  return rows;
}

/** getInvoicesForPatient – gated by billing.view */
export async function getInvoicesForPatient(
  patientId: string | null
): Promise<{ id: string; invoiceNumber: string | null; totalAmount: string }[]> {
  await requirePermission("billing.view");
  if (!patientId) return [];

  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      totalAmount: invoices.totalAmount,
    })
    .from(invoices)
    .leftJoin(appointments, eq(invoices.appointmentId, appointments.id))
    .where(
      sql`${invoices.patientId} = ${patientId} OR (${appointments.patientId} = ${patientId} AND ${invoices.appointmentId} IS NOT NULL)`
    )
    .orderBy(desc(invoices.issuedAt));

  return rows.map((r) => ({
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    totalAmount: String(r.totalAmount ?? "0"),
  }));
}
