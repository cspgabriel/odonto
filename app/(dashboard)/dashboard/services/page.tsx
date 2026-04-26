import { redirect } from "next/navigation";
import { Suspense } from "react";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { requestLog } from "@/lib/debug";
import { db } from "@/lib/db";
import { services, departments } from "@/lib/db/schema";
import { count, eq, and, ilike, asc, desc } from "drizzle-orm";
import { ServicesPageClient } from "./services-page-client";
import ServicesLoading from "./loading";

export const metadata = {
  title: "Services | CareNova",
  robots: { index: false, follow: false },
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

interface ServicesPageSearchParams {
  q?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  department?: string;
  status?: string;
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<ServicesPageSearchParams>;
}) {
  requestLog("services.page.start");
  const canView = await checkPermission("services.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  requestLog("services.page.getUser.done", user ? user.role : "null");
  if (!user) redirect("/login");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkPermission("services.create"),
    checkPermission("services.edit"),
    checkPermission("services.delete"),
  ]);
  const params = await searchParams;
  return (
    <Suspense fallback={<ServicesLoading />}>
      <ServicesContent searchParams={params} user={user} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
    </Suspense>
  );
}

async function ServicesContent({
  searchParams,
  user,
  canCreate,
  canEdit,
  canDelete,
}: {
  searchParams: ServicesPageSearchParams;
  user: { role: string };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  requestLog("services.content.start");
  const {
    q,
    page: pageParam,
    pageSize: pageSizeParam,
    sortBy = "createdAt",
    sortOrder: sortOrderParam,
    department,
    status,
  } = searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(pageSizeParam ?? "10") || 10)
  );
  const sortOrderResolved =
    sortOrderParam === "asc"
      ? "asc"
      : sortOrderParam === "desc"
        ? "desc"
        : sortBy === "createdAt"
          ? "desc"
          : "asc";

  const whereClause = and(
    search ? ilike(services.name, `%${search}%`) : undefined,
    department ? eq(services.departmentId, department) : undefined,
    status && status !== "all" ? eq(services.status, status) : undefined
  );

  const [departmentsList, totalResult, activeResult, deptResult, list] =
    await Promise.all([
      db
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(eq(departments.status, "active"))
        .orderBy(departments.name),
      db.select({ value: count() }).from(services).where(whereClause ?? undefined),
      db
        .select({ value: count() })
        .from(services)
        .where(
          and(whereClause ?? undefined, eq(services.status, "active"))
        ),
      db.select({ value: count() }).from(departments).where(eq(departments.status, "active")),
      db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          price: services.price,
          duration: services.duration,
          departmentId: services.departmentId,
          status: services.status,
          category: services.category,
          departmentName: departments.name,
        })
        .from(services)
        .leftJoin(departments, eq(services.departmentId, departments.id))
        .where(whereClause ?? undefined)
        .orderBy(
          sortBy === "name"
            ? sortOrderResolved === "desc"
              ? desc(services.name)
              : asc(services.name)
            : sortBy === "price"
              ? sortOrderResolved === "desc"
                ? desc(services.price)
                : asc(services.price)
              : sortBy === "duration"
                ? sortOrderResolved === "desc"
                  ? desc(services.duration)
                  : asc(services.duration)
                : sortOrderResolved === "desc"
                  ? desc(services.createdAt)
                  : asc(services.createdAt)
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

  const totalCount = Number(totalResult[0]?.value ?? 0);
  const activeServices = Number(activeResult[0]?.value ?? 0);
  const activeDepartments = Number(deptResult[0]?.value ?? 0);
  requestLog(
    "services.content.done",
    `list=${list.length} total=${totalCount}`
  );

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <ServicesPageClient
        list={list}
        departments={departmentsList}
        stats={{
          totalServices: totalCount,
          activeServices,
          activeDepartments,
        }}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        searchParams={{
          q: search,
          page,
          pageSize,
          sortBy,
          sortOrder: sortOrderResolved,
          department: department ?? undefined,
          status: status ?? undefined,
        }}
      />
    </div>
  );
}
