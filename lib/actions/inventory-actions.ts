"use server";

import { getCurrentUser } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { inventory, expenses } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  createInventorySchema,
  updateInventorySchema,
  type CreateInventoryInput,
  type UpdateInventoryInput,
} from "@/lib/validations/operations";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createInventoryItem(
  input: CreateInventoryInput
): Promise<ActionResult<typeof inventory.$inferSelect>> {
  try {
    await requirePermission("inventory.create");

    const validated = createInventorySchema.parse(input);
    const [result] = await db
      .insert(inventory)
      .values({
        name: validated.name,
        category: validated.category ?? null,
        description: validated.description ?? null,
        manufacturer: validated.manufacturer ?? null,
        batchNumber: validated.batchNumber ?? null,
        quantity: validated.stockQuantity,
        minStock: validated.reorderLevel,
        unit: validated.unit ?? "pcs",
        price: validated.costPerUnit ?? "0",
        expiryDate: validated.expiryDate ?? null,
        supplierId: validated.supplierId ?? null,
        status: validated.status,
        notes: validated.notes ?? null,
      })
      .returning();

    if (!result) {
      return { success: false, error: "Failed to create inventory item" };
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to add inventory items." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to create inventory item";
    return { success: false, error: message };
  }
}

export async function updateInventoryItem(
  input: UpdateInventoryInput
): Promise<ActionResult<typeof inventory.$inferSelect>> {
  try {
    await requirePermission("inventory.edit");
    const user = await getCurrentUser();

    const validated = updateInventorySchema.parse(input);
    const { itemId, recordAsExpense, ...rest } = validated;

    const [current] = await db
      .select({ quantity: inventory.quantity, price: inventory.price, name: inventory.name })
      .from(inventory)
      .where(eq(inventory.id, itemId));
    if (!current) {
      return { success: false, error: "Inventory item not found" };
    }

    const updateData: Partial<typeof inventory.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.category !== undefined) updateData.category = rest.category ?? null;
    if (rest.description !== undefined) updateData.description = rest.description ?? null;
    if (rest.manufacturer !== undefined) updateData.manufacturer = rest.manufacturer ?? null;
    if (rest.batchNumber !== undefined) updateData.batchNumber = rest.batchNumber ?? null;
    if (rest.stockQuantity !== undefined) updateData.quantity = rest.stockQuantity;
    if (rest.reorderLevel !== undefined) updateData.minStock = rest.reorderLevel;
    if (rest.unit !== undefined) updateData.unit = rest.unit ?? "pcs";
    if (rest.costPerUnit !== undefined) updateData.price = rest.costPerUnit ?? "0";
    if (rest.expiryDate !== undefined) updateData.expiryDate = rest.expiryDate ?? null;
    if (rest.supplierId !== undefined) updateData.supplierId = rest.supplierId ?? null;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.notes !== undefined) updateData.notes = rest.notes ?? null;

    const [updated] = await db
      .update(inventory)
      .set(updateData)
      .where(eq(inventory.id, itemId))
      .returning();

    if (!updated) {
      return { success: false, error: "Inventory item not found" };
    }

    const newQty = Number(updated.quantity ?? 0);
    const oldQty = Number(current.quantity ?? 0);
    const unitPrice = Number(updated.price ?? current.price ?? 0);
    if (recordAsExpense && newQty > oldQty && unitPrice > 0) {
      const delta = newQty - oldQty;
      const amount = (delta * unitPrice).toFixed(2);
      await db.insert(expenses).values({
        title: `Restock: ${updated.name ?? current.name}`,
        description: `Inventory restock: +${delta} units`,
        amount,
        category: "other",
        paymentMethod: "bank transfer",
        status: "pending",
        date: new Date(),
        notes: `Auto-recorded from inventory update (${itemId})`,
        inventoryItemId: itemId,
        submittedBy: user?.id ?? null,
      });
      revalidatePath("/dashboard/expenses");
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit inventory." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to update inventory item";
    return { success: false, error: message };
  }
}

export async function deleteInventoryItem(itemId: string): Promise<ActionResult<void>> {
  try {
    await requirePermission("inventory.delete");

    await db.delete(inventory).where(eq(inventory.id, itemId));

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete inventory." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to delete inventory item";
    return { success: false, error: message };
  }
}

export async function updateStockQuantity(
  itemId: string,
  quantity: number
): Promise<ActionResult<typeof inventory.$inferSelect>> {
  try {
    await requirePermission("inventory.edit");

    if (quantity < 0) {
      return { success: false, error: "Stock cannot be negative" };
    }

    const [updated] = await db
      .update(inventory)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(inventory.id, itemId))
      .returning();

    if (!updated) {
      return { success: false, error: "Inventory item not found" };
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit inventory." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to update stock";
    return { success: false, error: message };
  }
}

/** getInventoryItemsForPrescription – gated by inventory.view */
export async function getInventoryItemsForPrescription(): Promise<
  ActionResult<{ id: string; name: string; unit: string }[]>
> {
  try {
    await requirePermission("inventory.view");

    const rows = await db
      .select({ id: inventory.id, name: inventory.name, unit: inventory.unit })
      .from(inventory)
      .where(eq(inventory.status, "active"))
      .orderBy(asc(inventory.name));

    return {
      success: true,
      data: rows.map((r) => ({ id: r.id, name: r.name, unit: r.unit ?? "unit" })),
    };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view inventory." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to load inventory items";
    return { success: false, error: message };
  }
}

/** getInventoryById – gated by inventory.view */
export async function getInventoryById(itemId: string): Promise<
  ActionResult<(typeof inventory.$inferSelect) & { supplier: { id: string; name: string } | null } | null>
> {
  try {
    await requirePermission("inventory.view");

    const result = await db.query.inventory.findFirst({
      where: eq(inventory.id, itemId),
      with: { supplier: true },
    });

    return { success: true, data: result ?? null };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view inventory." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to load inventory item";
    return { success: false, error: message };
  }
}
