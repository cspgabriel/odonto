"use server";

import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import {
  invoices,
  invoiceItems,
  appointments,
  patients,
  users,
  services,
  departments,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createInvoiceSchema = z.object({
  appointmentId: z.string().uuid(),
  items: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
      itemType: z.string().optional(),
    })
  ).min(1, "At least one item required"),
});

const createInvoiceFromFormSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  items: z.array(
    z.object({
      description: z.string().min(1),
      itemType: z.string().optional(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
    })
  ).min(1, "At least one item required"),
  discount: z.number().min(0).default(0),
  taxPercent: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

const markInvoicePaidSchema = z.object({
  invoiceId: z.string().uuid(),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/** createInvoice – gated by billing.create. Appointment must be completed. Total calculated server-side. */
export async function createInvoice(
  input: z.infer<typeof createInvoiceSchema>
): Promise<ActionResult<typeof invoices.$inferSelect>> {
  try {
    await requirePermission("billing.create");

    const parsed = createInvoiceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors[0] ?? "Invalid input",
      };
    }

    const [apt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, parsed.data.appointmentId))
      .limit(1);

    if (!apt) {
      return { success: false, error: "Appointment not found" };
    }
    if (apt.status !== "completed") {
      return {
        success: false,
        error: "Appointment must be completed before creating an invoice",
      };
    }

    const totalAmount = parsed.data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const issuedAt = new Date();
    const dueAt = new Date(issuedAt);
    dueAt.setDate(dueAt.getDate() + 30);
    const invoiceNumber =
      "INV-" +
      Array.from({ length: 8 }, () =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
      ).join("");

    const patientId = apt.patientId;
    const [invoice] = await db
      .insert(invoices)
      .values({
        patientId,
        appointmentId: parsed.data.appointmentId,
        doctorId: apt.doctorId ?? null,
        serviceId: apt.serviceId ?? null,
        invoiceNumber,
        totalAmount: totalAmount.toFixed(2),
        status: "unpaid",
        issuedAt,
        dueAt,
      })
      .returning();

    if (!invoice) {
      return { success: false, error: "Failed to create invoice" };
    }

    await db.insert(invoiceItems).values(
      parsed.data.items.map((item) => ({
        invoiceId: invoice.id,
        description: item.description,
        itemType: item.itemType ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      }))
    );

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/patients");
    return { success: true, data: invoice };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create invoices." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to create invoice";
    return { success: false, error: message };
  }
}

/** createInvoiceFromForm – gated by billing.create */
export async function createInvoiceFromForm(
  input: z.infer<typeof createInvoiceFromFormSchema>
): Promise<ActionResult<typeof invoices.$inferSelect>> {
  try {
    await requirePermission("billing.create");

    const parsed = createInvoiceFromFormSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors[0] ?? "Invalid input",
      };
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, parsed.data.patientId))
      .limit(1);
    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    const subtotal = parsed.data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxAmount = (subtotal * (parsed.data.taxPercent ?? 0)) / 100;
    const totalAmount = Math.max(
      0,
      subtotal + taxAmount - (parsed.data.discount ?? 0)
    );

    const issuedAt = new Date();
    let dueAt: Date | null = null;
    if (parsed.data.dueAt) {
      const d = new Date(parsed.data.dueAt);
      if (!Number.isNaN(d.getTime())) dueAt = d;
    }
    if (!dueAt) {
      dueAt = new Date(issuedAt);
      dueAt.setDate(dueAt.getDate() + 30);
    }

    const invoiceNumber =
      "INV-" +
      Array.from({ length: 8 }, () =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
      ).join("");

    const [invoice] = await db
      .insert(invoices)
      .values({
        patientId: parsed.data.patientId,
        appointmentId: parsed.data.appointmentId ?? null,
        invoiceNumber,
        totalAmount: totalAmount.toFixed(2),
        discount: String(parsed.data.discount ?? 0),
        taxPercent: String(parsed.data.taxPercent ?? 0),
        notes: parsed.data.notes ?? null,
        status: "unpaid",
        issuedAt,
        dueAt,
      })
      .returning();

    if (!invoice) {
      return { success: false, error: "Failed to create invoice" };
    }

    await db.insert(invoiceItems).values(
      parsed.data.items.map((item) => ({
        invoiceId: invoice.id,
        description: item.description,
        itemType: item.itemType ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      }))
    );

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/patients");
    return { success: true, data: invoice };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create invoices." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to create invoice";
    return { success: false, error: message };
  }
}

/** markInvoicePaid – gated by billing.edit */
export async function markInvoicePaid(
  input: z.infer<typeof markInvoicePaidSchema>
): Promise<ActionResult<typeof invoices.$inferSelect>> {
  try {
    await requirePermission("billing.edit");

    const parsed = markInvoicePaidSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors[0] ?? "Invalid input",
      };
    }

    const [updated] = await db
      .update(invoices)
      .set({ status: "paid" })
      .where(eq(invoices.id, parsed.data.invoiceId))
      .returning();

    if (!updated) {
      return { success: false, error: "Invoice not found" };
    }

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/patients");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit invoices." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to update invoice";
    return { success: false, error: message };
  }
}

/** getInvoice – gated by billing.view */
export async function getInvoice(invoiceId: string): Promise<
  ActionResult<{
    invoice: { id: string; invoiceNumber: string | null; totalAmount: string; status: string; issuedAt: string; dueAt: string | null; discount: string; taxPercent: string; notes: string | null };
    items: { id: string; description: string; itemType: string | null; quantity: number; unitPrice: string }[];
    patientName: string | null;
    patientPhone: string | null;
    doctorName: string | null;
    serviceName: string | null;
    departmentName: string | null;
    appointmentDate: string | null;
  }>
> {
  try {
    await requirePermission("billing.view");

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!invoice) return { success: false, error: "Invoice not found" };

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));

    let patientName: string | null = null;
    let patientPhone: string | null = null;
    let doctorName: string | null = null;
    let appointmentDate: string | null = null;

    if (invoice.doctorId) {
      const [d] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, invoice.doctorId)).limit(1);
      doctorName = d?.fullName ?? null;
    }
    if (invoice.appointmentId) {
      const [apt] = await db
        .select({ patientId: appointments.patientId, doctorId: appointments.doctorId, startTime: appointments.startTime })
        .from(appointments)
        .where(eq(appointments.id, invoice.appointmentId))
        .limit(1);
      if (apt) {
        appointmentDate = apt.startTime ? new Date(apt.startTime).toISOString() : null;
        const [p] = await db.select({ fullName: patients.fullName, phone: patients.phone }).from(patients).where(eq(patients.id, apt.patientId)).limit(1);
        patientName = p?.fullName ?? null;
        patientPhone = p?.phone ?? null;
        if (!doctorName && apt.doctorId) {
          const [d] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, apt.doctorId)).limit(1);
          doctorName = d?.fullName ?? null;
        }
      }
    }
    if (!patientName && invoice.patientId) {
      const [p] = await db.select({ fullName: patients.fullName, phone: patients.phone }).from(patients).where(eq(patients.id, invoice.patientId)).limit(1);
      patientName = p?.fullName ?? null;
      patientPhone = p?.phone ?? null;
    }

    let serviceName: string | null = null;
    let departmentName: string | null = null;
    if (invoice.serviceId) {
      const [svc] = await db
        .select({ name: services.name, departmentId: services.departmentId })
        .from(services)
        .where(eq(services.id, invoice.serviceId))
        .limit(1);
      if (svc) {
        serviceName = svc.name ?? null;
        if (svc.departmentId) {
          const [dept] = await db.select({ name: departments.name }).from(departments).where(eq(departments.id, svc.departmentId)).limit(1);
          departmentName = dept?.name ?? null;
        }
      }
    }

    return {
      success: true,
      data: {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: String(invoice.totalAmount),
          status: invoice.status,
          issuedAt: invoice.issuedAt.toISOString(),
          dueAt: invoice.dueAt ? invoice.dueAt.toISOString() : null,
          discount: String(invoice.discount ?? 0),
          taxPercent: String(invoice.taxPercent ?? 0),
          notes: invoice.notes ?? null,
        },
        items: items.map((i) => ({
          id: i.id,
          description: i.description,
          itemType: i.itemType ?? null,
          quantity: i.quantity,
          unitPrice: String(i.unitPrice),
        })),
        patientName,
        patientPhone,
        doctorName,
        serviceName,
        departmentName,
        appointmentDate,
      },
    };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view billing." };
    }
    const message = err instanceof Error ? err.message : "Failed to load invoice";
    return { success: false, error: message };
  }
}

const updateInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  dueAt: z.string().optional().nullable(),
  items: z.array(
    z.object({
      description: z.string().min(1),
      itemType: z.string().optional(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
    })
  ).min(1, "At least one item required"),
  discount: z.number().min(0).default(0),
  taxPercent: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

/** updateInvoice – gated by billing.edit */
export async function updateInvoice(
  input: z.infer<typeof updateInvoiceSchema>
): Promise<ActionResult<typeof invoices.$inferSelect>> {
  try {
    await requirePermission("billing.edit");

    const parsed = updateInvoiceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors[0] ?? "Invalid input",
      };
    }

    const [existing] = await db.select().from(invoices).where(eq(invoices.id, parsed.data.invoiceId)).limit(1);
    if (!existing) return { success: false, error: "Invoice not found" };

    const subtotal = parsed.data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxAmount = (subtotal * (parsed.data.taxPercent ?? 0)) / 100;
    const totalAmount = Math.max(0, subtotal + taxAmount - (parsed.data.discount ?? 0));

    let dueAt: Date | null = existing.dueAt;
    if (parsed.data.dueAt !== undefined && parsed.data.dueAt !== null) {
      const d = new Date(parsed.data.dueAt);
      if (!Number.isNaN(d.getTime())) dueAt = d;
    }

    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, parsed.data.invoiceId));
    await db.insert(invoiceItems).values(
      parsed.data.items.map((item) => ({
        invoiceId: parsed.data.invoiceId,
        description: item.description,
        itemType: item.itemType ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      }))
    );

    const [updated] = await db
      .update(invoices)
      .set({
        totalAmount: totalAmount.toFixed(2),
        discount: String(parsed.data.discount ?? 0),
        taxPercent: String(parsed.data.taxPercent ?? 0),
        notes: parsed.data.notes ?? null,
        dueAt,
      })
      .where(eq(invoices.id, parsed.data.invoiceId))
      .returning();

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/patients");
    return { success: true, data: updated! };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit invoices." };
    }
    const message = err instanceof Error ? err.message : "Failed to update invoice";
    return { success: false, error: message };
  }
}

const deleteInvoiceSchema = z.object({ invoiceId: z.string().uuid() });

/** deleteInvoice – gated by billing.delete */
export async function deleteInvoice(
  input: z.infer<typeof deleteInvoiceSchema>
): Promise<ActionResult<void>> {
  try {
    await requirePermission("billing.delete");

    const parsed = deleteInvoiceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors[0] ?? "Invalid input",
      };
    }

    await db.delete(invoices).where(eq(invoices.id, parsed.data.invoiceId));

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/patients");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete invoices." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to delete invoice";
    return { success: false, error: message };
  }
}
