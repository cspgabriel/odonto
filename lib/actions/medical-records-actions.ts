"use server";

import { getCurrentUser } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import {
  medicalRecordVitals,
  clinicalNotes,
  diagnoses,
  medicalAttachments,
  patients,
  users,
  appointments,
  prescriptions,
  testReports,
} from "@/lib/db/schema";
import { eq, desc, asc, ilike, or, and, count, sql, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MEDICAL_ATTACHMENTS_BUCKET = "medical-attachments";
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true; data: T })
  | { success: false; error: string };

const basePath = "/dashboard/medical-records";

// ─── Overview / Summary ─────────────────────────────────────────────────────

export async function getMedicalRecordsOverviewStats() {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { totalRecords: 0, activeCases: 0, completedVisits: 0, totalAttachments: 0 };
  }

  const [v] = await db.select({ c: count() }).from(medicalRecordVitals);
  const [n] = await db.select({ c: count() }).from(clinicalNotes);
  const [d] = await db.select({ c: count() }).from(diagnoses);
  const [a] = await db.select({ c: count() }).from(medicalAttachments);
  const [activeDiag] = await db
    .select({ c: count() })
    .from(diagnoses)
    .where(eq(diagnoses.status, "active"));
  const [completedAppts] = await db
    .select({ c: count() })
    .from(appointments)
    .where(eq(appointments.status, "completed"));

  const totalRecords = (v?.c ?? 0) + (n?.c ?? 0) + (d?.c ?? 0) + (a?.c ?? 0);

  return {
    totalRecords,
    activeCases: activeDiag?.c ?? 0,
    completedVisits: completedAppts?.c ?? 0,
    totalAttachments: a?.c ?? 0,
  };
}

function startOfThisMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getVitalsStats() {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { total: 0, thisMonth: 0 };
  }
  const since = startOfThisMonth();
  const [totalRow] = await db.select({ c: count() }).from(medicalRecordVitals);
  const [monthRow] = await db.select({ c: count() }).from(medicalRecordVitals).where(gte(medicalRecordVitals.recordedAt, since));
  return { total: totalRow?.c ?? 0, thisMonth: monthRow?.c ?? 0 };
}

export async function getClinicalNotesStats() {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { total: 0, thisMonth: 0 };
  }
  const since = startOfThisMonth();
  const [totalRow] = await db.select({ c: count() }).from(clinicalNotes);
  const [monthRow] = await db.select({ c: count() }).from(clinicalNotes).where(gte(clinicalNotes.createdAt, since));
  return { total: totalRow?.c ?? 0, thisMonth: monthRow?.c ?? 0 };
}

export async function getDiagnosesStats() {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { total: 0, active: 0, thisMonth: 0 };
  }
  const since = startOfThisMonth();
  const [totalRow] = await db.select({ c: count() }).from(diagnoses);
  const [activeRow] = await db.select({ c: count() }).from(diagnoses).where(eq(diagnoses.status, "active"));
  const [monthRow] = await db.select({ c: count() }).from(diagnoses).where(gte(diagnoses.diagnosedAt, since));
  return { total: totalRow?.c ?? 0, active: activeRow?.c ?? 0, thisMonth: monthRow?.c ?? 0 };
}

export async function getAttachmentsStats() {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { total: 0, thisMonth: 0 };
  }
  const since = startOfThisMonth();
  const [totalRow] = await db.select({ c: count() }).from(medicalAttachments);
  const [monthRow] = await db.select({ c: count() }).from(medicalAttachments).where(gte(medicalAttachments.createdAt, since));
  return { total: totalRow?.c ?? 0, thisMonth: monthRow?.c ?? 0 };
}

export type MedicalRecordOverviewRow = {
  patientId: string;
  patientName: string | null;
  primaryDoctorName: string | null;
  primaryDoctorSpecialization: string | null;
  totalRecords: number;
  activeCases: number;
  completedVisits: number;
  lastActivityAt: Date | null;
};

export async function getMedicalRecordsOverviewList({
  patientId,
  q,
  status,
  page = 1,
  pageSize = 10,
  sortBy = "lastActivityAt",
  sortOrder = "desc",
}: {
  patientId?: string;
  q?: string;
  status?: "all" | "active" | "completed";
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { list: [], totalCount: 0 };
  }

  const search = (q ?? "").trim();
  const offset = (page - 1) * pageSize;

  const patientFilter = patientId ? sql`AND p.id = ${patientId}::uuid` : sql``;
  const statusFilter =
    status === "active"
      ? sql`AND (SELECT COUNT(*) FROM diagnoses d2 WHERE d2.patient_id = p.id AND d2.status = 'active') > 0`
      : status === "completed"
        ? sql`AND (SELECT COUNT(*) FROM diagnoses d2 WHERE d2.patient_id = p.id AND d2.status = 'resolved') > 0 AND (SELECT COUNT(*) FROM diagnoses d2 WHERE d2.patient_id = p.id AND d2.status = 'active') = 0`
        : sql``;
  const searchFilter = search
    ? sql`AND (p.full_name ILIKE ${`%${search}%`} OR p.phone ILIKE ${`%${search}%`})`
    : sql``;

  const countResult = await db.execute(sql`
    WITH rec AS (
      SELECT patient_id FROM medical_record_vitals
      UNION SELECT patient_id FROM clinical_notes
      UNION SELECT patient_id FROM diagnoses
      UNION SELECT patient_id FROM medical_attachments
    )
    SELECT COUNT(*)::int AS value FROM patients p
    INNER JOIN rec r ON r.patient_id = p.id
    WHERE 1=1 ${patientFilter} ${searchFilter} ${statusFilter}
  `);
  const countRows = Array.isArray(countResult) ? countResult : (countResult as { rows?: { value?: number }[] }).rows ?? [];
  const totalCount = Number(countRows[0]?.value ?? 0);

  const listResult = await db.execute(sql`
    WITH rec AS (
      SELECT patient_id FROM medical_record_vitals
      UNION SELECT patient_id FROM clinical_notes
      UNION SELECT patient_id FROM diagnoses
      UNION SELECT patient_id FROM medical_attachments
    ),
    v AS (
      SELECT patient_id, COUNT(*)::int AS c, MAX(recorded_at) AS last_at
      FROM medical_record_vitals GROUP BY patient_id
    ),
    n AS (
      SELECT patient_id, COUNT(*)::int AS c, MAX(created_at) AS last_at
      FROM clinical_notes GROUP BY patient_id
    ),
    d AS (
      SELECT patient_id,
        COUNT(*)::int AS c,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_cases,
        MAX(created_at) AS last_at
      FROM diagnoses GROUP BY patient_id
    ),
    att AS (
      SELECT patient_id, COUNT(*)::int AS c, MAX(created_at) AS last_at
      FROM medical_attachments GROUP BY patient_id
    ),
    appts AS (
      SELECT patient_id, COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_visits
      FROM appointments GROUP BY patient_id
    )
    SELECT
      p.id AS patient_id,
      p.full_name AS patient_name,
      doc.full_name AS primary_doctor_name,
      doc.specialization AS primary_doctor_specialization,
      (COALESCE(v.c,0) + COALESCE(n.c,0) + COALESCE(d.c,0) + COALESCE(att.c,0))::int AS total_records,
      COALESCE(d.active_cases, 0)::int AS active_cases,
      COALESCE(appts.completed_visits, 0)::int AS completed_visits,
      greatest(COALESCE(v.last_at, '1970-01-01'::timestamptz), COALESCE(n.last_at, '1970-01-01'::timestamptz), COALESCE(d.last_at, '1970-01-01'::timestamptz), COALESCE(att.last_at, '1970-01-01'::timestamptz)) AS last_activity_at
    FROM patients p
    INNER JOIN rec r ON r.patient_id = p.id
    LEFT JOIN users doc ON doc.id = p.primary_doctor_id
    LEFT JOIN v ON v.patient_id = p.id
    LEFT JOIN n ON n.patient_id = p.id
    LEFT JOIN d ON d.patient_id = p.id
    LEFT JOIN att ON att.patient_id = p.id
    LEFT JOIN appts ON appts.patient_id = p.id
    WHERE 1=1 ${patientFilter} ${searchFilter} ${statusFilter}
    ORDER BY last_activity_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const listRows = Array.isArray(listResult) ? listResult : (listResult as { rows?: Record<string, unknown>[] }).rows ?? [];
  const list: MedicalRecordOverviewRow[] = listRows.map((row: Record<string, unknown>) => ({
    patientId: String(row.patient_id ?? ""),
    patientName: row.patient_name != null ? String(row.patient_name) : null,
    primaryDoctorName: row.primary_doctor_name != null ? String(row.primary_doctor_name) : null,
    primaryDoctorSpecialization: row.primary_doctor_specialization != null ? String(row.primary_doctor_specialization) : null,
    totalRecords: Number(row.total_records ?? 0),
    activeCases: Number(row.active_cases ?? 0),
    completedVisits: Number(row.completed_visits ?? 0),
    lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at as string | Date) : null,
  }));

  return { list, totalCount };
}

// ─── Vitals ────────────────────────────────────────────────────────────────

const createVitalsSchema = z.object({
  patientId: z.string().uuid(),
  bloodPressureSystolic: z.number().int().optional(),
  bloodPressureDiastolic: z.number().int().optional(),
  heartRate: z.number().int().optional(),
  temperature: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
});

function computeBmi(weightKg: number | null, heightM: number | null): string | null {
  if (weightKg == null || heightM == null || heightM <= 0) return null;
  const bmi = weightKg / (heightM * heightM);
  return bmi.toFixed(2);
}

export async function getVitalsList({
  patientId,
  q,
  page = 1,
  pageSize = 10,
  sortBy = "recordedAt",
  sortOrder = "desc",
}: {
  patientId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { list: [], totalCount: 0 };
  }

  const whereClause = patientId
    ? eq(medicalRecordVitals.patientId, patientId)
    : q
      ? or(
          ilike(patients.fullName, `%${q}%`),
          ilike(patients.phone, `%${q}%`)
        )
      : undefined;

  const [totalRow] = await db
    .select({ value: count() })
    .from(medicalRecordVitals)
    .leftJoin(patients, eq(medicalRecordVitals.patientId, patients.id))
    .where(whereClause);
  const totalCount = totalRow?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const orderBy =
    sortBy === "recordedAt"
      ? sortOrder === "desc"
        ? desc(medicalRecordVitals.recordedAt)
        : asc(medicalRecordVitals.recordedAt)
      : sortOrder === "desc"
        ? desc(medicalRecordVitals.createdAt)
        : asc(medicalRecordVitals.createdAt);

  const list = await db
    .select({
      id: medicalRecordVitals.id,
      patientId: medicalRecordVitals.patientId,
      patientName: patients.fullName,
      recordedAt: medicalRecordVitals.recordedAt,
      recordedByName: users.fullName,
      bloodPressureSystolic: medicalRecordVitals.bloodPressureSystolic,
      bloodPressureDiastolic: medicalRecordVitals.bloodPressureDiastolic,
      heartRate: medicalRecordVitals.heartRate,
      temperature: medicalRecordVitals.temperature,
      weight: medicalRecordVitals.weight,
      height: medicalRecordVitals.height,
      bmi: medicalRecordVitals.bmi,
      createdAt: medicalRecordVitals.createdAt,
    })
    .from(medicalRecordVitals)
    .leftJoin(patients, eq(medicalRecordVitals.patientId, patients.id))
    .leftJoin(users, eq(medicalRecordVitals.recordedById, users.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  return { list, totalCount };
}

export async function createVitals(
  input: z.infer<typeof createVitalsSchema>
): Promise<ActionResult<typeof medicalRecordVitals.$inferSelect>> {
  try {
    await requirePermission("medical_records.create");
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const parsed = createVitalsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }

    const { patientId, weight, height, bloodPressureSystolic, bloodPressureDiastolic, heartRate, temperature } = parsed.data;
    const heightM = height != null ? height / 100 : null;
    const weightKg = weight ?? null;
    const bmi = computeBmi(weightKg, heightM);

    const [row] = await db
      .insert(medicalRecordVitals)
      .values({
        patientId,
        recordedById: user.id,
        weight: weight != null ? String(weight) : null,
        height: height != null ? String(height) : null,
        bmi: bmi ?? null,
        temperature: temperature != null ? String(temperature) : null,
        bloodPressureSystolic: bloodPressureSystolic ?? null,
        bloodPressureDiastolic: bloodPressureDiastolic ?? null,
        heartRate: heartRate ?? null,
      })
      .returning();
    revalidatePath(basePath);
    revalidatePath(`${basePath}/vitals`);
    return { success: true, data: row };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create vitals",
    };
  }
}

const updateVitalsSchema = z.object({
  id: z.string().uuid(),
  bloodPressureSystolic: z.number().int().optional(),
  bloodPressureDiastolic: z.number().int().optional(),
  heartRate: z.number().int().optional(),
  temperature: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
});

export async function updateVitals(
  input: z.infer<typeof updateVitalsSchema>
): Promise<ActionResult<typeof medicalRecordVitals.$inferSelect>> {
  try {
    await requirePermission("medical_records.edit");
    const parsed = updateVitalsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }
    const { id, weight, height, bloodPressureSystolic, bloodPressureDiastolic, heartRate, temperature } = parsed.data;
    const heightM = height != null ? height / 100 : null;
    const weightKg = weight ?? null;
    const bmi = computeBmi(weightKg, heightM);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (weight != null) updates.weight = String(weight);
    if (height != null) updates.height = String(height);
    if (bmi != null) updates.bmi = bmi;
    if (temperature != null) updates.temperature = String(temperature);
    if (bloodPressureSystolic != null) updates.bloodPressureSystolic = bloodPressureSystolic;
    if (bloodPressureDiastolic != null) updates.bloodPressureDiastolic = bloodPressureDiastolic;
    if (heartRate != null) updates.heartRate = heartRate;
    const [row] = await db
      .update(medicalRecordVitals)
      .set(updates as typeof medicalRecordVitals.$inferInsert)
      .where(eq(medicalRecordVitals.id, id))
      .returning();
    if (!row) return { success: false, error: "Vitals record not found" };
    revalidatePath(basePath);
    revalidatePath(`${basePath}/vitals`);
    return { success: true, data: row };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update vitals",
    };
  }
}

export async function deleteVitals(id: string): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.delete");
    await db.delete(medicalRecordVitals).where(eq(medicalRecordVitals.id, id));
    revalidatePath(basePath);
    revalidatePath(`${basePath}/vitals`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete",
    };
  }
}

// ─── Clinical Notes ────────────────────────────────────────────────────────

const createClinicalNoteSchema = z.object({
  patientId: z.string().uuid(),
  content: z.string().min(1),
  appointmentId: z.string().uuid().optional(),
});

export async function getClinicalNotesList({
  patientId,
  q,
  page = 1,
  pageSize = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  patientId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { list: [], totalCount: 0 };
  }

  const where = patientId
    ? eq(clinicalNotes.patientId, patientId)
    : q
      ? or(
          ilike(patients.fullName, `%${q}%`),
          ilike(patients.phone, `%${q}%`)
        )
      : undefined;

  const [totalRow] = await db
    .select({ value: count() })
    .from(clinicalNotes)
    .leftJoin(patients, eq(clinicalNotes.patientId, patients.id))
    .where(where);
  const totalCount = totalRow?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const orderBy =
    sortBy === "createdAt"
      ? sortOrder === "desc"
        ? desc(clinicalNotes.createdAt)
        : asc(clinicalNotes.createdAt)
      : sortOrder === "desc"
        ? desc(clinicalNotes.updatedAt)
        : asc(clinicalNotes.updatedAt);

  const list = await db
    .select({
      id: clinicalNotes.id,
      patientId: clinicalNotes.patientId,
      patientName: patients.fullName,
      content: clinicalNotes.content,
      authorName: users.fullName,
      authorSpecialization: users.specialization,
      createdAt: clinicalNotes.createdAt,
      appointmentId: clinicalNotes.appointmentId,
    })
    .from(clinicalNotes)
    .leftJoin(patients, eq(clinicalNotes.patientId, patients.id))
    .leftJoin(users, eq(clinicalNotes.authorId, users.id))
    .where(where)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  return { list, totalCount };
}

export async function createClinicalNote(
  input: z.infer<typeof createClinicalNoteSchema>
): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.create");
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const parsed = createClinicalNoteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }

    await db.insert(clinicalNotes).values({
      patientId: parsed.data.patientId,
      authorId: user.id,
      content: parsed.data.content,
      appointmentId: parsed.data.appointmentId ?? null,
    });
    revalidatePath(basePath);
    revalidatePath(`${basePath}/clinical-notes`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create note",
    };
  }
}

const updateClinicalNoteSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  appointmentId: z.string().uuid().optional().nullable(),
});

export async function updateClinicalNote(
  input: z.infer<typeof updateClinicalNoteSchema>
): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.edit");
    const parsed = updateClinicalNoteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }
    await db
      .update(clinicalNotes)
      .set({
        content: parsed.data.content,
        appointmentId: parsed.data.appointmentId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(clinicalNotes.id, parsed.data.id));
    revalidatePath(basePath);
    revalidatePath(`${basePath}/clinical-notes`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update note",
    };
  }
}

export async function deleteClinicalNote(id: string): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.delete");
    await db.delete(clinicalNotes).where(eq(clinicalNotes.id, id));
    revalidatePath(basePath);
    revalidatePath(`${basePath}/clinical-notes`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete",
    };
  }
}

// ─── Diagnoses ─────────────────────────────────────────────────────────────

const createDiagnosisSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(1),
  icdCode: z.string().optional(),
  status: z.enum(["active", "resolved"]).default("active"),
  diagnosedAt: z.string().optional(),
});

export async function getDiagnosesList({
  patientId,
  q,
  status,
  page = 1,
  pageSize = 10,
  sortBy = "diagnosedAt",
  sortOrder = "desc",
}: {
  patientId?: string;
  q?: string;
  status?: "active" | "resolved" | "all";
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { list: [], totalCount: 0 };
  }

  const wherePatient = patientId ? eq(diagnoses.patientId, patientId) : undefined;
  const whereStatus =
    status && status !== "all" ? eq(diagnoses.status, status) : undefined;
  const whereSearch = q
    ? or(
        ilike(patients.fullName, `%${q}%`),
        ilike(patients.phone, `%${q}%`),
        ilike(diagnoses.title, `%${q}%`)
      )
    : undefined;
  const where =
    wherePatient && whereStatus && whereSearch
      ? and(wherePatient, whereStatus, whereSearch)
      : wherePatient && whereStatus
        ? and(wherePatient, whereStatus)
        : wherePatient && whereSearch
          ? and(wherePatient, whereSearch)
          : whereStatus && whereSearch
            ? and(whereStatus, whereSearch)
            : wherePatient ?? whereStatus ?? whereSearch;

  const [totalRow] = await db
    .select({ value: count() })
    .from(diagnoses)
    .leftJoin(patients, eq(diagnoses.patientId, patients.id))
    .where(where);
  const totalCount = totalRow?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const orderBy =
    sortBy === "title"
      ? sortOrder === "desc"
        ? desc(diagnoses.title)
        : asc(diagnoses.title)
      : sortBy === "diagnosedAt"
        ? sortOrder === "desc"
          ? desc(diagnoses.diagnosedAt)
          : asc(diagnoses.diagnosedAt)
        : sortOrder === "desc"
          ? desc(diagnoses.createdAt)
          : asc(diagnoses.createdAt);

  const list = await db
    .select({
      id: diagnoses.id,
      patientId: diagnoses.patientId,
      patientName: patients.fullName,
      title: diagnoses.title,
      icdCode: diagnoses.icdCode,
      status: diagnoses.status,
      diagnosedAt: diagnoses.diagnosedAt,
      createdAt: diagnoses.createdAt,
      doctorName: users.fullName,
      doctorSpecialization: users.specialization,
    })
    .from(diagnoses)
    .leftJoin(patients, eq(diagnoses.patientId, patients.id))
    .leftJoin(users, eq(diagnoses.doctorId, users.id))
    .where(where)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  return { list, totalCount };
}

export async function createDiagnosis(
  input: z.infer<typeof createDiagnosisSchema>
): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.create");
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const parsed = createDiagnosisSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }

    await db.insert(diagnoses).values({
      patientId: parsed.data.patientId,
      doctorId: user.role === "doctor" ? user.id : null,
      title: parsed.data.title,
      icdCode: parsed.data.icdCode ?? null,
      status: parsed.data.status as "active" | "resolved",
      diagnosedAt: parsed.data.diagnosedAt
        ? new Date(parsed.data.diagnosedAt)
        : new Date(),
    });
    revalidatePath(basePath);
    revalidatePath(`${basePath}/diagnoses`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create diagnosis",
    };
  }
}

const updateDiagnosisSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  icdCode: z.string().optional().nullable(),
  status: z.enum(["active", "resolved"]),
  diagnosedAt: z.string().optional(),
});

export async function updateDiagnosis(
  input: z.infer<typeof updateDiagnosisSchema>
): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.edit");
    const parsed = updateDiagnosisSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }
    const { id, title, icdCode, status, diagnosedAt } = parsed.data;
    await db
      .update(diagnoses)
      .set({
        title,
        icdCode: icdCode ?? null,
        status,
        ...(diagnosedAt != null && diagnosedAt !== "" && { diagnosedAt: new Date(diagnosedAt) }),
        updatedAt: new Date(),
      })
      .where(eq(diagnoses.id, id));
    revalidatePath(basePath);
    revalidatePath(`${basePath}/diagnoses`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update diagnosis",
    };
  }
}

export async function updateDiagnosisStatus(
  id: string,
  status: "active" | "resolved"
): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.edit");
    await db.update(diagnoses).set({ status, updatedAt: new Date() }).where(eq(diagnoses.id, id));
    revalidatePath(basePath);
    revalidatePath(`${basePath}/diagnoses`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update",
    };
  }
}

export async function deleteDiagnosis(id: string): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.delete");
    await db.delete(diagnoses).where(eq(diagnoses.id, id));
    revalidatePath(basePath);
    revalidatePath(`${basePath}/diagnoses`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete",
    };
  }
}

// ─── Attachments ────────────────────────────────────────────────────────────

export async function getAttachmentsList({
  patientId,
  q,
  page = 1,
  pageSize = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  patientId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { list: [], totalCount: 0 };
  }

  const wherePatient = patientId ? eq(medicalAttachments.patientId, patientId) : undefined;
  const whereSearch = q
    ? or(
        ilike(patients.fullName, `%${q}%`),
        ilike(patients.phone, `%${q}%`),
        ilike(medicalAttachments.fileName, `%${q}%`)
      )
    : undefined;
  const where =
    wherePatient && whereSearch ? and(wherePatient, whereSearch) : wherePatient ?? whereSearch;

  const [totalRow] = await db
    .select({ value: count() })
    .from(medicalAttachments)
    .leftJoin(patients, eq(medicalAttachments.patientId, patients.id))
    .where(where);
  const totalCount = totalRow?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const orderBy =
    sortOrder === "desc"
      ? desc(medicalAttachments.createdAt)
      : asc(medicalAttachments.createdAt);

  const list = await db
    .select({
      id: medicalAttachments.id,
      patientId: medicalAttachments.patientId,
      patientName: patients.fullName,
      fileName: medicalAttachments.fileName,
      fileUrl: medicalAttachments.fileUrl,
      fileType: medicalAttachments.fileType,
      appointmentId: medicalAttachments.appointmentId,
      createdAt: medicalAttachments.createdAt,
    })
    .from(medicalAttachments)
    .leftJoin(patients, eq(medicalAttachments.patientId, patients.id))
    .where(where)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  return { list, totalCount };
}

async function ensureMedicalAttachmentsBucket(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) return { ok: false, error: listError.message };
  if (buckets?.some((b) => b.name === MEDICAL_ATTACHMENTS_BUCKET)) return { ok: true };
  const { error: createError } = await supabase.storage.createBucket(MEDICAL_ATTACHMENTS_BUCKET, {
    public: true,
    fileSizeLimit: MAX_ATTACHMENT_SIZE_BYTES,
  });
  if (createError && !createError.message?.toLowerCase().includes("already exists"))
    return { ok: false, error: createError.message };
  return { ok: true };
}

/**
 * Upload a file to Supabase Storage (medical-attachments bucket) and return the public URL.
 * Use this before createAttachment when the user uploads a file.
 */
export async function uploadMedicalAttachment(
  formData: FormData
): Promise<{ success: true; url: string; fileName: string; fileType: string } | { success: false; error: string }> {
  try {
    await requirePermission("medical_records.create");

    const file = formData.get("file") as File | null;
    const patientId = formData.get("patientId") as string | null;
    if (!file || !(file instanceof File)) return { success: false, error: "No file provided" };
    if (!patientId || typeof patientId !== "string") return { success: false, error: "Patient is required" };

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) return { success: false, error: "File must be under 10MB" };
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type))
      return { success: false, error: "Use PDF, JPG, PNG, GIF, WebP, or DOC/DOCX" };

    const supabase = getSupabaseAdmin();
    if (!supabase) return { success: false, error: "Storage not configured" };

    const bucket = await ensureMedicalAttachmentsBucket(supabase);
    if (!bucket.ok) return { success: false, error: bucket.error };

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const path = `${patientId}/${Date.now()}-${Math.random().toString(36).substring(7)}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(MEDICAL_ATTACHMENTS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: urlData } = supabase.storage
      .from(MEDICAL_ATTACHMENTS_BUCKET)
      .getPublicUrl(path);

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
      fileType: file.type,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}

/** Returns storage path if URL is from our medical-attachments bucket, else null. */
function getStoragePathFromUrl(fileUrl: string): string | null {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    const prefix = `${base.replace(/\/$/, "")}/storage/v1/object/public/${MEDICAL_ATTACHMENTS_BUCKET}/`;
    if (!fileUrl.startsWith(prefix)) return null;
    return fileUrl.slice(prefix.length);
  } catch {
    return null;
  }
}

const createAttachmentSchema = z.object({
  patientId: z.string().uuid(),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileType: z.string().optional(),
  appointmentId: z.string().uuid().optional(),
});

export async function createAttachment(
  input: z.infer<typeof createAttachmentSchema>
): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.create");
    const parsed = createAttachmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
    }
    await db.insert(medicalAttachments).values({
      patientId: parsed.data.patientId,
      fileName: parsed.data.fileName,
      fileUrl: parsed.data.fileUrl,
      fileType: parsed.data.fileType ?? null,
      appointmentId: parsed.data.appointmentId ?? null,
    });
    revalidatePath(basePath);
    revalidatePath(`${basePath}/attachments`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to add attachment",
    };
  }
}

export async function deleteAttachment(id: string): Promise<ActionResult> {
  try {
    await requirePermission("medical_records.delete");

    const [row] = await db
      .select({ fileUrl: medicalAttachments.fileUrl })
      .from(medicalAttachments)
      .where(eq(medicalAttachments.id, id));
    if (row?.fileUrl) {
      const storagePath = getStoragePathFromUrl(row.fileUrl);
      if (storagePath) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          await supabase.storage.from(MEDICAL_ATTACHMENTS_BUCKET).remove([storagePath]);
        }
      }
    }

    await db.delete(medicalAttachments).where(eq(medicalAttachments.id, id));
    revalidatePath(basePath);
    revalidatePath(`${basePath}/attachments`);
    return { success: true };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete medical records." };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete",
    };
  }
}

// ─── Visit Timeline (unified events) ────────────────────────────────────────

export type TimelineEventType =
  | "visit_created"
  | "vitals_recorded"
  | "diagnosis_added"
  | "attachment_uploaded"
  | "note_added"
  | "prescription_issued"
  | "test_report_added";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  patientId: string;
  patientName: string | null;
  userName: string | null;
  userSpecialization?: string | null;
  timestamp: Date;
  label: string;
  meta?: Record<string, unknown>;
};

export async function getTimelineEvents({
  patientId,
  q,
  page = 1,
  pageSize = 20,
  sortOrder = "desc",
  onlyVisits = false,
}: {
  patientId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sortOrder?: "asc" | "desc";
  /** When true, only return visit (appointment) events. Used by Visit Timeline page. */
  onlyVisits?: boolean;
}) {
  try {
    await requirePermission("medical_records.view");
  } catch {
    return { list: [], totalCount: 0 };
  }

  const events: TimelineEvent[] = [];
  const wherePatient = patientId ? eq(patients.id, patientId) : undefined;
  const search = (q ?? "").trim();

  // Visit Timeline: show past 3 days + next 3 months (doctor planning window)
  let apptWhere;
  if (onlyVisits) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startFrom = new Date(today);
    startFrom.setDate(startFrom.getDate() - 3);
    const endAt = new Date(today);
    endAt.setMonth(endAt.getMonth() + 3);

    const parts = [
      gte(appointments.startTime, startFrom),
      lt(appointments.startTime, endAt),
    ];
    if (search) {
      parts.push(or(ilike(patients.fullName, `%${search}%`), ilike(patients.phone, `%${search}%`))!);
    }
    if (wherePatient) {
      parts.push(eq(appointments.patientId, patientId!));
    }
    apptWhere = and(...parts);
  } else {
    apptWhere = search
      ? and(
          wherePatient ?? sql`1=1`,
          or(ilike(patients.fullName, `%${search}%`), ilike(patients.phone, `%${search}%`))
        )
      : wherePatient
        ? eq(appointments.patientId, patientId!)
        : undefined;
  }

  const apptRows = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      patientName: patients.fullName,
      doctorId: appointments.doctorId,
      doctorName: users.fullName,
      doctorSpecialization: users.specialization,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(users, eq(appointments.doctorId, users.id))
    .where(apptWhere)
    .orderBy(desc(appointments.startTime))
    .limit(onlyVisits ? 500 : 100);

  if (onlyVisits) {
    for (const row of apptRows) {
      const startTime = row.startTime instanceof Date ? row.startTime : new Date(row.startTime);
      const endTime = row.endTime instanceof Date ? row.endTime : new Date(row.endTime);
      events.push({
        id: row.id,
        type: "visit_created",
        patientId: row.patientId ?? "",
        patientName: row.patientName,
        userName: row.doctorName ?? null,
        userSpecialization: row.doctorSpecialization ?? null,
        timestamp: startTime,
        label: "Visit created",
        meta: {
          doctorId: row.doctorId ?? undefined,
          doctorSpecialization: row.doctorSpecialization ?? undefined,
          status: row.status,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
    }
    events.sort(
      (a, b) =>
        (sortOrder === "desc" ? 1 : -1) *
        (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
    const totalCount = events.length;
    const offset = (page - 1) * pageSize;
    const list = events.slice(offset, offset + pageSize);
    return { list, totalCount };
  }

  const [vitalsRows, notesRows, diagRows, attachRows, prescriptionRows, testReportRows] = await Promise.all([
    db
      .select({
        id: medicalRecordVitals.id,
        patientId: medicalRecordVitals.patientId,
        patientName: patients.fullName,
        recordedByName: users.fullName,
        recordedAt: medicalRecordVitals.recordedAt,
      })
      .from(medicalRecordVitals)
      .leftJoin(patients, eq(medicalRecordVitals.patientId, patients.id))
      .leftJoin(users, eq(medicalRecordVitals.recordedById, users.id))
      .where(
        search
          ? and(
              wherePatient ?? sql`1=1`,
              or(ilike(patients.fullName, `%${search}%`), ilike(patients.phone, `%${search}%`))
            )
          : wherePatient
            ? eq(medicalRecordVitals.patientId, patientId!)
            : undefined
      )
      .orderBy(desc(medicalRecordVitals.recordedAt))
      .limit(100),
    db
      .select({
        id: clinicalNotes.id,
        patientId: clinicalNotes.patientId,
        patientName: patients.fullName,
        authorName: users.fullName,
        createdAt: clinicalNotes.createdAt,
      })
      .from(clinicalNotes)
      .leftJoin(patients, eq(clinicalNotes.patientId, patients.id))
      .leftJoin(users, eq(clinicalNotes.authorId, users.id))
      .where(
        search
          ? and(
              wherePatient ?? sql`1=1`,
              or(ilike(patients.fullName, `%${search}%`), ilike(patients.phone, `%${search}%`))
            )
          : wherePatient
            ? eq(clinicalNotes.patientId, patientId!)
            : undefined
      )
      .orderBy(desc(clinicalNotes.createdAt))
      .limit(100),
    db
      .select({
        id: diagnoses.id,
        patientId: diagnoses.patientId,
        patientName: patients.fullName,
        title: diagnoses.title,
        diagnosedAt: diagnoses.diagnosedAt,
      })
      .from(diagnoses)
      .leftJoin(patients, eq(diagnoses.patientId, patients.id))
      .where(
        search
          ? and(
              wherePatient ?? sql`1=1`,
              or(ilike(patients.fullName, `%${search}%`), ilike(patients.phone, `%${search}%`))
            )
          : wherePatient
            ? eq(diagnoses.patientId, patientId!)
            : undefined
      )
      .orderBy(desc(diagnoses.diagnosedAt))
      .limit(100),
    db
      .select({
        id: medicalAttachments.id,
        patientId: medicalAttachments.patientId,
        patientName: patients.fullName,
        fileName: medicalAttachments.fileName,
        createdAt: medicalAttachments.createdAt,
      })
      .from(medicalAttachments)
      .leftJoin(patients, eq(medicalAttachments.patientId, patients.id))
      .where(
        search
          ? and(
              wherePatient ?? sql`1=1`,
              or(ilike(patients.fullName, `%${search}%`), ilike(patients.phone, `%${search}%`))
            )
          : wherePatient
            ? eq(medicalAttachments.patientId, patientId!)
            : undefined
      )
      .orderBy(desc(medicalAttachments.createdAt))
      .limit(100),
    db
      .select({
        id: prescriptions.id,
        patientId: prescriptions.patientId,
        patientName: patients.fullName,
        medication: prescriptions.medication,
        issuedAt: prescriptions.issuedAt,
        doctorName: users.fullName,
      })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .leftJoin(users, eq(prescriptions.doctorId, users.id))
      .where(
        search
          ? and(
              wherePatient ?? sql`1=1`,
              or(ilike(patients.fullName, `%${search}%`), ilike(patients.phone, `%${search}%`))
            )
          : wherePatient
            ? eq(prescriptions.patientId, patientId!)
            : undefined
      )
      .orderBy(desc(prescriptions.issuedAt))
      .limit(100),
    db
      .select({
        id: testReports.id,
        patientId: testReports.patientId,
        patientName: patients.fullName,
        testType: testReports.testType,
        reportDate: testReports.reportDate,
        status: testReports.status,
      })
      .from(testReports)
      .leftJoin(patients, eq(testReports.patientId, patients.id))
      .where(
        search
          ? and(
              wherePatient ?? sql`1=1`,
              or(ilike(patients.fullName, `%${search}%`), ilike(patients.phone, `%${search}%`))
            )
          : wherePatient
            ? eq(testReports.patientId, patientId!)
            : undefined
      )
      .orderBy(desc(testReports.reportDate))
      .limit(100),
  ]);

  for (const row of apptRows) {
    const startTime = row.startTime instanceof Date ? row.startTime : new Date(row.startTime);
    const endTime = row.endTime instanceof Date ? row.endTime : new Date(row.endTime);
    events.push({
      id: row.id,
      type: "visit_created",
      patientId: row.patientId ?? "",
      patientName: row.patientName,
      userName: row.doctorName ?? null,
      userSpecialization: row.doctorSpecialization ?? null,
      timestamp: startTime,
      label: "Visit created",
      meta: {
        doctorId: row.doctorId ?? undefined,
        doctorSpecialization: row.doctorSpecialization ?? undefined,
        status: row.status,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });
  }
  for (const row of vitalsRows) {
    events.push({
      id: `vitals-${row.id}`,
      type: "vitals_recorded",
      patientId: row.patientId,
      patientName: row.patientName,
      userName: row.recordedByName,
      timestamp: row.recordedAt,
      label: "Vitals recorded",
    });
  }
  for (const row of notesRows) {
    events.push({
      id: `note-${row.id}`,
      type: "note_added",
      patientId: row.patientId,
      patientName: row.patientName,
      userName: row.authorName,
      timestamp: row.createdAt,
      label: "Clinical note added",
    });
  }
  for (const row of diagRows) {
    events.push({
      id: `diag-${row.id}`,
      type: "diagnosis_added",
      patientId: row.patientId,
      patientName: row.patientName,
      userName: null,
      timestamp: row.diagnosedAt,
      label: `Diagnosis: ${row.title}`,
      meta: { title: row.title },
    });
  }
  for (const row of attachRows) {
    events.push({
      id: `att-${row.id}`,
      type: "attachment_uploaded",
      patientId: row.patientId,
      patientName: row.patientName,
      userName: null,
      timestamp: row.createdAt,
      label: `Attachment: ${row.fileName}`,
      meta: { fileName: row.fileName },
    });
  }
  for (const row of prescriptionRows) {
    const issuedAt = row.issuedAt instanceof Date ? row.issuedAt : new Date(row.issuedAt);
    events.push({
      id: `rx-${row.id}`,
      type: "prescription_issued",
      patientId: row.patientId,
      patientName: row.patientName,
      userName: row.doctorName ?? null,
      timestamp: issuedAt,
      label: `Prescription: ${row.medication}`,
      meta: { medication: row.medication },
    });
  }
  for (const row of testReportRows) {
    const reportDate = new Date(row.reportDate);
    events.push({
      id: `tr-${row.id}`,
      type: "test_report_added",
      patientId: row.patientId,
      patientName: row.patientName,
      userName: null,
      timestamp: reportDate,
      label: `Test report: ${row.testType}`,
      meta: { testType: row.testType, status: row.status },
    });
  }

  events.sort(
    (a, b) =>
      (sortOrder === "desc" ? 1 : -1) * (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  );
  const totalCount = events.length;
  const offset = (page - 1) * pageSize;
  const list = events.slice(offset, offset + pageSize);

  return { list, totalCount };
}

