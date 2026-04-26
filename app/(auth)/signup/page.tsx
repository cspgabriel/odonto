"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthLogo } from "@/components/auth-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  const t = useTranslations("auth");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mx-auto w-full max-w-xl">
        <Card className="border-border bg-card shadow-sm pb-4">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="mb-1 flex items-center justify-center rounded-xl">
                  <AuthLogo size={80} showLink={false} useFullLogo={false} />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-foreground">
              {t("signupTitle")}
            </CardTitle>
            <CardDescription className="px-2 text-xs text-muted-foreground sm:px-8">
              {t("signupDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6">
            <SignupForm />
            <p className="text-center text-sm pt-2">
              <Link
                href="/login"
                className="text-muted-foreground cursor-pointer text-xs hover:underline"
              >
                {t("alreadyHaveAccount")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
