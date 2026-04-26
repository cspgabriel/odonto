"use server";

import { getCurrentUser, requireRole, type UserRole } from "@/lib/auth";
import { getCachedCurrentUser } from "@/lib/cache";
import { requestLog } from "@/lib/debug";
import { db } from "@/lib/db";
import { labVendors, inventory, testReports, expenses } from "@/lib/db/schema";
import { eq, count, or, ilike, and, inArray, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  createLabVendorSchema,
  updateLabVendorSchema,
  type CreateLabVendorInput,
  type UpdateLabVendorInput,
} from "@/lib/validations/operations";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const ALLOWED_ROLES: UserRole[] = ["admin"];

export async function createLabVendor(
  input: CreateLabVendorInput
): Promise<ActionResult<typeof labVendors.$inferSelect>> {
  try {
    const user = await getCurrentUser();
    requireRole(user?.role ?? null, ALLOWED_ROLES);

    const validated = createLabVendorSchema.parse(input);
    const [result] = await db
      .insert(labVendors)
      .values({
        name: validated.name,
        code: validated.code ?? null,
        labType: validated.labType ?? null,
        contactPerson: validated.contactPerson ?? null,
        licenseNumber: validated.licenseNumber ?? null,
        phone: validated.phone ?? null,
        email: validated.email && validated.email !== "" ? validated.email : null,
        website: validated.website && validated.website !== "" ? validated.website : null,
        address: validated.address ?? null,
        city: validated.city ?? null,
        state: validated.state ?? null,
        zipCode: validated.zipCode ?? null,
        accreditations: validated.accreditations ?? null,
        specialties: validated.specialties ?? null,
        rating: validated.rating != null ? String(validated.rating) : null,
        tier: validated.tier ?? null,
        contractStartDate: validated.contractStart ?? null,
        contractEndDate: validated.contractEnd ?? null,
        status: validated.status,
        notes: validated.notes ?? null,
      })
      .returning();

    if (!result) {
      return { success: false, error: "Failed to create lab vendor" };
    }

    revalidatePath("/dashboard/lab-vendors");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create lab vendor";
    return { success: false, error: message };
  }
}

export async function updateLabVendor(
  input: UpdateLabVendorInput
): Promise<ActionResult<typeof labVendors.$inferSelect>> {
  try {
    const user = await getCurrentUser();
    requireRole(user?.role ?? null, ALLOWED_ROLES);

    const validated = updateLabVendorSchema.parse(input);
    const { vendorId, ...rest } = validated;

    const updateData: Partial<typeof labVendors.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.contactPerson !== undefined) updateData.contactPerson = rest.contactPerson ?? null;
    if (rest.phone !== undefined) updateData.phone = rest.phone ?? null;
    if (rest.email !== undefined) updateData.email = rest.email && rest.email !== "" ? rest.email : null;
    if (rest.address !== undefined) updateData.address = rest.address ?? null;
    if (rest.contractStart !== undefined) updateData.contractStartDate = rest.contractStart ?? null;
    if (rest.contractEnd !== undefined) updateData.contractEndDate = rest.contractEnd ?? null;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.notes !== undefined) updateData.notes = rest.notes ?? null;

    const [updated] = await db
      .update(labVendors)
      .set(updateData)
      .where(eq(labVendors.id, vendorId))
      .returning();

    if (!updated) {
      return { success: false, error: "Lab vendor not found" };
    }

    revalidatePath("/dashboard/lab-vendors");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update lab vendor";
    return { success: false, error: message };
  }
}

export async function deleteLabVendor(vendorId: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    requireRole(user?.role ?? null, ALLOWED_ROLES);

    const [inventoryCount] = await db
      .select({ value: count() })
      .from(inventory)
      .where(eq(inventory.supplierId, vendorId));
    if (Number(inventoryCount?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete: vendor is linked to inventory items. Reassign or remove them first.",
      };
    }

    const [testReportCount] = await db
      .select({ value: count() })
      .from(testReports)
      .where(eq(testReports.labVendorId, vendorId));
    if (Number(testReportCount?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete: vendor is linked to test reports. Reassign those reports first.",
      };
    }

    const [expenseCount] = await db
      .select({ value: count() })
      .from(expenses)
      .where(eq(expenses.vendorId, vendorId));
    if (Number(expenseCount?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete: vendor is linked to expenses. Reassign or remove those expenses first.",
      };
    }

    await db.delete(labVendors).where(eq(labVendors.id, vendorId));

    revalidatePath("/dashboard/lab-vendors");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete lab vendor";
    return { success: false, error: message };
  }
}

/** Financial summary for a lab vendor: total expenses linked to this vendor. */
export async function getVendorFinancialSummary(vendorId: string): Promise<
  ActionResult<{ totalExpenses: string; expenseCount: number }>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const [row] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${expenses.amount})::text, '0')`,
        count: count(),
      })
      .from(expenses)
      .where(eq(expenses.vendorId, vendorId));
    return {
      success: true,
      data: {
        totalExpenses: String(row?.total ?? "0"),
        expenseCount: Number(row?.count ?? 0),
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load vendor financial summary";
    return { success: false, error: message };
  }
}

export async function getLabVendorById(vendorId: string): Promise<
  ActionResult<typeof labVendors.$inferSelect | null>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const [row] = await db
      .select()
      .from(labVendors)
      .where(eq(labVendors.id, vendorId))
      .limit(1);

    return { success: true, data: row ?? null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load lab vendor";
    return { success: false, error: message };
  }
}

export type LabVendorPageRow = {
  id: string;
  name: string;
  code: string | null;
  labType: string | null;
  rating: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  specialties: string | null;
  turnaroundHours: number | null;
  tier: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  status: string;
  testsCount: number;
  lastTestDate: string | null;
};

export type LabVendorPageData = {
  vendors: LabVendorPageRow[];
  totalCount: number;
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  totalTests: number;
};

export async function getLabVendorsPageData(opts: {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<ActionResult<LabVendorPageData>> {
  try {
    requestLog("lab-vendors.getPageData", "start");
    const user = await getCachedCurrentUser();
    requestLog("lab-vendors.getPageData", `user=${user?.id ?? "null"} role=${user?.role ?? "n/a"}`);
    if (!user || user.role !== "admin") {
      requestLog("lab-vendors.getPageData", `fail: ${!user ? "no user" : "not admin"}`);
      return { success: false, error: "Unauthorized" };
    }

    const search = (opts.search ?? "").trim();
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 10));
    const offset = (page - 1) * pageSize;
    const statusFilter = opts.status && opts.status !== "all" ? opts.status : undefined;

    const whereExpr =
      search || statusFilter
        ? and(
            search
              ? or(
                  ilike(labVendors.name, `%${search}%`),
                  ilike(labVendors.contactPerson ?? "", `%${search}%`),
                  ilike(labVendors.email ?? "", `%${search}%`),
                  ilike(labVendors.code ?? "", `%${search}%`)
                )
              : undefined,
            statusFilter ? eq(labVendors.status, statusFilter) : undefined
          )
        : undefined;

    const filteredCountResult = whereExpr
      ? await db.select({ value: count() }).from(labVendors).where(whereExpr)
      : await db.select({ value: count() }).from(labVendors);

    const vendorsList = whereExpr
      ? await db
          .select({
            id: labVendors.id,
            name: labVendors.name,
            code: labVendors.code,
            labType: labVendors.labType,
            rating: labVendors.rating,
            contactPerson: labVendors.contactPerson,
            email: labVendors.email,
            phone: labVendors.phone,
            specialties: labVendors.specialties,
            turnaroundHours: labVendors.turnaroundHours,
            tier: labVendors.tier,
            contractStartDate: labVendors.contractStartDate,
            contractEndDate: labVendors.contractEndDate,
            status: labVendors.status,
          })
          .from(labVendors)
          .where(whereExpr)
          .orderBy(desc(labVendors.createdAt))
          .limit(pageSize)
          .offset(offset)
      : await db
          .select({
            id: labVendors.id,
            name: labVendors.name,
            code: labVendors.code,
            labType: labVendors.labType,
            rating: labVendors.rating,
            contactPerson: labVendors.contactPerson,
            email: labVendors.email,
            phone: labVendors.phone,
            specialties: labVendors.specialties,
            turnaroundHours: labVendors.turnaroundHours,
            tier: labVendors.tier,
            contractStartDate: labVendors.contractStartDate,
            contractEndDate: labVendors.contractEndDate,
            status: labVendors.status,
          })
          .from(labVendors)
          .orderBy(desc(labVendors.createdAt))
          .limit(pageSize)
          .offset(offset);

    const vendorIds = vendorsList.map((v) => v.id);
    const lastTestByVendor = new Map<string, { count: number; lastDate: string }>();
    if (vendorIds.length > 0) {
      const aggRows = await db
        .select({
          labVendorId: testReports.labVendorId,
          cnt: count(),
          lastDate: sql<string>`max(${testReports.reportDate})::text`,
        })
        .from(testReports)
        .where(inArray(testReports.labVendorId, vendorIds.filter(Boolean) as string[]))
        .groupBy(testReports.labVendorId);
      for (const r of aggRows) {
        if (r.labVendorId) {
          lastTestByVendor.set(r.labVendorId, {
            count: Number(r.cnt),
            lastDate: r.lastDate ?? "",
          });
        }
      }
    }

    const vendors: LabVendorPageRow[] = vendorsList.map((v) => {
      const agg = v.id ? lastTestByVendor.get(v.id) : null;
      return {
        ...v,
        testsCount: agg?.count ?? 0,
        lastTestDate: agg?.lastDate || null,
      };
    });

    const [totalVendorsResult, activeResult, pendingResult, totalTestsResult] =
      await Promise.all([
        db.select({ value: count() }).from(labVendors),
        db.select({ value: count() }).from(labVendors).where(eq(labVendors.status, "active")),
        db.select({ value: count() }).from(labVendors).where(eq(labVendors.status, "pending")),
        db.select({ value: count() }).from(testReports),
      ]);

    const totalCount = Number(filteredCountResult[0]?.value ?? 0);
    const totalVendors = Number(totalVendorsResult[0]?.value ?? 0);
    const activeVendors = Number(activeResult[0]?.value ?? 0);
    const pendingVendors = Number(pendingResult[0]?.value ?? 0);
    const totalTests = Number(totalTestsResult[0]?.value ?? 0);

    requestLog("lab-vendors.getPageData", `ok: ${vendors.length} vendors`);
    return {
      success: true,
      data: {
        vendors,
        totalCount,
        totalVendors,
        activeVendors,
        pendingVendors,
        totalTests,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load lab vendors page";
    requestLog("lab-vendors.getPageData", `error: ${message}`);
    return { success: false, error: message };
  }
}

/** Returns { id, name } for dropdowns. Any authenticated user. */
export async function getLabVendors(): Promise<
  ActionResult<{ id: string; name: string }[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const result = await db
      .select({ id: labVendors.id, name: labVendors.name })
      .from(labVendors)
      .where(eq(labVendors.status, "active"))
      .orderBy(labVendors.name);

    return { success: true, data: result };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load lab vendors";
    return { success: false, error: message };
  }
}
