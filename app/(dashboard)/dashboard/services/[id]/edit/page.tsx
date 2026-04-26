import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getServiceById } from "@/lib/actions/service-actions";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateServiceForm } from "./update-service-form";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard/services");

  const t = await getTranslations("services");
  const { id } = await params;
  const [result, departmentsList] = await Promise.all([
    getServiceById(id),
    db.select({ id: departments.id, name: departments.name }).from(departments).where(eq(departments.isActive, 1)),
  ]);
  if (!result.success || !result.data) notFound();

  return (
    <div className="dashboard-page max-w-lg">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/services">{t("backToServices")}</Link>
      </Button>
      <Card className="py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading">{t("editServicePageTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <UpdateServiceForm service={result.data} departments={departmentsList} />
        </CardContent>
      </Card>
    </div>
  );
}
