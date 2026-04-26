"use server";

import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { services, appointments, invoices } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceInput,
  type UpdateServiceInput,
} from "@/lib/validations/operations";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createService(
  input: CreateServiceInput
): Promise<ActionResult<typeof services.$inferSelect>> {
  try {
    await requirePermission("services.create");

    const validated = createServiceSchema.parse(input);
    const [result] = await db
      .insert(services)
      .values({
        name: validated.name,
        description: validated.description ?? null,
        departmentId: validated.departmentId ?? null,
        price: validated.price,
        duration: validated.duration,
        status: validated.status,
        category: validated.category ?? null,
        maxBookingsPerDay: validated.maxBookingsPerDay ?? null,
        followUpRequired: validated.followUpRequired ?? false,
        prerequisites: validated.prerequisites ?? null,
        specialInstructions: validated.specialInstructions ?? null,
      })
      .returning();

    if (!result) {
      return { success: false, error: "Failed to create service" };
    }

    revalidatePath("/dashboard/services");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create services." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to create service";
    return { success: false, error: message };
  }
}

export async function updateService(
  input: UpdateServiceInput
): Promise<ActionResult<typeof services.$inferSelect>> {
  try {
    await requirePermission("services.edit");

    const validated = updateServiceSchema.parse(input);
    const { serviceId, ...rest } = validated;

    const updateData: Partial<typeof services.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.description !== undefined) updateData.description = rest.description ?? null;
    if (rest.departmentId !== undefined) updateData.departmentId = rest.departmentId ?? null;
    if (rest.price !== undefined) updateData.price = rest.price;
    if (rest.duration !== undefined) updateData.duration = rest.duration;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.category !== undefined) updateData.category = rest.category ?? null;
    if (rest.maxBookingsPerDay !== undefined) updateData.maxBookingsPerDay = rest.maxBookingsPerDay ?? null;
    if (rest.followUpRequired !== undefined) updateData.followUpRequired = rest.followUpRequired;
    if (rest.prerequisites !== undefined) updateData.prerequisites = rest.prerequisites ?? null;
    if (rest.specialInstructions !== undefined) updateData.specialInstructions = rest.specialInstructions ?? null;

    const [updated] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, serviceId))
      .returning();

    if (!updated) {
      return { success: false, error: "Service not found" };
    }

    revalidatePath("/dashboard/services");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit services." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to update service";
    return { success: false, error: message };
  }
}

export async function deleteService(serviceId: string): Promise<ActionResult<void>> {
  try {
    await requirePermission("services.delete");

    const [appointmentCount] = await db
      .select({ value: count() })
      .from(appointments)
      .where(eq(appointments.serviceId, serviceId));
    if (Number(appointmentCount?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete: service is linked to appointments. Reassign or remove those appointments first.",
      };
    }

    const [invoiceCount] = await db
      .select({ value: count() })
      .from(invoices)
      .where(eq(invoices.serviceId, serviceId));
    if (Number(invoiceCount?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete: service is linked to invoices. Reassign or remove those invoices first.",
      };
    }

    await db.delete(services).where(eq(services.id, serviceId));

    revalidatePath("/dashboard/services");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete services." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to delete service";
    return { success: false, error: message };
  }
}

/** getServiceById – gated by services.view */
export async function getServiceById(serviceId: string): Promise<
  ActionResult<typeof services.$inferSelect & { department: { id: string; name: string } | null } | null>
> {
  try {
    await requirePermission("services.view");

    const result = await db.query.services.findFirst({
      where: eq(services.id, serviceId),
      with: { department: true },
    });

    return { success: true, data: result ?? null };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view services." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to load service";
    return { success: false, error: message };
  }
}

/** getServices – gated by services.view */
export async function getServices(): Promise<
  ActionResult<{ id: string; name: string; price: string; duration: number | null }[]>
> {
  try {
    await requirePermission("services.view");

    const result = await db
      .select({
        id: services.id,
        name: services.name,
        price: services.price,
        duration: services.duration,
      })
      .from(services)
      .where(eq(services.status, "active"))
      .orderBy(services.name);

    return {
      success: true,
      data: result.map((r) => ({
        id: r.id,
        name: r.name,
        price: String(r.price),
        duration: r.duration ?? 0,
      })),
    };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view services." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to load services";
    return { success: false, error: message };
  }
}
