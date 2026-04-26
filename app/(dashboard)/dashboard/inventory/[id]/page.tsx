import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCachedCurrentUser } from "@/lib/cache";
import { getInventoryById } from "@/lib/actions/inventory-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "nurse"].includes(user.role)) redirect("/dashboard");

  const t = await getTranslations("inventory");
  const tCommon = await getTranslations("common");
  const { id } = await params;
  const result = await getInventoryById(id);
  if (!result.success || !result.data) notFound();
  const item = result.data;

  const qty = item.quantity ?? 0;
  const min = item.minStock ?? 0;
  const unitPrice = Number(item.price ?? 0);
  const totalValue = qty * unitPrice;
  const status =
    qty === 0 ? t("statusOutOfStock") : qty <= min ? t("statusLowStock") : t("statusInStock");

  return (
    <div className="dashboard-page max-w-2xl pb-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/inventory">{t("backToInventory")}</Link>
      </Button>
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-xl">{item.name}</CardTitle>
          <Button asChild size="sm">
            <Link href={`/dashboard/inventory/${id}/edit`}>{tCommon("edit")}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t("basicInfo")}</h3>
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-sm">
              <p><span className="text-slate-500">{t("tableCategory")}:</span> {item.category ?? "—"}</p>
              <p><span className="text-slate-500">{t("batch")}:</span> {item.batchNumber ?? "—"}</p>
              <p><span className="text-slate-500">{t("manufacturer")}:</span> {item.manufacturer ?? "—"}</p>
              <p><span className="text-slate-500">{t("tableStatus")}:</span> {status}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t("stockAndValue")}</h3>
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-2 gap-4 text-sm">
              <p><span className="text-slate-500">{t("tableQuantity")}:</span> {qty} {item.unit}{qty !== 1 ? "s" : ""}</p>
              <p><span className="text-slate-500">{t("min")} Stock:</span> {min}</p>
              <p><span className="text-slate-500">{t("tableUnitPrice")}:</span> ${unitPrice.toFixed(2)}</p>
              <p><span className="text-slate-500">{t("tableTotalValue")}:</span> ${totalValue.toFixed(2)}</p>
              <p><span className="text-slate-500">{t("tableExpiry")}:</span> {item.expiryDate ? format(new Date(item.expiryDate), "MMM d, yyyy") : "—"}</p>
            </div>
          </div>
          {item.description && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t("description")}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
