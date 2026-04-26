"use server";

import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { expenses, departments, labVendors, inventory, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createExpenseSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  amount: z.number().min(0, "Amount must be positive"),
  category: z.enum(["utilities", "equipment", "maintenance", "staff", "other", "insurance"]),
  paymentMethod: z.enum(["cash", "card", "check", "bank transfer"]),
  status: z.enum(["pending", "paid", "cancelled"]).default("pending"),
  date: z.string(),
  vendor: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  vendorId: z.string().uuid().optional().nullable(),
  inventoryItemId: z.string().uuid().optional().nullable(),
});

const updateExpenseSchema = createExpenseSchema.extend({
  id: z.string().uuid(),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createExpense(
  input: z.infer<typeof createExpenseSchema>
): Promise<ActionResult<typeof expenses.$inferSelect>> {
  try {
    await requirePermission("billing.edit");
    const { getCurrentUser } = await import("@/lib/auth");
    const user = await getCurrentUser();

    const parsed = createExpenseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors[0] ?? "Invalid input",
      };
    }

    const d = new Date(parsed.data.date);
    if (Number.isNaN(d.getTime())) {
      return { success: false, error: "Invalid date" };
    }

    const [created] = await db
      .insert(expenses)
      .values({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        amount: parsed.data.amount.toFixed(2),
        category: parsed.data.category,
        paymentMethod: parsed.data.paymentMethod,
        status: parsed.data.status,
        date: d,
        vendor: parsed.data.vendor ?? null,
        receiptUrl: parsed.data.receiptUrl ?? null,
        notes: parsed.data.notes ?? null,
        departmentId: parsed.data.departmentId ?? null,
        submittedBy: user?.id ?? null,
        vendorId: parsed.data.vendorId ?? null,
        inventoryItemId: parsed.data.inventoryItemId ?? null,
      })
      .returning();

    revalidatePath("/dashboard/expenses");
    return { success: true, data: created! };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create expenses." };
    }
    const message = err instanceof Error ? err.message : "Failed to create expense";
    return { success: false, error: message };
  }
}

export async function updateExpense(
  input: z.infer<typeof updateExpenseSchema>
): Promise<ActionResult<typeof expenses.$inferSelect>> {
  try {
    await requirePermission("billing.edit");

    const parsed = updateExpenseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors[0] ?? "Invalid input",
      };
    }

    const d = new Date(parsed.data.date);
    if (Number.isNaN(d.getTime())) {
      return { success: false, error: "Invalid date" };
    }

    const [updated] = await db
      .update(expenses)
      .set({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        amount: parsed.data.amount.toFixed(2),
        category: parsed.data.category,
        paymentMethod: parsed.data.paymentMethod,
        status: parsed.data.status,
        date: d,
        vendor: parsed.data.vendor ?? null,
        receiptUrl: parsed.data.receiptUrl ?? null,
        notes: parsed.data.notes ?? null,
        departmentId: parsed.data.departmentId ?? null,
        vendorId: parsed.data.vendorId ?? null,
        inventoryItemId: parsed.data.inventoryItemId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, parsed.data.id))
      .returning();

    if (!updated) return { success: false, error: "Expense not found" };
    revalidatePath("/dashboard/expenses");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit expenses." };
    }
    const message = err instanceof Error ? err.message : "Failed to update expense";
    return { success: false, error: message };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult<void>> {
  try {
    await requirePermission("billing.edit");

    await db.delete(expenses).where(eq(expenses.id, id));
    revalidatePath("/dashboard/expenses");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete expenses." };
    }
    const message = err instanceof Error ? err.message : "Failed to delete expense";
    return { success: false, error: message };
  }
}

export async function getExpense(id: string): Promise<ActionResult<typeof expenses.$inferSelect | null>> {
  try {
    await requirePermission("billing.view");

    const [row] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return { success: true, data: row ?? null };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view expenses." };
    }
    const message = err instanceof Error ? err.message : "Failed to load expense";
    return { success: false, error: message };
  }
}

/** getDepartmentsForExpense – gated by billing.view */
export async function getDepartmentsForExpense(): Promise<{ id: string; name: string }[]> {
  await requirePermission("billing.view");

  const rows = await db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(eq(departments.status, "active"))
    .orderBy(asc(departments.name));
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

/** getLabVendorsForExpense – gated by billing.view */
export async function getLabVendorsForExpense(): Promise<{ id: string; name: string }[]> {
  await requirePermission("billing.view");

  const rows = await db
    .select({ id: labVendors.id, name: labVendors.name })
    .from(labVendors)
    .where(eq(labVendors.status, "active"))
    .orderBy(asc(labVendors.name));
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

/** getInventoryForExpense – gated by billing.view */
export async function getInventoryForExpense(): Promise<{ id: string; name: string }[]> {
  await requirePermission("billing.view");

  const rows = await db
    .select({ id: inventory.id, name: inventory.name })
    .from(inventory)
    .where(eq(inventory.status, "active"))
    .orderBy(asc(inventory.name));
  return rows.map((r) => ({ id: r.id, name: r.name }));
}
