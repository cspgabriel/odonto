import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { PendingApprovalCard } from "@/app/(auth)/login/_components/pending-approval-card";
import { LoginPageInner } from "@/app/(auth)/login/_components/login-page-inner";

type LoginPageProps = {
  searchParams: Promise<{ pending?: string; confirmed?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const appUser = await getCurrentUser();

  const isPendingApproval =
    (appUser != null && appUser.role !== "admin" && appUser.approvedAt == null) ||
    params.pending === "1";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      {isPendingApproval ? (
        <PendingApprovalCard />
      ) : (
        <Suspense fallback={null}>
          <LoginPageInner />
        </Suspense>
      )}
    </div>
  );
}
