"use server";

import { db } from "@/lib/db";
import { odontograms, patients, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { z } from "zod";

const createOdontogramSchema = z.object({
  patientId: z.string().uuid("Patient is required"),
  examinedAt: z.string().optional().refine(
    (v) => !v || /^\d{4}-\d{2}-\d{2}/.test(v),
    "Invalid date format"
  ),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
});

export async function getOdontograms() {
    try {
        await requirePermission("odontogram.view");
    } catch (e) {
        if (e instanceof PermissionDeniedError) throw e;
        throw new Error("Unauthorized");
    }

    const results = await db
        .select({
            id: odontograms.id,
            patientId: odontograms.patientId,
            doctorId: odontograms.doctorId,
            status: odontograms.status,
            version: odontograms.version,
            examinedAt: odontograms.examinedAt,
            toothData: odontograms.toothData,
            diagnosis: odontograms.diagnosis,
            notes: odontograms.notes,
            treatments: odontograms.treatments,
            patientName: patients.fullName,
            doctorName: users.fullName,
            createdAt: odontograms.createdAt,
        })
        .from(odontograms)
        .leftJoin(patients, eq(odontograms.patientId, patients.id))
        .leftJoin(users, eq(odontograms.doctorId, users.id))
        .orderBy(desc(odontograms.examinedAt));

    return results;
}

export async function createOdontogram(data: z.infer<typeof createOdontogramSchema>) {
    await requirePermission("odontogram.create");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const parsed = createOdontogramSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error(parsed.error.flatten().formErrors[0] ?? "Invalid input");
    }

    const examinedAt = parsed.data.examinedAt
        ? new Date(parsed.data.examinedAt)
        : new Date();

    const [newOdontogram] = await db
        .insert(odontograms)
        .values({
            patientId: parsed.data.patientId,
            doctorId: user.id,
            examinedAt,
            notes: parsed.data.notes ?? null,
            diagnosis: parsed.data.diagnosis ?? null,
        })
        .returning();

    revalidatePath("/dashboard/odontograms");
    return newOdontogram;
}

export async function updateOdontogram(id: string, data: any) {
    try {
        await requirePermission("odontogram.edit");
    } catch (e) {
        if (e instanceof PermissionDeniedError) throw e;
        throw new Error("Unauthorized");
    }

    const [updated] = await db
        .update(odontograms)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(odontograms.id, id))
        .returning();

    revalidatePath("/dashboard/odontograms");
    return updated;
}

export async function deleteOdontogram(id: string) {
    try {
        await requirePermission("odontogram.edit");
    } catch (e) {
        if (e instanceof PermissionDeniedError) throw e;
        throw new Error("Unauthorized");
    }

    await db.delete(odontograms).where(eq(odontograms.id, id));
    revalidatePath("/dashboard/odontograms");
    return true;
}
