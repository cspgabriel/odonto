"use server";

import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { prescriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { success: false; error: string };

export async function createPrescription(data: {
    patientId: string;
    doctorId: string;
    medication: string;
    dosage: string;
    inventoryItemId?: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
    drugInteractions: string | null;
    pharmacyName: string | null;
    pharmacyAddress: string | null;
}): Promise<ActionResult> {
    try {
        await requirePermission("prescriptions.create");

        await db.insert(prescriptions).values({
            patientId: data.patientId,
            doctorId: data.doctorId,
            medication: data.medication,
            dosage: data.dosage,
            inventoryItemId: data.inventoryItemId ?? null,
            frequency: data.frequency ?? null,
            duration: data.duration ?? null,
            instructions: data.instructions ?? null,
            drugInteractions: data.drugInteractions ?? null,
            pharmacyName: data.pharmacyName ?? null,
            pharmacyAddress: data.pharmacyAddress ?? null,
            issuedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        revalidatePath("/dashboard/prescriptions");
        return { success: true };
    } catch (e) {
        if (e instanceof PermissionDeniedError) {
            return { success: false, error: "You don't have permission to create prescriptions." };
        }
        return { success: false, error: e instanceof Error ? e.message : "Failed to create prescription" };
    }
}

export async function updatePrescription(
    id: string,
    data: {
        patientId: string;
        doctorId: string;
        medication: string;
        dosage: string;
        inventoryItemId?: string | null;
        frequency: string | null;
        duration: string | null;
        instructions: string | null;
        drugInteractions: string | null;
        pharmacyName: string | null;
        pharmacyAddress: string | null;
    }
): Promise<ActionResult> {
    try {
        await requirePermission("prescriptions.edit");

        await db
            .update(prescriptions)
            .set({
                patientId: data.patientId,
                doctorId: data.doctorId,
                medication: data.medication,
                dosage: data.dosage,
                inventoryItemId: data.inventoryItemId ?? null,
                frequency: data.frequency ?? null,
                duration: data.duration ?? null,
                instructions: data.instructions ?? null,
                drugInteractions: data.drugInteractions ?? null,
                pharmacyName: data.pharmacyName ?? null,
                pharmacyAddress: data.pharmacyAddress ?? null,
                updatedAt: new Date(),
            })
            .where(eq(prescriptions.id, id));
        revalidatePath("/dashboard/prescriptions");
        return { success: true };
    } catch (e) {
        if (e instanceof PermissionDeniedError) {
            return { success: false, error: "You don't have permission to edit prescriptions." };
        }
        return { success: false, error: e instanceof Error ? e.message : "Failed to update prescription" };
    }
}

export async function deletePrescription(id: string): Promise<ActionResult> {
    try {
        await requirePermission("prescriptions.delete");

        await db.delete(prescriptions).where(eq(prescriptions.id, id));
        revalidatePath("/dashboard/prescriptions");
        return { success: true };
    } catch (e) {
        if (e instanceof PermissionDeniedError) {
            return { success: false, error: "You don't have permission to delete prescriptions." };
        }
        return { success: false, error: e instanceof Error ? e.message : "Failed to delete prescription" };
    }
}
