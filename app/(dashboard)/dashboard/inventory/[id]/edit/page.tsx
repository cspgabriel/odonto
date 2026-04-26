import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCachedCurrentUser } from "@/lib/cache";
import { getInventoryById } from "@/lib/actions/inventory-actions";
import { db } from "@/lib/db";
import { labVendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateInventoryForm } from "./update-inventory-form";

export default async function EditInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "nurse"].includes(user.role)) redirect("/dashboard");

  const t = await getTranslations("inventory");
  const { id } = await params;
  const [result, vendors] = await Promise.all([
    getInventoryById(id),
    db
      .select({ id: labVendors.id, name: labVendors.name })
      .from(labVendors)
      .where(eq(labVendors.status, "active")),
  ]);

  if (!result.success || !result.data) notFound();

  return (
    <div className="dashboard-page max-w-lg pb-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/inventory">{t("backToInventory")}</Link>
      </Button>
      <Card className="mt-4">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading">{t("editItemTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <UpdateInventoryForm item={result.data} vendors={vendors} />
        </CardContent>
      </Card>
    </div>
  );
}
