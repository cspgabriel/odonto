"use server";

import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { patients, users, invoices } from "@/lib/db/schema";
import { eq, or, ilike, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createPatientSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  address: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  primaryDoctorId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
});

const updatePatientSchema = z.object({
  patientId: z.string().uuid(),
  fullName: z.string().min(1).optional(),
  dateOfBirth: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  height: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
  primaryDoctorId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
});

const getPatientByIdSchema = z.object({
  patientId: z.string(),
});

const deletePatientSchema = z.object({
  patientId: z.string().uuid(),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/** createPatient – gated by patients.create */
export async function createPatient(
  input: z.infer<typeof createPatientSchema>
): Promise<ActionResult<typeof patients.$inferSelect>> {
  try {
    await requirePermission("patients.create");

    const parsed = createPatientSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }

    if (parsed.data.primaryDoctorId) {
      const [doctor] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, parsed.data.primaryDoctorId))
        .limit(1);
      if (!doctor) {
        return { success: false, error: "Selected primary doctor not found or invalid." };
      }
      const [roleRow] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, parsed.data.primaryDoctorId))
        .limit(1);
      if (roleRow?.role !== "doctor") {
        return { success: false, error: "Selected user is not a doctor." };
      }
    }

    const [inserted] = await db
      .insert(patients)
      .values({
        fullName: parsed.data.fullName,
        dateOfBirth: parsed.data.dateOfBirth,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        gender: parsed.data.gender ?? null,
        bloodGroup: parsed.data.bloodGroup ?? null,
        height: parsed.data.height ?? null,
        weight: parsed.data.weight ?? null,
        address: parsed.data.address ?? null,
        medicalHistory: parsed.data.medicalHistory ?? null,
        allergies: parsed.data.allergies ?? null,
        emergencyContactName: parsed.data.emergencyContactName ?? null,
        emergencyContactPhone: parsed.data.emergencyContactPhone ?? null,
        emergencyContactRelation: parsed.data.emergencyContactRelation ?? null,
        primaryDoctorId: parsed.data.primaryDoctorId ?? null,
        departmentId: parsed.data.departmentId ?? null,
      })
      .returning();

    if (!inserted) {
      return { success: false, error: "Failed to create patient" };
    }

    revalidatePath("/dashboard/patients");
    revalidatePath("/dashboard");
    return { success: true, data: inserted };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create patients." };
    }
    const message = err instanceof Error ? err.message : "Failed to create patient";
    return { success: false, error: message };
  }
}

/** updatePatient – gated by patients.edit */
export async function updatePatient(
  input: z.infer<typeof updatePatientSchema>
): Promise<ActionResult<typeof patients.$inferSelect>> {
  try {
    await requirePermission("patients.edit");

    const parsed = updatePatientSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }

    const { patientId, ...rest } = parsed.data;
    const updates: Partial<typeof patients.$inferInsert> = {};
    if (rest.fullName !== undefined) updates.fullName = rest.fullName;
    if (rest.dateOfBirth !== undefined) updates.dateOfBirth = rest.dateOfBirth;
    if (rest.phone !== undefined) updates.phone = rest.phone;
    if (rest.email !== undefined) updates.email = rest.email;
    if (rest.gender !== undefined) updates.gender = rest.gender;
    if (rest.bloodGroup !== undefined) updates.bloodGroup = rest.bloodGroup;
    if (rest.height !== undefined) updates.height = rest.height;
    if (rest.weight !== undefined) updates.weight = rest.weight;
    if (rest.address !== undefined) updates.address = rest.address;
    if (rest.medicalHistory !== undefined) updates.medicalHistory = rest.medicalHistory;
    if (rest.allergies !== undefined) updates.allergies = rest.allergies;
    if (rest.emergencyContactName !== undefined) updates.emergencyContactName = rest.emergencyContactName;
    if (rest.emergencyContactPhone !== undefined) updates.emergencyContactPhone = rest.emergencyContactPhone;
    if (rest.emergencyContactRelation !== undefined) updates.emergencyContactRelation = rest.emergencyContactRelation;
    if (rest.primaryDoctorId !== undefined) {
      if (rest.primaryDoctorId) {
        const [roleRow] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, rest.primaryDoctorId))
          .limit(1);
        if (!roleRow || roleRow.role !== "doctor") {
          return { success: false, error: "Selected user is not a doctor." };
        }
      }
      updates.primaryDoctorId = rest.primaryDoctorId ?? null;
    }
    if (rest.departmentId !== undefined) updates.departmentId = rest.departmentId ?? null;
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(patients)
      .set(updates)
      .where(eq(patients.id, patientId))
      .returning();

    if (!updated) {
      return { success: false, error: "Patient not found" };
    }

    revalidatePath("/dashboard/patients");
    revalidatePath(`/dashboard/patients/${patientId}`);
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit patients." };
    }
    const message = err instanceof Error ? err.message : "Failed to update patient";
    return { success: false, error: message };
  }
}

/** deletePatient – gated by patients.delete. Hard delete (appointments cascade). Blocked if unpaid invoices. */
export async function deletePatient(
  input: z.infer<typeof deletePatientSchema>
): Promise<ActionResult> {
  try {
    await requirePermission("patients.delete");

    const parsed = deletePatientSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }

    const [unpaidCount] = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.patientId, parsed.data.patientId),
          eq(invoices.status, "unpaid")
        )
      );
    const n = Number(unpaidCount?.count ?? 0);
    if (n > 0) {
      return {
        success: false,
        error: `Cannot delete patient — ${n} unpaid invoice(s) remain. Resolve payments first.`,
      };
    }

    await db.delete(patients).where(eq(patients.id, parsed.data.patientId));

    revalidatePath("/dashboard/patients");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete patients." };
    }
    const message = err instanceof Error ? err.message : "Failed to delete patient";
    return { success: false, error: message };
  }
}

/** getDoctorsForPatientAssignment – gated by patients.view */
export async function getDoctorsForPatientAssignment(): Promise<
  { id: string; fullName: string; specialization: string | null }[]
> {
  await requirePermission("patients.view");

  const list = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      specialization: users.specialization,
    })
    .from(users)
    .where(eq(users.role, "doctor"))
    .orderBy(users.fullName);
  return list;
}

/** getPatients – gated by patients.view */
export async function getPatients(): Promise<
  { id: string; fullName: string }[]
> {
  await requirePermission("patients.view");

  const list = await db
    .select({ id: patients.id, fullName: patients.fullName })
    .from(patients)
    .orderBy(patients.fullName);
  return list;
}

/** searchPatients – gated by patients.view */
export async function searchPatients(
  q: string,
  limit = 20
): Promise<
  { id: string; fullName: string; phone: string | null; dateOfBirth: string | null }[]
> {
  await requirePermission("patients.view");

  const trimmed = (q ?? "").trim();
  if (trimmed.length < 2) return [];

  const pattern = `%${trimmed}%`;
  const list = await db
    .select({
      id: patients.id,
      fullName: patients.fullName,
      phone: patients.phone,
      dateOfBirth: patients.dateOfBirth,
    })
    .from(patients)
    .where(
      or(
        ilike(patients.fullName, pattern),
        ilike(patients.phone, pattern)
      )
    )
    .orderBy(patients.fullName)
    .limit(limit);
  return list;
}

/** getPatientById – gated by patients.view */
export async function getPatientById(input: {
  patientId: string;
}): Promise<ActionResult<{ patient: typeof patients.$inferSelect; appointments: unknown[]; invoices: unknown[] }>> {
  try {
    await requirePermission("patients.view");

    const parsed = getPatientByIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid patient ID" };
    }

    const result = await db.query.patients.findFirst({
      where: eq(patients.id, parsed.data.patientId),
      with: {
        appointments: {
          with: { invoice: true, doctor: true },
        },
        primaryDoctor: true,
        department: true,
      },
    });

    if (!result) {
      return { success: false, error: "Patient not found" };
    }

    const { appointments, ...patient } = result;
    const invoices = (appointments ?? [])
      .map((a) => (a as { invoice: unknown }).invoice)
      .filter(Boolean);

    return {
      success: true,
      data: {
        patient,
        appointments: (appointments ?? []) as unknown[],
        invoices,
      },
    };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view patients." };
    }
    const message = err instanceof Error ? err.message : "Failed to get patient";
    return { success: false, error: message };
  }
}
