import { getTranslations } from "next-intl/server";
import { signOut } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default async function PendingApprovalPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("pendingApprovalTitle")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("pendingApprovalDescription")}
          </p>
        </div>
      </div>

      <Card className="border-border bg-card shadow-sm max-w-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center">
            <div className="rounded-xl bg-muted p-3">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl font-heading">
            {t("pendingApprovalCardTitle")}
          </CardTitle>
          <CardDescription className="text-sm">
            {t("pendingApprovalCardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="cursor-pointer">
              {t("signOut")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
