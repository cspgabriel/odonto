"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLogo } from "@/components/auth-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { verifyAndActivateLicense } from "@/lib/actions/license-actions";

export default function SetupPage() {
  const router = useRouter();
  const [purchaseCode, setPurchaseCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = purchaseCode.trim();
    if (!code) {
      setError("Please enter your purchase code.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyAndActivateLicense(code);
      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(result.error ?? "Activation failed. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mx-auto w-full max-w-md">
        <Card className="border-border bg-card pb-4 shadow-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="mb-1 flex items-center justify-center rounded-xl">
                  <AuthLogo size={80} showLink={false} useFullLogo={false} />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-foreground">
              Activate CareNova
            </CardTitle>
            <CardDescription className="px-2 text-xs text-muted-foreground sm:px-8">
              Enter the local test code to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                  value={purchaseCode}
                  onChange={(e) => setPurchaseCode(e.target.value)}
                  disabled={isLoading}
                  aria-label="Purchase code"
                />
                <p className="text-xs text-muted-foreground">
                  Use the local test license code from `.env.local`.
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Activate
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
