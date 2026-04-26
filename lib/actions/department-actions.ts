"use server";

import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { departments, services, staff, patients, users, invoices, expenses } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
} from "@/lib/validations/operations";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createDepartment(
  input: CreateDepartmentInput
): Promise<ActionResult<typeof departments.$inferSelect>> {
  try {
    await requirePermission("departments.create");

    const validated = createDepartmentSchema.parse(input);
    const [result] = await db
      .insert(departments)
      .values({
        name: validated.name,
        description: validated.description ?? null,
        headOfDepartment: validated.headOfDepartment ?? null,
        status: validated.status,
        code: validated.code ?? null,
        location: validated.location ?? null,
        phone: validated.phone ?? null,
        email: validated.email && validated.email !== "" ? validated.email : null,
        annualBudget: validated.annualBudget ?? null,
      })
      .returning();

    if (!result) {
      return { success: false, error: "Failed to create department" };
    }

    revalidatePath("/dashboard/departments");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to create departments." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to create department";
    return { success: false, error: message };
  }
}

export async function updateDepartment(
  input: UpdateDepartmentInput
): Promise<ActionResult<typeof departments.$inferSelect>> {
  try {
    await requirePermission("departments.edit");

    const validated = updateDepartmentSchema.parse(input);
    const { departmentId, ...rest } = validated;

    const updateData: Partial<typeof departments.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.description !== undefined) updateData.description = rest.description ?? null;
    if (rest.headOfDepartment !== undefined) updateData.headOfDepartment = rest.headOfDepartment ?? null;
    if (rest.status !== undefined) updateData.status = rest.status;
    if ("location" in rest && rest.location !== undefined) updateData.location = rest.location ?? null;
    if ("budget" in rest && rest.budget !== undefined) updateData.budget = rest.budget ?? null;
    if ("code" in rest && rest.code !== undefined) updateData.code = rest.code ?? null;
    if ("phone" in rest && rest.phone !== undefined) updateData.phone = rest.phone ?? null;
    if ("email" in rest && rest.email !== undefined) updateData.email = rest.email && rest.email !== "" ? rest.email : null;
    if ("annualBudget" in rest && rest.annualBudget !== undefined) updateData.annualBudget = rest.annualBudget ?? null;

    const [updated] = await db
      .update(departments)
      .set(updateData)
      .where(eq(departments.id, departmentId))
      .returning();

    if (!updated) {
      return { success: false, error: "Department not found" };
    }

    revalidatePath("/dashboard/departments");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit departments." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to update department";
    return { success: false, error: message };
  }
}

export async function deleteDepartment(departmentId: string): Promise<ActionResult<void>> {
  try {
    await requirePermission("departments.delete");

    const [staffCount] = await db
      .select({ value: count() })
      .from(staff)
      .where(eq(staff.departmentId, departmentId));
    if (Number(staffCount?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete: department has staff members. Reassign or remove them first.",
      };
    }

    const [serviceCount] = await db
      .select({ value: count() })
      .from(services)
      .where(eq(services.departmentId, departmentId));
    if (Number(serviceCount?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete: department has services. Reassign or remove them first.",
      };
    }

    const [patientCount] = await db
      .select({ value: count() })
      .from(patients)
      .where(eq(patients.departmentId, departmentId));
    if (Number(patientCount?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete: department is assigned to patients. Reassign those patients first.",
      };
    }

    const [userCount] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.departmentId, departmentId));
    if (Number(userCount?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete: department has doctors or users. Reassign them first.",
      };
    }

    await db.delete(departments).where(eq(departments.id, departmentId));

    revalidatePath("/dashboard/departments");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete departments." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to delete department";
    return { success: false, error: message };
  }
}

export type DepartmentWithRelations =
  | ((typeof departments.$inferSelect) & { services: unknown[]; staff: unknown[] })
  | null;

/** getDepartmentById – gated by departments.view */
export async function getDepartmentById(departmentId: string): Promise<ActionResult<DepartmentWithRelations>> {
  try {
    await requirePermission("departments.view");

    const result = await db.query.departments.findFirst({
      where: eq(departments.id, departmentId),
      with: { services: true, operationsStaff: true },
    });

    if (!result) {
      return { success: true, data: null };
    }

    const { operationsStaff, ...dept } = result;
    return {
      success: true,
      data: {
        ...dept,
        staff: operationsStaff ?? [],
      },
    };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view departments." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to load department";
    return { success: false, error: message };
  }
}

/** getDepartmentFinancialSummary – gated by departments.view: revenue (from invoices via services) + expenses. */
export async function getDepartmentFinancialSummary(
  departmentId: string
): Promise<
  ActionResult<{
    revenue: string;
    expenses: string;
    net: string;
    invoiceCount: number;
    expenseCount: number;
  }>
> {
  try {
    await requirePermission("departments.view");

    const [revenueRow, expensesRow, invoiceCountRow, expenseCountRow] = await Promise.all([
      db
        .select({ total: sql<string>`COALESCE(SUM(${invoices.totalAmount}), 0)` })
        .from(invoices)
        .innerJoin(services, eq(invoices.serviceId, services.id))
        .where(eq(services.departmentId, departmentId)),
      db
        .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
        .from(expenses)
        .where(eq(expenses.departmentId, departmentId)),
      db
        .select({ value: count() })
        .from(invoices)
        .innerJoin(services, eq(invoices.serviceId, services.id))
        .where(eq(services.departmentId, departmentId)),
      db
        .select({ value: count() })
        .from(expenses)
        .where(eq(expenses.departmentId, departmentId)),
    ]);

    const revenue = String(revenueRow[0]?.total ?? "0");
    const expensesTotal = String(expensesRow[0]?.total ?? "0");
    const revNum = parseFloat(revenue);
    const expNum = parseFloat(expensesTotal);
    const net = (revNum - expNum).toFixed(2);

    return {
      success: true,
      data: {
        revenue,
        expenses: expensesTotal,
        net,
        invoiceCount: Number(invoiceCountRow[0]?.value ?? 0),
        expenseCount: Number(expenseCountRow[0]?.value ?? 0),
      },
    };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view departments." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to load department financial summary";
    return { success: false, error: message };
  }
}

/** getDepartments – gated by departments.view */
export async function getDepartments(): Promise<
  ActionResult<{ id: string; name: string }[]>
> {
  try {
    await requirePermission("departments.view");

    const result = await db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.status, "active"))
      .orderBy(departments.name);

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view departments." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to load departments";
    return { success: false, error: message };
  }
}
