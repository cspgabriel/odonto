"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthLogo } from "@/components/auth-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "../login-form";
import { DemoLogins } from "./demo-logins";

function LoginCardTitle() {
  const t = useTranslations("auth");
  return <>{t("loginTitle")}</>;
}
function LoginCardDescription() {
  const t = useTranslations("auth");
  return <>{t("loginDescription")}</>;
}
function LoginNoAccountLink() {
  const t = useTranslations("auth");
  return <>{t("noAccount")}</>;
}

function LoginContent({
  autoFillEmail,
  autoFillPassword,
  onAutoFill,
  showConfirmedMessage,
  showEmailAlreadyRegistered,
}: {
  autoFillEmail: string;
  autoFillPassword: string;
  onAutoFill: (email: string, password: string) => void;
  showConfirmedMessage: boolean;
  showEmailAlreadyRegistered: boolean;
}) {
  const t = useTranslations("auth");
  return (
    <>
      <div className="absolute right-4 top-4 z-10">
        <DemoLogins onAutoFill={onAutoFill} />
      </div>
      <div className="mx-auto w-full max-w-md">
        {showConfirmedMessage && (
          <div
            className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200"
            role="status"
          >
            {t("accountConfirmedMessage")}
          </div>
        )}
        {showEmailAlreadyRegistered && (
          <div
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
            role="alert"
          >
            {t("errorEmailAlreadyRegistered")}
          </div>
        )}
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
              <LoginCardTitle />
            </CardTitle>
            <CardDescription className="px-2 text-xs text-muted-foreground sm:px-8">
              <LoginCardDescription />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 ">
            <LoginForm
              initialEmail={autoFillEmail}
              initialPassword={autoFillPassword}
            />
            <p className="text-center text-sm pt-2">
              <Link
                href="/signup"
                className="text-muted-foreground cursor-pointer text-xs hover:underline"
              >
                <LoginNoAccountLink />
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function LoginPageInner() {
  const searchParams = useSearchParams();
  const [autoFillEmail, setAutoFillEmail] = useState<string>("");
  const [autoFillPassword, setAutoFillPassword] = useState<string>("");
  const showConfirmedMessage = searchParams.get("confirmed") === "1";
  const showEmailAlreadyRegistered = searchParams.get("error") === "email_already_registered";

  const handleAutoFill = (email: string, password: string) => {
    setAutoFillEmail(email);
    setAutoFillPassword(password);
  };

  return (
    <LoginContent
      autoFillEmail={autoFillEmail}
      autoFillPassword={autoFillPassword}
      onAutoFill={handleAutoFill}
      showConfirmedMessage={showConfirmedMessage}
      showEmailAlreadyRegistered={showEmailAlreadyRegistered}
    />
  );
}
