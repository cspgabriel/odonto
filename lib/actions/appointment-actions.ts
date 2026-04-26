"use server";

import { getCurrentUser } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { appointments, patients, users, services, departments, medicalRecords, invoices, invoiceItems } from "@/lib/db/schema";
import { eq, and, ne, desc, count, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  serviceId: z.string().uuid().optional().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

const updateAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  serviceId: z.string().uuid().optional().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().optional(),
});

const rescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  newStartTime: z.string(),
  newEndTime: z.string(),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && endA > startB;
}

/** createAppointment – gated by appointments.create */
export async function createAppointment(
  input: z.infer<typeof createAppointmentSchema>
): Promise<ActionResult<typeof appointments.$inferSelect>> {
  try {
    await requirePermission("appointments.create");

    const parsed = createAppointmentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors[0] ?? "Invalid input",
      };
    }

    const start = new Date(parsed.data.startTime);
    const end = new Date(parsed.data.endTime);
    if (start >= end) {
      return { success: false, error: "End time must be after start time" };
    }

    if (parsed.data.serviceId) {
      const [svc] = await db
        .select({ id: services.id, isActive: services.isActive })
        .from(services)
        .where(eq(services.id, parsed.data.serviceId))
        .limit(1);
      if (!svc || Number(svc.isActive) !== 1) {
        return { success: false, error: "Selected service is not active or not found." };
      }
    }

    const existing = await db
      .select()
      .from(appointments)
      .where(eq(appointments.doctorId, parsed.data.doctorId));

    for (const apt of existing) {
      if (
        overlaps(
          new Date(apt.startTime),
          new Date(apt.endTime),
          start,
          end
        )
      ) {
        return {
          success: false,
          error: "Doctor has an overlapping appointment",
        };
      }
    }

    const [inserted] = await db
      .insert(appointments)
      .values({
        patientId: parsed.data.patientId,
        doctorId: parsed.data.doctorId,
        serviceId: parsed.data.serviceId ?? null,
        startTime: start,
        endTime: end,
        notes: parsed.data.notes ?? null,
      })
      .returning();

    if (!inserted) {
      return { success: false, error: "Failed to create appointment" };
    }

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/patients");
    return { success: true, data: inserted };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create appointments." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to create appointment";
    return { success: false, error: message };
  }
}

/** updateAppointmentStatus – gated by appointments.edit (status change) */
export async function updateAppointmentStatus(
  input: z.infer<typeof updateStatusSchema>
): Promise<ActionResult<typeof appointments.$inferSelect>> {
  try {
    await requirePermission("appointments.edit");
    const user = await getCurrentUser();

    const parsed = updateStatusSchema.safeParse(input);
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

    if (user!.role === "doctor" && apt.doctorId !== user!.id) {
      return { success: false, error: "You can only update your own appointments" };
    }

    const [updated] = await db
      .update(appointments)
      .set({
        status: parsed.data.status,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, parsed.data.appointmentId))
      .returning();

    if (!updated) {
      return { success: false, error: "Failed to update status" };
    }

    // Connection 1: when status becomes completed, auto-create invoice draft if none exists
    if (parsed.data.status === "completed") {
      const [existing] = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.appointmentId, parsed.data.appointmentId))
        .limit(1);
      if (!existing) {
        const [appt] = await db
          .select({
            patientId: appointments.patientId,
            doctorId: appointments.doctorId,
            serviceId: appointments.serviceId,
            serviceName: services.name,
            servicePrice: services.price,
          })
          .from(appointments)
          .leftJoin(services, eq(appointments.serviceId, services.id))
          .where(eq(appointments.id, parsed.data.appointmentId))
          .limit(1);
        if (appt) {
          const [countRow] = await db
            .select({ count: count() })
            .from(invoices);
          const n = Number(countRow?.count ?? 0) + 1;
          const year = new Date().getFullYear();
          const invoiceNumber = `INV-${year}-${String(n).padStart(4, "0")}`;
          const [newInvoice] = await db
            .insert(invoices)
            .values({
              invoiceNumber,
              patientId: appt.patientId,
              appointmentId: parsed.data.appointmentId,
              doctorId: appt.doctorId ?? null,
              serviceId: appt.serviceId ?? null,
              status: "unpaid",
              issuedAt: new Date(),
              dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              totalAmount: appt.servicePrice ?? "0",
            })
            .returning();
          if (newInvoice && appt.serviceId && appt.serviceName && appt.servicePrice) {
            await db.insert(invoiceItems).values({
              invoiceId: newInvoice.id,
              description: appt.serviceName,
              quantity: 1,
              unitPrice: appt.servicePrice,
            });
          }
        }
      }
    }

    // Connection 3: when status becomes confirmed, auto-create medical record if none exists
    if (parsed.data.status === "confirmed") {
      const [existing] = await db
        .select({ id: medicalRecords.id })
        .from(medicalRecords)
        .where(eq(medicalRecords.appointmentId, parsed.data.appointmentId))
        .limit(1);
      if (!existing) {
        await db.insert(medicalRecords).values({
          patientId: updated.patientId,
          doctorId: updated.doctorId,
          appointmentId: updated.id,
          visitDate: new Date(updated.startTime),
          status: "open",
        });
      }
    }

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/patients");
    return { success: true, data: updated     };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to update appointment status." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to update status";
    return { success: false, error: message };
  }
}

/** getAppointmentById – gated by appointments.view */
export async function getAppointmentById(appointmentId: string): Promise<{
  success: true;
  data: typeof appointments.$inferSelect & {
    patientName?: string;
    doctorName?: string;
    serviceName?: string;
    serviceDuration?: number | null;
  };
} | { success: false; error: string }> {
  try {
    await requirePermission("appointments.view");

    const [apt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!apt) return { success: false, error: "Appointment not found" };

    const [patientRow] = await db
      .select({ fullName: patients.fullName })
      .from(patients)
      .where(eq(patients.id, apt.patientId))
      .limit(1);

    const [doctorRow] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, apt.doctorId))
      .limit(1);

    let serviceName: string | undefined;
    let serviceDuration: number | null | undefined;
    if (apt.serviceId) {
      const [svc] = await db
        .select({ name: services.name, duration: services.duration })
        .from(services)
        .where(eq(services.id, apt.serviceId))
        .limit(1);
      serviceName = svc?.name ?? undefined;
      serviceDuration = svc?.duration ?? undefined;
    }

    return {
      success: true,
      data: {
        ...apt,
        patientName: patientRow?.fullName ?? undefined,
        doctorName: doctorRow?.fullName ?? undefined,
        serviceName,
        serviceDuration,
      },
    };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view appointments." };
    }
    return { success: false, error: err instanceof Error ? err.message : "Failed to load appointment" };
  }
}

/** updateAppointment – gated by appointments.edit. Full edit (patient, doctor, time, notes). Validates doctor availability. */
export async function updateAppointment(
  input: z.infer<typeof updateAppointmentSchema>
): Promise<ActionResult<typeof appointments.$inferSelect>> {
  try {
    await requirePermission("appointments.edit");

    const parsed = updateAppointmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }

    const start = new Date(parsed.data.startTime);
    const end = new Date(parsed.data.endTime);
    if (start >= end) {
      return { success: false, error: "End time must be after start time" };
    }

    const [existing] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, parsed.data.appointmentId))
      .limit(1);
    if (!existing) {
      return { success: false, error: "Appointment not found" };
    }

    const others = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, parsed.data.doctorId),
          ne(appointments.id, parsed.data.appointmentId)
        )
      );
    for (const other of others) {
      if (overlaps(new Date(other.startTime), new Date(other.endTime), start, end)) {
        return { success: false, error: "Doctor has an overlapping appointment" };
      }
    }

    if (parsed.data.serviceId !== undefined) {
      if (parsed.data.serviceId) {
        const [svc] = await db
          .select({ id: services.id, isActive: services.isActive })
          .from(services)
          .where(eq(services.id, parsed.data.serviceId))
          .limit(1);
        if (!svc || Number(svc.isActive) !== 1) {
          return { success: false, error: "Selected service is not active or not found." };
        }
      }
    }

    const [updated] = await db
      .update(appointments)
      .set({
        patientId: parsed.data.patientId,
        doctorId: parsed.data.doctorId,
        ...(parsed.data.serviceId !== undefined && { serviceId: parsed.data.serviceId ?? null }),
        startTime: start,
        endTime: end,
        notes: parsed.data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, parsed.data.appointmentId))
      .returning();

    if (!updated) return { success: false, error: "Failed to update" };
    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/patients");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit appointments." };
    }
    return { success: false, error: err instanceof Error ? err.message : "Failed to update appointment" };
  }
}

/** rescheduleAppointment – gated by appointments.reschedule. Validates doctor availability. */
export async function rescheduleAppointment(
  input: z.infer<typeof rescheduleSchema>
): Promise<ActionResult<typeof appointments.$inferSelect>> {
  try {
    await requirePermission("appointments.reschedule");

    const parsed = rescheduleSchema.safeParse(input);
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

    const start = new Date(parsed.data.newStartTime);
    const end = new Date(parsed.data.newEndTime);
    if (start >= end) {
      return { success: false, error: "End time must be after start time" };
    }

    const others = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, apt.doctorId),
          ne(appointments.id, apt.id)
        )
      );

    for (const other of others) {
      if (
        overlaps(
          new Date(other.startTime),
          new Date(other.endTime),
          start,
          end
        )
      ) {
        return {
          success: false,
          error: "Doctor has an overlapping appointment",
        };
      }
    }

    const [updated] = await db
      .update(appointments)
      .set({
        startTime: start,
        endTime: end,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, parsed.data.appointmentId))
      .returning();

    if (!updated) {
      return { success: false, error: "Failed to reschedule" };
    }

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/patients");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to reschedule appointments." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to reschedule";
    return { success: false, error: message };
  }
}

/** List appointments for a patient – gated by appointments.view */
export async function getAppointmentsForPatient(
  patientId: string
): Promise<{ id: string; label: string }[]> {
  await requirePermission("appointments.view");

  const list = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      serviceName: services.name,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.startTime))
    .limit(100);

  return list.map((r) => {
    const d = r.startTime ? new Date(r.startTime) : null;
    const dateStr = d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
    const service = r.serviceName ?? "Appointment";
    return { id: r.id, label: `${dateStr} – ${service}` };
  });
}

/** List doctors (users with role doctor) for dropdowns – gated by appointments.view */
export async function getDoctors(): Promise<
  { id: string; fullName: string }[]
> {
  await requirePermission("appointments.view");

  const list = await db
    .select({ id: users.id, fullName: users.fullName })
    .from(users)
    .where(eq(users.role, "doctor"));
  return list;
}

/** List doctors with specialization and department – gated by appointments.view */
export async function getDoctorsWithDepartment(): Promise<
  { id: string; fullName: string; specialization: string | null; departmentName: string | null }[]
> {
  await requirePermission("appointments.view");

  const list = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      specialization: users.specialization,
      departmentName: departments.name,
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(eq(users.role, "doctor"));
  return list.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    specialization: r.specialization ?? null,
    departmentName: r.departmentName ?? null,
  }));
}

/** deleteAppointment – gated by appointments.delete */
export async function deleteAppointment(input: {
  appointmentId: string;
}): Promise<ActionResult> {
  try {
    await requirePermission("appointments.delete");

    await db.delete(appointments).where(eq(appointments.id, input.appointmentId));

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/patients");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete appointments." };
    }
    const message = err instanceof Error ? err.message : "Failed to delete appointment";
    return { success: false, error: message };
  }
}
