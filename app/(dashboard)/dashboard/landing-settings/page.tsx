import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCachedCurrentUser, getCachedClinic } from "@/lib/cache";
import { LandingSettingsClient } from "./_components/landing-settings-client";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LandingSettingsPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  let clinic: Awaited<ReturnType<typeof getCachedClinic>> | null = null;
  try {
    clinic = await getCachedClinic();
  } catch {
    clinic = null;
  }
  const t = await getTranslations("landingSettings");
  if (!clinic) {
    return (
      <div className="p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">{t("clinicNotFound")}</CardTitle>
            <CardDescription>
              {t("clinicNotFoundDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <LandingSettingsClient clinicType={clinic.type} />;
}
