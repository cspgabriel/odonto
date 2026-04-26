import { getTranslations } from "next-intl/server";
import { signOut } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { AuthLogo } from "@/components/auth-logo";

/**
 * Shown on the login page when the user has just signed up (pending=1)
 * or is signed in but not yet approved. Replaces the main login card.
 */
export async function PendingApprovalCard() {
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="border-border bg-card shadow-sm pb-4">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="mb-1 flex items-center justify-center rounded-xl">
                <AuthLogo size={80} showLink={false} useFullLogo={false} />
              </div>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <div className="rounded-xl bg-muted p-3">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">
            {t("pendingApprovalCardTitle")}
          </CardTitle>
          <CardDescription className="px-2 text-xs text-muted-foreground sm:px-8">
            {t("pendingApprovalCardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6 px-6">
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
