import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { db } from "@/lib/db";
import { inventory, labVendors } from "@/lib/db/schema";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { AddInventoryButton } from "./add-inventory-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryList } from "./inventory-list";
import { InventorySearch } from "./inventory-search";
import { Package, AlertTriangle, PackageX, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TablePagination } from "@/components/dashboard/table-pagination";
import InventoryLoading from "./loading";

export const metadata = {
  title: "Inventory | CareNova",
  robots: { index: false, follow: false },
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

interface InventoryPageSearchParams {
  q?: string;
  category?: string;
  status?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<InventoryPageSearchParams>;
}) {
  const canView = await checkPermission("inventory.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkPermission("inventory.create"),
    checkPermission("inventory.edit"),
    checkPermission("inventory.delete"),
  ]);
  const params = await searchParams;
  return (
    <Suspense fallback={<InventoryLoading />}>
      <InventoryContent searchParams={params} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
    </Suspense>
  );
}

async function InventoryContent({
  searchParams,
  canCreate,
  canEdit,
  canDelete,
}: {
  searchParams: InventoryPageSearchParams;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const t = await getTranslations("inventory");
  const q = (searchParams.q ?? "").trim();
  const category = searchParams.category ?? "all";
  const status = searchParams.status ?? "all";
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.pageSize ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE)
  );
  const sortBy = searchParams.sortBy ?? "createdAt";
  const sortOrderParam = searchParams.sortOrder ?? "desc";
  const sortOrderResolved = sortOrderParam === "desc" ? "desc" : "asc";

  const categoryCondition =
    category && category !== "all" ? ilike(inventory.category, `%${category}%`) : undefined;
  const searchCondition = q
    ? or(ilike(inventory.name, `%${q}%`), ilike(inventory.batchNumber ?? "", `%${q}%`))
    : undefined;
  const statusCondition =
    status && status !== "all"
      ? status === "in_stock"
        ? sql`${inventory.quantity} > coalesce(${inventory.minStock}, 0)`
        : status === "low_stock"
          ? sql`${inventory.quantity} > 0 AND ${inventory.quantity} <= coalesce(${inventory.minStock}, 0)`
          : status === "out_of_stock"
            ? eq(inventory.quantity, 0)
            : undefined
      : undefined;

  const whereClause = and(searchCondition, categoryCondition, statusCondition);

  const [countResult, listResult] = await Promise.all([
    db
      .select({ value: count() })
      .from(inventory)
      .where(whereClause),
    db
      .select({
        id: inventory.id,
        name: inventory.name,
        category: inventory.category,
        description: inventory.description,
        manufacturer: inventory.manufacturer,
        batchNumber: inventory.batchNumber,
        quantity: inventory.quantity,
        unit: inventory.unit,
        minStock: inventory.minStock,
        price: inventory.price,
        supplier: inventory.supplier,
        supplierId: inventory.supplierId,
        expiryDate: inventory.expiryDate,
        status: inventory.status,
        notes: inventory.notes,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
        vendorName: labVendors.name,
      })
      .from(inventory)
      .leftJoin(labVendors, eq(inventory.supplierId, labVendors.id))
      .where(whereClause)
      .orderBy(
        sortBy === "name"
          ? sortOrderResolved === "desc"
            ? desc(inventory.name)
            : asc(inventory.name)
          : sortBy === "category"
            ? sortOrderResolved === "desc"
              ? desc(inventory.category)
              : asc(inventory.category)
            : sortBy === "quantity"
              ? sortOrderResolved === "desc"
                ? desc(inventory.quantity)
                : asc(inventory.quantity)
            : sortOrderResolved === "desc"
              ? desc(inventory.createdAt)
              : asc(inventory.createdAt)
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const totalCount = Number(countResult[0]?.value ?? 0);

  const [totalItemsResult, totalValueResult, lowStockResult, outOfStockResult] =
    await Promise.all([
      db.select({ value: count() }).from(inventory),
      db
        .select({
          total: sql<string>`coalesce(sum((${inventory.quantity}::numeric * coalesce(${inventory.price}::numeric, 0))), 0)::text`,
        })
        .from(inventory),
      db
        .select({ value: count() })
        .from(inventory)
        .where(
          and(
            sql`${inventory.quantity} > 0`,
            sql`${inventory.quantity} <= coalesce(${inventory.minStock}, 0)`
          )
        ),
      db.select({ value: count() }).from(inventory).where(eq(inventory.quantity, 0)),
    ]);
  const totalItems = Number(totalItemsResult[0]?.value ?? 0);
  const totalValue = parseFloat(totalValueResult[0]?.total ?? "0");
  const lowStockCount = Number(lowStockResult[0]?.value ?? 0);
  const outOfStockCount = Number(outOfStockResult[0]?.value ?? 0);

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("pageDescription")}
          </p>
        </div>
        {canCreate && (
          <AddInventoryButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statTotal")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
              {totalItems}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("statInInventory")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statLowStock")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
              {lowStockCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("statBelowMin")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statOutOfStock")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <PackageX className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
              {outOfStockCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("statZeroQty")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statTotalValue")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("statAtCurrentPrices")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <InventoryList
          items={listResult}
          searchContent={
            <InventorySearch
              defaultValue={q}
              categoryValue={category}
              statusValue={status}
              pageSize={pageSize}
            />
          }
          createAction={canCreate ? <AddInventoryButton variant="outline" size="sm" /> : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/inventory"
              />
            </div>
          )}
        </InventoryList>
      </div>
    </div>
  );
}
