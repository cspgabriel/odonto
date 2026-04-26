"use server";

import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { validatePassword } from "@/lib/auth/password-policy";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users, staff, departments, payroll } from "@/lib/db/schema";
import { eq, or, ilike, sql, count, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  createStaffSchema as createOperationsStaffSchema,
  updateStaffSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
} from "@/lib/validations/operations";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const ALLOWED_STAFF_ROLES = ["doctor", "nurse", "receptionist"] as const;
export type StaffRole = (typeof ALLOWED_STAFF_ROLES)[number];

const createStaffMemberSchema = {
  fullName: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  email: (v: unknown) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  role: (v: unknown) => typeof v === "string" && ALLOWED_STAFF_ROLES.includes(v as StaffRole),
  password: (v: unknown) => typeof v === "string" && v.length >= 6,
};

/** createStaffMember – gated by staff.create. Requires SUPABASE_SERVICE_ROLE_KEY in .env. */
export async function createStaffMember(data: {
  fullName: string;
  email: string;
  role: StaffRole;
  password: string;
}): Promise<
  | { success: true; id: string }
  | { success: false; error: string }
> {
  try {
    await requirePermission("staff.create");
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to add staff." };
    }
    throw err;
  }

  const fullName = data.fullName?.trim() ?? "";
  const email = data.email?.trim().toLowerCase() ?? "";
  const role = data.role as StaffRole;
  const password = data.password ?? "";

  if (!createStaffMemberSchema.fullName(fullName)) {
    return { success: false, error: "Full name is required." };
  }
  if (!createStaffMemberSchema.email(email)) {
    return { success: false, error: "A valid email is required." };
  }
  if (!createStaffMemberSchema.role(role)) {
    return { success: false, error: "Role must be doctor, nurse, or receptionist." };
  }
  if (!createStaffMemberSchema.password(password)) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) {
    return {
      success: false,
      error: passwordCheck.errors[0] ?? "Invalid password.",
    };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return {
      success: false,
      error: "Server is not configured for adding staff. Set SUPABASE_SERVICE_ROLE_KEY in .env.",
    };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    const msg = authError.message ?? "";
    if (/already been registered|already exists|duplicate/i.test(msg)) {
      return { success: false, error: "A user with this email already exists." };
    }
    return { success: false, error: msg };
  }

  const authId = authData?.user?.id;
  if (!authId) {
    return { success: false, error: "User was created but ID was not returned." };
  }

  try {
    await db.insert(users).values({
      id: authId,
      fullName,
      email,
      role,
      approvedAt: new Date(), // Admin-created staff are pre-approved
    });
  } catch (dbErr) {
    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
    if (/duplicate|unique|already exists/i.test(msg)) {
      return { success: false, error: "A staff member with this email already exists." };
    }
    return { success: false, error: msg };
  }

  return { success: true, id: authId };
}

// ─── Operations staff table (roster) ────────────────────────────────────────

/** createStaff – gated by staff.create */
export async function createStaff(
  input: CreateStaffInput
): Promise<ActionResult<typeof staff.$inferSelect>> {
  try {
    await requirePermission("staff.create");

    const validated = createOperationsStaffSchema.parse(input);
    const fullName =
      validated.firstName && validated.lastName
        ? `${validated.firstName} ${validated.lastName}`.trim()
        : validated.fullName;
    const email =
      validated.email && validated.email !== "" ? validated.email : null;

    if (email && validated.password) {
      const passwordCheck = validatePassword(validated.password);
      if (!passwordCheck.isValid) {
        return {
          success: false,
          error: passwordCheck.errors[0] ?? "Invalid password.",
        };
      }
      const supabaseAdmin = getSupabaseAdmin();
      if (!supabaseAdmin) {
        return {
          success: false,
          error:
            "Server is not configured for adding staff. Set SUPABASE_SERVICE_ROLE_KEY in .env.",
        };
      }
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password: validated.password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
      if (authError) {
        const msg = authError.message ?? "";
        if (/already been registered|already exists|duplicate/i.test(msg)) {
          return { success: false, error: "A user with this email already exists." };
        }
        return { success: false, error: msg };
      }
      const authId = authData?.user?.id;
      if (authId) {
        try {
          await db.insert(users).values({
            id: authId,
            fullName,
            email: email.trim().toLowerCase(),
            role: validated.role as "admin" | "doctor" | "nurse" | "receptionist",
          });
        } catch (dbErr) {
          const m = dbErr instanceof Error ? dbErr.message : String(dbErr);
          if (/duplicate|unique|already exists/i.test(m)) {
            return {
              success: false,
              error: "A staff member with this email already exists.",
            };
          }
          throw dbErr;
        }
      }
    }

    const [result] = await db
      .insert(staff)
      .values({
        fullName,
        firstName: validated.firstName ?? null,
        lastName: validated.lastName ?? null,
        role: validated.role,
        departmentId: validated.departmentId ?? null,
        phone: validated.phone ?? null,
        email,
        address: validated.address ?? null,
        salary: validated.salary ?? null,
        qualifications: validated.qualifications ?? null,
        workSchedule:
          validated.workSchedule != null
            ? (validated.workSchedule as Record<string, unknown>)
            : null,
        status: validated.status,
        joinedDate: validated.joinedDate ?? null,
        notes: validated.notes ?? null,
      })
      .returning();

    if (!result) {
      return { success: false, error: "Failed to create staff" };
    }

    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to add staff." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to create staff";
    return { success: false, error: message };
  }
}

const STAFF_STATUSES = ["approved", "pending", "rejected"] as const;

/** updateStaffStatus – gated by staff.edit */
export async function updateStaffStatus(
  staffId: string,
  status: string
): Promise<ActionResult<void>> {
  try {
    await requirePermission("staff.edit");
    if (!STAFF_STATUSES.includes(status as (typeof STAFF_STATUSES)[number])) {
      return { success: false, error: "Invalid status." };
    }
    await db
      .update(staff)
      .set({ status, updatedAt: new Date() })
      .where(eq(staff.id, staffId));
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit staff." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to update status";
    return { success: false, error: message };
  }
}

/** updateStaff – gated by staff.edit */
export async function updateStaff(
  input: UpdateStaffInput
): Promise<ActionResult<typeof staff.$inferSelect>> {
  try {
    await requirePermission("staff.edit");

    const validated = updateStaffSchema.parse(input);
    const { staffId, ...rest } = validated;

    const updateData: Partial<typeof staff.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (rest.fullName !== undefined) updateData.fullName = rest.fullName;
    if (rest.firstName !== undefined) updateData.firstName = rest.firstName ?? null;
    if (rest.lastName !== undefined) updateData.lastName = rest.lastName ?? null;
    if (rest.role !== undefined) updateData.role = rest.role;
    if (rest.departmentId !== undefined) updateData.departmentId = rest.departmentId ?? null;
    if (rest.phone !== undefined) updateData.phone = rest.phone ?? null;
    if (rest.email !== undefined) updateData.email = rest.email && rest.email !== "" ? rest.email : null;
    if (rest.address !== undefined) updateData.address = rest.address ?? null;
    if (rest.salary !== undefined) updateData.salary = rest.salary ?? null;
    if (rest.qualifications !== undefined) updateData.qualifications = rest.qualifications ?? null;
    if (rest.workSchedule !== undefined) updateData.workSchedule = rest.workSchedule as Record<string, unknown> | null;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.joinedDate !== undefined) updateData.joinedDate = rest.joinedDate ?? null;
    if (rest.notes !== undefined) updateData.notes = rest.notes ?? null;

    const [updated] = await db
      .update(staff)
      .set(updateData)
      .where(eq(staff.id, staffId))
      .returning();

    if (!updated) {
      return { success: false, error: "Staff not found" };
    }

    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit staff." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to update staff";
    return { success: false, error: message };
  }
}

/** deleteStaff – gated by staff.delete */
export async function deleteStaff(staffId: string): Promise<ActionResult<void>> {
  try {
    await requirePermission("staff.delete");

    // Guard: appointments reference users.id (doctorId), not staff.id — no link to check
    await db.delete(staff).where(eq(staff.id, staffId));

    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to delete staff." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to delete staff";
    return { success: false, error: message };
  }
}

/** getStaffById – gated by staff.view */
export async function getStaffById(staffId: string): Promise<
  ActionResult<(typeof staff.$inferSelect) & { department: { id: string; name: string } | null } | null>
> {
  try {
    await requirePermission("staff.view");

    const result = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
      with: { department: true },
    });

    return { success: true, data: result ?? null };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view staff." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to load staff";
    return { success: false, error: message };
  }
}

export type StaffPageRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  departmentId: string | null;
  salary: string | null;
  workSchedule: unknown;
  joinedDate: string | null;
  departmentName: string | null;
  status: string;
};

export type StaffPageData = {
  staff: StaffPageRow[];
  totalCount: number;
  totalStaff: number;
  doctorsCount: number;
  nursesCount: number;
  salaryBudget: string;
};

/** getStaffPageData – gated by staff.view */
export async function getStaffPageData(opts: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<StaffPageData>> {
  try {
    await requirePermission("staff.view");

    const search = (opts.search ?? "").trim();
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 10));
    const offset = (page - 1) * pageSize;

    const whereClause = search
      ? or(
          ilike(staff.fullName, `%${search}%`),
          ilike(staff.email ?? "", `%${search}%`)
        )
      : undefined;

    const staffBase = db
      .select({
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        departmentId: staff.departmentId,
        salary: staff.salary,
        workSchedule: staff.workSchedule,
        joinedDate: staff.joinedDate,
        departmentName: departments.name,
        status: staff.status,
      })
      .from(staff)
      .leftJoin(departments, eq(staff.departmentId, departments.id));

    const [filteredCountResult, staffWithDept, totalStaffResult, doctorsResult, nursesResult, salaryResult] =
      await Promise.all([
        whereClause
          ? db.select({ value: count() }).from(staff).where(whereClause)
          : db.select({ value: count() }).from(staff),
        whereClause
          ? staffBase.where(whereClause).orderBy(desc(staff.createdAt)).limit(pageSize).offset(offset)
          : staffBase.orderBy(desc(staff.createdAt)).limit(pageSize).offset(offset),
        db.select({ total: count() }).from(staff),
        db.select({ total: count() }).from(staff).where(eq(staff.role, "doctor")),
        db.select({ total: count() }).from(staff).where(eq(staff.role, "nurse")),
        db
          .select({
            total: sql<string>`coalesce(sum(${staff.salary})::text, '0')`,
          })
          .from(staff),
      ]);

    const totalCount = Number(filteredCountResult[0]?.value ?? 0);
    const totalStaff = Number(totalStaffResult[0]?.total ?? 0);
    const doctorsCount = Number(doctorsResult[0]?.total ?? 0);
    const nursesCount = Number(nursesResult[0]?.total ?? 0);
    const salaryBudget = String(salaryResult[0]?.total ?? "0");

    return {
      success: true,
      data: {
        staff: staffWithDept as StaffPageRow[],
        totalCount,
        totalStaff,
        doctorsCount,
        nursesCount,
        salaryBudget,
      },
    };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view staff." };
    }
    const message = err instanceof Error ? err.message : "Failed to load staff page data";
    return { success: false, error: message };
  }
}

/** getPayrollByStaffId – gated by staff.view (staff table). Matches staff to user by email, then fetches payroll by user id. */
export async function getPayrollByStaffId(staffId: string): Promise<
  ActionResult<Array<{
    id: string;
    periodStart: string;
    periodEnd: string;
    baseSalary: string;
    bonuses: string | null;
    deductions: string | null;
    netAmount: string;
    status: string;
    paidAt: Date | null;
  }>>
> {
  try {
    await requirePermission("staff.view");

    const [staffRow] = await db.select({ email: staff.email }).from(staff).where(eq(staff.id, staffId));
    if (!staffRow?.email) {
      return { success: true, data: [] };
    }
    const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.email, staffRow.email));
    if (!userRow) {
      return { success: true, data: [] };
    }
    const records = await db
      .select({
        id: payroll.id,
        periodStart: payroll.periodStart,
        periodEnd: payroll.periodEnd,
        baseSalary: payroll.baseSalary,
        bonuses: payroll.bonuses,
        deductions: payroll.deductions,
        netAmount: payroll.netAmount,
        status: payroll.status,
        paidAt: payroll.paidAt,
      })
      .from(payroll)
      .where(eq(payroll.staffId, userRow.id))
      .orderBy(desc(payroll.periodEnd));
    return {
      success: true,
      data: records.map((r) => ({
        id: r.id,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        baseSalary: String(r.baseSalary ?? "0"),
        bonuses: r.bonuses != null ? String(r.bonuses) : null,
        deductions: r.deductions != null ? String(r.deductions) : null,
        netAmount: String(r.netAmount ?? "0"),
        status: r.status,
        paidAt: r.paidAt,
      })),
    };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view staff." };
    }
    const message = err instanceof Error ? err.message : "Failed to load payroll";
    return { success: false, error: message };
  }
}

/** getStaffMembers – gated by staff.view */
export async function getStaffMembers(): Promise<
  ActionResult<{ id: string; fullName: string; role: string }[]>
> {
  try {
    await requirePermission("staff.view");

    const result = await db
      .select({ id: staff.id, fullName: staff.fullName, role: staff.role })
      .from(staff)
      .where(eq(staff.status, "approved"))
      .orderBy(staff.fullName);

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to view staff." };
    }
    const message =
      err instanceof Error ? err.message : "Failed to load staff members";
    return { success: false, error: message };
  }
}
