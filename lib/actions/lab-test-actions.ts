"use server";

import { getCurrentUser } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import {
  testCategories,
  testMethodologies,
  turnaroundTimes,
  sampleTypes,
  laboratoryTests,
  testReports,
  labVendors,
  users,
} from "@/lib/db/schema";
import { eq, ilike, or, and, count, asc, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Test Categories ─────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  departmentId: z.string().uuid().optional().nullable(),
  icon: z.string().optional().nullable(),
});

const updateCategorySchema = createCategorySchema.extend({
  id: z.string().uuid(),
});

export async function createTestCategory(
  input: z.infer<typeof createCategorySchema>
): Promise<ActionResult<typeof testCategories.$inferSelect>> {
  try {
    await requirePermission("test_reports.create");
    const parsed = createCategorySchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.insert(testCategories).values({
      name: parsed.data.name,
      departmentId: parsed.data.departmentId ?? null,
      icon: parsed.data.icon ?? null,
    }).returning();

    if (!row) return { success: false, error: "Failed to create" };
    revalidatePath("/dashboard/test-reports/categories");
    return { success: true, data: row };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to manage test reports." };
    }
    return { success: false, error: e instanceof Error ? e.message : "Failed to create" };
  }
}

export async function updateTestCategory(input: z.infer<typeof updateCategorySchema>): Promise<ActionResult<typeof testCategories.$inferSelect>> {
  try {
    await requirePermission("test_reports.edit");
    const parsed = updateCategorySchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.update(testCategories).set({
      name: parsed.data.name,
      departmentId: parsed.data.departmentId ?? null,
      icon: parsed.data.icon ?? null,
      updatedAt: new Date(),
    }).where(eq(testCategories.id, parsed.data.id)).returning();

    if (!row) return { success: false, error: "Not found" };
    revalidatePath("/dashboard/test-reports/categories");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

function toFriendlyFkError(msg: string, entity: string): string {
  if (msg.includes("violates foreign key") || msg.includes("foreign key constraint")) {
    return `Cannot delete: this ${entity} is used by lab tests or other records. Remove or reassign those first.`;
  }
  return msg;
}

export async function deleteTestCategory(id: string): Promise<ActionResult> {
  try {
    await requirePermission("test_reports.delete");

    await db.update(laboratoryTests).set({ categoryId: null, updatedAt: new Date() }).where(eq(laboratoryTests.categoryId, id));
    await db.update(testMethodologies).set({ categoryId: null, updatedAt: new Date() }).where(eq(testMethodologies.categoryId, id));
    await db.update(turnaroundTimes).set({ categoryId: null, updatedAt: new Date() }).where(eq(turnaroundTimes.categoryId, id));
    await db.update(sampleTypes).set({ categoryId: null, updatedAt: new Date() }).where(eq(sampleTypes.categoryId, id));

    await db.delete(testCategories).where(eq(testCategories.id, id));
    revalidatePath("/dashboard/test-reports/categories");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete test reports." };
    }
    const msg = e instanceof Error ? e.message : "Failed to delete";
    return { success: false, error: toFriendlyFkError(msg, "category") };
  }
}

// ─── Test Methodologies ──────────────────────────────────────────────────────

const createMethodologySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  categoryId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  principles: z.string().min(1, "Principles are required"),
  equipment: z.string().optional().nullable(),
  applications: z.string().optional().nullable(),
  advantages: z.string().optional().nullable(),
  limitations: z.string().optional().nullable(),
  sampleVolume: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateMethodologySchema = createMethodologySchema.extend({ id: z.string().uuid() });

export async function createTestMethodology(
  input: z.infer<typeof createMethodologySchema>
): Promise<ActionResult<typeof testMethodologies.$inferSelect>> {
  try {
    await requirePermission("test_reports.create");
    const parsed = createMethodologySchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.insert(testMethodologies).values({
      name: parsed.data.name,
      code: parsed.data.code,
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      principles: parsed.data.principles ?? null,
      equipment: parsed.data.equipment ?? null,
      applications: parsed.data.applications ?? null,
      advantages: parsed.data.advantages ?? null,
      limitations: parsed.data.limitations ?? null,
      sampleVolume: parsed.data.sampleVolume ?? null,
      isActive: parsed.data.isActive ? 1 : 0,
    }).returning();

    if (!row) return { success: false, error: "Failed to create" };
    revalidatePath("/dashboard/test-reports/methodologies");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create" };
  }
}

export async function updateTestMethodology(input: z.infer<typeof updateMethodologySchema>): Promise<ActionResult<typeof testMethodologies.$inferSelect>> {
  try {
    await requirePermission("test_reports.edit");
    const parsed = updateMethodologySchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.update(testMethodologies).set({
      name: parsed.data.name,
      code: parsed.data.code,
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      principles: parsed.data.principles ?? null,
      equipment: parsed.data.equipment ?? null,
      applications: parsed.data.applications ?? null,
      advantages: parsed.data.advantages ?? null,
      limitations: parsed.data.limitations ?? null,
      sampleVolume: parsed.data.sampleVolume ?? null,
      isActive: parsed.data.isActive ? 1 : 0,
      updatedAt: new Date(),
    }).where(eq(testMethodologies.id, parsed.data.id)).returning();

    if (!row) return { success: false, error: "Not found" };
    revalidatePath("/dashboard/test-reports/methodologies");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

export async function deleteTestMethodology(id: string): Promise<ActionResult> {
  try {
    await requirePermission("test_reports.delete");

    await db.update(laboratoryTests).set({ methodologyId: null, updatedAt: new Date() }).where(eq(laboratoryTests.methodologyId, id));

    await db.delete(testMethodologies).where(eq(testMethodologies.id, id));
    revalidatePath("/dashboard/test-reports/methodologies");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete test reports." };
    }
    const msg = e instanceof Error ? e.message : "Failed to delete";
    return { success: false, error: toFriendlyFkError(msg, "methodology") };
  }
}

// ─── Turnaround Times ────────────────────────────────────────────────────────

const createTurnaroundSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  priority: z.string().min(1, "Priority is required"),
  categoryId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  duration: z.string().min(1, "Duration is required"),
  durationDisplay: z.string().min(1, "Duration display is required"),
  durationMinutes: z.coerce.number().int().min(0, "Duration minutes is required"),
  slaCommitment: z.string().optional().nullable(),
  reportingHours: z.string().optional().nullable(),
  testExamples: z.string().optional().nullable(),
  businessRules: z.string().optional().nullable(),
  criticalNotes: z.string().optional().nullable(),
  escalationProcedure: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateTurnaroundSchema = createTurnaroundSchema.extend({ id: z.string().uuid() });

export async function createTurnaroundTime(
  input: z.infer<typeof createTurnaroundSchema>
): Promise<ActionResult<typeof turnaroundTimes.$inferSelect>> {
  try {
    await requirePermission("test_reports.create");
    const parsed = createTurnaroundSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.insert(turnaroundTimes).values({
      name: parsed.data.name,
      code: parsed.data.code,
      priority: parsed.data.priority,
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      duration: parsed.data.duration,
      durationDisplay: parsed.data.durationDisplay ?? null,
      durationMinutes: parsed.data.durationMinutes ?? null,
      slaCommitment: parsed.data.slaCommitment ?? null,
      reportingHours: parsed.data.reportingHours ?? null,
      testExamples: parsed.data.testExamples ?? null,
      businessRules: parsed.data.businessRules ?? null,
      criticalNotes: parsed.data.criticalNotes ?? null,
      escalationProcedure: parsed.data.escalationProcedure ?? null,
      isActive: parsed.data.isActive ? 1 : 0,
    }).returning();

    if (!row) return { success: false, error: "Failed to create" };
    revalidatePath("/dashboard/test-reports/turnaround-times");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create" };
  }
}

export async function updateTurnaroundTime(input: z.infer<typeof updateTurnaroundSchema>): Promise<ActionResult<typeof turnaroundTimes.$inferSelect>> {
  try {
    await requirePermission("test_reports.edit");
    const parsed = updateTurnaroundSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.update(turnaroundTimes).set({
      name: parsed.data.name,
      code: parsed.data.code,
      priority: parsed.data.priority,
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      duration: parsed.data.duration,
      durationDisplay: parsed.data.durationDisplay ?? null,
      durationMinutes: parsed.data.durationMinutes ?? null,
      slaCommitment: parsed.data.slaCommitment ?? null,
      reportingHours: parsed.data.reportingHours ?? null,
      testExamples: parsed.data.testExamples ?? null,
      businessRules: parsed.data.businessRules ?? null,
      criticalNotes: parsed.data.criticalNotes ?? null,
      escalationProcedure: parsed.data.escalationProcedure ?? null,
      isActive: parsed.data.isActive ? 1 : 0,
      updatedAt: new Date(),
    }).where(eq(turnaroundTimes.id, parsed.data.id)).returning();

    if (!row) return { success: false, error: "Not found" };
    revalidatePath("/dashboard/test-reports/turnaround-times");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

export async function deleteTurnaroundTime(id: string): Promise<ActionResult> {
  try {
    await requirePermission("test_reports.delete");

    await db.update(laboratoryTests).set({ turnaroundTimeId: null, updatedAt: new Date() }).where(eq(laboratoryTests.turnaroundTimeId, id));

    await db.delete(turnaroundTimes).where(eq(turnaroundTimes.id, id));
    revalidatePath("/dashboard/test-reports/turnaround-times");
    return { success: true, data: undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete";
    return { success: false, error: toFriendlyFkError(msg, "turnaround time") };
  }
}

// ─── Sample Types ────────────────────────────────────────────────────────────

const createSampleTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  categoryId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  collectionMethod: z.string().min(1, "Collection method is required"),
  volumeRequired: z.string().optional().nullable(),
  containerType: z.string().optional().nullable(),
  preservativeAnticoagulant: z.string().optional().nullable(),
  specialCollectionInstructions: z.string().optional().nullable(),
  storageTemperature: z.string().optional().nullable(),
  storageTimeStability: z.string().optional().nullable(),
  processingTime: z.string().optional().nullable(),
  transportConditions: z.string().optional().nullable(),
  handlingRequirements: z.string().optional().nullable(),
  rejectionCriteria: z.string().optional().nullable(),
  safetyPrecautions: z.string().optional().nullable(),
  commonTests: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateSampleTypeSchema = createSampleTypeSchema.extend({ id: z.string().uuid() });

export async function createSampleType(
  input: z.infer<typeof createSampleTypeSchema>
): Promise<ActionResult<typeof sampleTypes.$inferSelect>> {
  try {
    await requirePermission("test_reports.create");
    const parsed = createSampleTypeSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.insert(sampleTypes).values({
      name: parsed.data.name,
      code: parsed.data.code,
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      collectionMethod: parsed.data.collectionMethod ?? null,
      volumeRequired: parsed.data.volumeRequired ?? null,
      containerType: parsed.data.containerType ?? null,
      preservativeAnticoagulant: parsed.data.preservativeAnticoagulant ?? null,
      specialCollectionInstructions: parsed.data.specialCollectionInstructions ?? null,
      storageTemperature: parsed.data.storageTemperature ?? null,
      storageTimeStability: parsed.data.storageTimeStability ?? null,
      processingTime: parsed.data.processingTime ?? null,
      transportConditions: parsed.data.transportConditions ?? null,
      handlingRequirements: parsed.data.handlingRequirements ?? null,
      rejectionCriteria: parsed.data.rejectionCriteria ?? null,
      safetyPrecautions: parsed.data.safetyPrecautions ?? null,
      commonTests: parsed.data.commonTests ?? null,
      isActive: parsed.data.isActive ? 1 : 0,
    }).returning();

    if (!row) return { success: false, error: "Failed to create" };
    revalidatePath("/dashboard/test-reports/sample-types");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create" };
  }
}

export async function updateSampleType(input: z.infer<typeof updateSampleTypeSchema>): Promise<ActionResult<typeof sampleTypes.$inferSelect>> {
  try {
    await requirePermission("test_reports.edit");
    const parsed = updateSampleTypeSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.update(sampleTypes).set({
      name: parsed.data.name,
      code: parsed.data.code,
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      collectionMethod: parsed.data.collectionMethod ?? null,
      volumeRequired: parsed.data.volumeRequired ?? null,
      containerType: parsed.data.containerType ?? null,
      preservativeAnticoagulant: parsed.data.preservativeAnticoagulant ?? null,
      specialCollectionInstructions: parsed.data.specialCollectionInstructions ?? null,
      storageTemperature: parsed.data.storageTemperature ?? null,
      storageTimeStability: parsed.data.storageTimeStability ?? null,
      processingTime: parsed.data.processingTime ?? null,
      transportConditions: parsed.data.transportConditions ?? null,
      handlingRequirements: parsed.data.handlingRequirements ?? null,
      rejectionCriteria: parsed.data.rejectionCriteria ?? null,
      safetyPrecautions: parsed.data.safetyPrecautions ?? null,
      commonTests: parsed.data.commonTests ?? null,
      isActive: parsed.data.isActive ? 1 : 0,
      updatedAt: new Date(),
    }).where(eq(sampleTypes.id, parsed.data.id)).returning();

    if (!row) return { success: false, error: "Not found" };
    revalidatePath("/dashboard/test-reports/sample-types");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

export async function deleteSampleType(id: string): Promise<ActionResult> {
  try {
    await requirePermission("test_reports.delete");

    await db.update(laboratoryTests).set({ sampleTypeId: null, updatedAt: new Date() }).where(eq(laboratoryTests.sampleTypeId, id));

    await db.delete(sampleTypes).where(eq(sampleTypes.id, id));
    revalidatePath("/dashboard/test-reports/sample-types");
    return { success: true, data: undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete";
    return { success: false, error: toFriendlyFkError(msg, "sample type") };
  }
}

// ─── Laboratory Tests ────────────────────────────────────────────────────────

const createLabTestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  testCode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  sampleTypeId: z.string().uuid().optional().nullable(),
  methodologyId: z.string().uuid().optional().nullable(),
  turnaroundTimeId: z.string().uuid().optional().nullable(),
  normalRange: z.string().optional().nullable(),
  units: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
});

const updateLabTestSchema = createLabTestSchema.extend({ id: z.string().uuid() });

export async function createLaboratoryTest(
  input: z.infer<typeof createLabTestSchema>
): Promise<ActionResult<typeof laboratoryTests.$inferSelect>> {
  try {
    await requirePermission("test_reports.create");
    const parsed = createLabTestSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.insert(laboratoryTests).values({
      name: parsed.data.name,
      testCode: parsed.data.testCode ?? null,
      description: parsed.data.description ?? null,
      categoryId: parsed.data.categoryId ?? null,
      sampleTypeId: parsed.data.sampleTypeId ?? null,
      methodologyId: parsed.data.methodologyId ?? null,
      turnaroundTimeId: parsed.data.turnaroundTimeId ?? null,
      normalRange: parsed.data.normalRange ?? null,
      units: parsed.data.units ?? null,
      price: parsed.data.price ?? null,
    }).returning();

    if (!row) return { success: false, error: "Failed to create" };
    revalidatePath("/dashboard/test-reports/tests");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create" };
  }
}

export async function updateLaboratoryTest(input: z.infer<typeof updateLabTestSchema>): Promise<ActionResult<typeof laboratoryTests.$inferSelect>> {
  try {
    await requirePermission("test_reports.edit");
    const parsed = updateLabTestSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.update(laboratoryTests).set({
      name: parsed.data.name,
      testCode: parsed.data.testCode ?? null,
      description: parsed.data.description ?? null,
      categoryId: parsed.data.categoryId ?? null,
      sampleTypeId: parsed.data.sampleTypeId ?? null,
      methodologyId: parsed.data.methodologyId ?? null,
      turnaroundTimeId: parsed.data.turnaroundTimeId ?? null,
      normalRange: parsed.data.normalRange ?? null,
      units: parsed.data.units ?? null,
      price: parsed.data.price ?? null,
      updatedAt: new Date(),
    }).where(eq(laboratoryTests.id, parsed.data.id)).returning();

    if (!row) return { success: false, error: "Not found" };
    revalidatePath("/dashboard/test-reports/tests");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

export async function deleteLaboratoryTest(id: string): Promise<ActionResult> {
  try {
    await requirePermission("test_reports.delete");
    await db.delete(laboratoryTests).where(eq(laboratoryTests.id, id));
    revalidatePath("/dashboard/test-reports/tests");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

// ─── Fetch lists for dropdowns ───────────────────────────────────────────────

export async function getTestCategories(): Promise<{ id: string; name: string }[]> {
  try {
    await requirePermission("test_reports.view");
  } catch {
    return [];
  }
  return db.select({ id: testCategories.id, name: testCategories.name }).from(testCategories).orderBy(testCategories.name);
}

export async function getTestMethodologies(): Promise<{ id: string; name: string }[]> {
  try {
    await requirePermission("test_reports.view");
  } catch {
    return [];
  }
  return db.select({ id: testMethodologies.id, name: testMethodologies.name }).from(testMethodologies).orderBy(testMethodologies.name);
}

export async function getTurnaroundTimes(): Promise<{ id: string; name: string }[]> {
  try {
    await requirePermission("test_reports.view");
  } catch {
    return [];
  }
  return db.select({ id: turnaroundTimes.id, name: turnaroundTimes.name }).from(turnaroundTimes).orderBy(turnaroundTimes.name);
}

export async function getSampleTypes(): Promise<{ id: string; name: string }[]> {
  try {
    await requirePermission("test_reports.view");
  } catch {
    return [];
  }
  return db.select({ id: sampleTypes.id, name: sampleTypes.name }).from(sampleTypes).orderBy(sampleTypes.name);
}

// ─── Bulk delete (for multi-select) ──────────────────────────────────────────

export async function bulkDeleteTestCategories(ids: string[]): Promise<ActionResult> {
  for (const id of ids) {
    const result = await deleteTestCategory(id);
    if (!result.success) return result;
  }
  return { success: true, data: undefined };
}

export async function bulkDeleteTestMethodologies(ids: string[]): Promise<ActionResult> {
  for (const id of ids) {
    const result = await deleteTestMethodology(id);
    if (!result.success) return result;
  }
  return { success: true, data: undefined };
}

export async function bulkDeleteTurnaroundTimes(ids: string[]): Promise<ActionResult> {
  for (const id of ids) {
    const result = await deleteTurnaroundTime(id);
    if (!result.success) return result;
  }
  return { success: true, data: undefined };
}

export async function bulkDeleteSampleTypes(ids: string[]): Promise<ActionResult> {
  for (const id of ids) {
    const result = await deleteSampleType(id);
    if (!result.success) return result;
  }
  return { success: true, data: undefined };
}

export async function bulkDeleteLaboratoryTests(ids: string[]): Promise<ActionResult> {
  try {
    await requirePermission("test_reports.delete");
    for (const id of ids) {
      await db.delete(laboratoryTests).where(eq(laboratoryTests.id, id));
    }
    revalidatePath("/dashboard/test-reports/tests");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

// ─── Test Reports (main list) ─────────────────────────────────────────────────

export async function deleteTestReport(id: string): Promise<ActionResult> {
  try {
    await requirePermission("test_reports.delete");
    await db.delete(testReports).where(eq(testReports.id, id));
    revalidatePath("/dashboard/test-reports");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

export async function bulkDeleteTestReports(ids: string[]): Promise<ActionResult> {
  try {
    await requirePermission("test_reports.delete");
    for (const id of ids) {
      await db.delete(testReports).where(eq(testReports.id, id));
    }
    revalidatePath("/dashboard/test-reports");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

// ─── Create / Update Test Report ───────────────────────────────────────────────

const createTestReportSchema = z.object({
  patientId: z.string().uuid(),
  testId: z.string().uuid(),
  testType: z.string().min(1),
  labVendorId: z.string().uuid().optional().nullable(),
  reportDate: z.string().min(1),
  doctorId: z.string().uuid(),
  results: z.string().optional().nullable(),
  referenceValues: z.string().optional().nullable(),
  clinicalInterpretation: z.string().optional().nullable(),
  abnormalFindings: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachments: z.array(z.string()).optional().nullable(),
});

const updateTestReportSchema = createTestReportSchema.extend({
  id: z.string().uuid(),
});

export async function getTestReportById(id: string): Promise<ActionResult<typeof testReports.$inferSelect>> {
  try {
    await requirePermission("test_reports.view");
    const [row] = await db.select().from(testReports).where(eq(testReports.id, id)).limit(1);
    if (!row) return { success: false, error: "Test report not found" };
    return { success: true, data: row };
  } catch (e) {
    if (e instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view test reports." };
    }
    return { success: false, error: e instanceof Error ? e.message : "Failed to load test report" };
  }
}

export async function createTestReport(input: z.infer<typeof createTestReportSchema>): Promise<ActionResult<typeof testReports.$inferSelect>> {
  try {
    await requirePermission("test_reports.create");
    const parsed = createTestReportSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db.insert(testReports).values({
      patientId: parsed.data.patientId,
      testId: parsed.data.testId,
      testType: parsed.data.testType,
      labVendorId: parsed.data.labVendorId ?? null,
      reportDate: parsed.data.reportDate,
      doctorId: parsed.data.doctorId,
      results: parsed.data.results ?? "",
      referenceValues: parsed.data.referenceValues ?? null,
      clinicalInterpretation: parsed.data.clinicalInterpretation ?? null,
      abnormalFindings: parsed.data.abnormalFindings ?? null,
      recommendations: parsed.data.recommendations ?? null,
      notes: parsed.data.notes ?? null,
      attachments: parsed.data.attachments ?? [],
      status: "recorded",
    }).returning();

    if (!row) return { success: false, error: "Failed to create" };
    revalidatePath("/dashboard/test-reports");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create test report" };
  }
}

export async function updateTestReport(input: z.infer<typeof updateTestReportSchema>): Promise<ActionResult<typeof testReports.$inferSelect>> {
  try {
    await requirePermission("test_reports.edit");
    const parsed = updateTestReportSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

    const [row] = await db
      .update(testReports)
      .set({
        patientId: parsed.data.patientId,
        testId: parsed.data.testId,
        testType: parsed.data.testType,
        labVendorId: parsed.data.labVendorId ?? null,
        reportDate: parsed.data.reportDate,
        doctorId: parsed.data.doctorId,
        results: parsed.data.results ?? "",
        referenceValues: parsed.data.referenceValues ?? null,
        clinicalInterpretation: parsed.data.clinicalInterpretation ?? null,
        abnormalFindings: parsed.data.abnormalFindings ?? null,
        recommendations: parsed.data.recommendations ?? null,
        notes: parsed.data.notes ?? null,
        attachments: parsed.data.attachments ?? [],
        updatedAt: new Date(),
      })
      .where(eq(testReports.id, parsed.data.id))
      .returning();

    if (!row) return { success: false, error: "Test report not found" };
    revalidatePath("/dashboard/test-reports");
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update test report" };
  }
}

export async function getLabVendorsForDropdown(): Promise<{ id: string; name: string | null }[]> {
  try {
    await requirePermission("test_reports.view");
  } catch {
    return [];
  }
  return db.select({ id: labVendors.id, name: labVendors.name }).from(labVendors).orderBy(labVendors.name);
}

export async function getStaffForRecordedBy(): Promise<{ id: string; fullName: string | null }[]> {
  try {
    await requirePermission("test_reports.view");
  } catch {
    return [];
  }
  return db
    .select({ id: users.id, fullName: users.fullName })
    .from(users)
    .where(inArray(users.role, ["doctor", "nurse", "receptionist"]))
    .orderBy(users.fullName);
}

export async function getLaboratoryTestsForDropdown(): Promise<{ id: string; name: string }[]> {
  try {
    await requirePermission("test_reports.view");
  } catch {
    return [];
  }
  return db.select({ id: laboratoryTests.id, name: laboratoryTests.name }).from(laboratoryTests).where(eq(laboratoryTests.isActive, 1)).orderBy(laboratoryTests.name);
}

const TEST_REPORT_ATTACHMENTS_BUCKET = "test-report-attachments";
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

export async function uploadTestReportAttachment(
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    await requirePermission("test_reports.create");
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) return { success: false, error: "No file provided" };
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) return { success: false, error: "File must be under 10MB" };
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type))
      return { success: false, error: "Use PDF, JPG, PNG, or DOC/DOCX" };

    const supabase = getSupabaseAdmin();
    if (!supabase) return { success: false, error: "Storage not configured" };

    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `uploads/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(TEST_REPORT_ATTACHMENTS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: urlData } = supabase.storage
      .from(TEST_REPORT_ATTACHMENTS_BUCKET)
      .getPublicUrl(path);
    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Upload failed" };
  }
}
