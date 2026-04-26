import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getLabVendors } from "@/lib/actions/lab-vendor-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CreateInventoryForm } from "./create-inventory-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewInventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard/inventory");

  const t = await getTranslations("inventory");
  const vendorsResult = await getLabVendors();
  const vendors = vendorsResult.success && vendorsResult.data
    ? vendorsResult.data.map((v) => ({ id: v.id, name: v.name ?? "" }))
    : [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/inventory">{t("backToInventory")}</Link>
          </Button>
        </div>
        <h1 className="dashboard-page-title font-heading">{t("addItemTitle")}</h1>
        <p className="dashboard-page-description text-muted-foreground">
          {t("addItemDescription")}
        </p>
      </div>

      <Card className="rounded-[var(--radius)] border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading">{t("itemDetails")}</CardTitle>
          <CardDescription>
            {t("itemDetailsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateInventoryForm vendors={vendors} />
        </CardContent>
      </Card>
    </div>
  );
}
