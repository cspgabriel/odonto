import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Brain, ImageIcon, FileSearch } from "lucide-react";

export default async function ClinicalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("clinical");

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">{t("title")}</h1>
        <p className="dashboard-page-description">
          {t("description")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="opacity-90">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t("odontogram")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("odontogramDescription")}
            </p>
          </CardContent>
        </Card>
        <Card className="opacity-90">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t("aiAnalysis")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("aiAnalysisDescription")}
            </p>
          </CardContent>
        </Card>
        <Card className="opacity-90">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t("ehrLabs")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("ehrLabsDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            {t("roadmap")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>{t("phase2")}</strong> {t("phase2Description")}</p>
          <p><strong>{t("phase3")}</strong> {t("phase3Description")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
