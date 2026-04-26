import { signOut } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function DashboardDbError({
  message,
  title,
  showEnvHint = true,
  showRetry = false,
  tryAgainLabel = "Try again",
  signOutLabel = "Sign out",
  envHint,
}: {
  message: string;
  title?: string;
  showEnvHint?: boolean;
  showRetry?: boolean;
  tryAgainLabel?: string;
  signOutLabel?: string;
  envHint?: string;
}) {
  const displayTitle = title ?? "Database connection failed";
  const displayEnvHint = envHint ?? "Fix .env then restart the dev server. For Supabase: use the \"Transaction\" pooler connection string and the database password from Settings → Database (reset it there if needed).";
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle className="text-lg">{displayTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          {showEnvHint && (
            <p className="text-sm text-muted-foreground">
              {displayEnvHint}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {showRetry && (
              <Button asChild variant="default">
                <a href="/dashboard">{tryAgainLabel}</a>
              </Button>
            )}
            <form action={signOut}>
              <Button type="submit" variant="outline">
                {signOutLabel}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
