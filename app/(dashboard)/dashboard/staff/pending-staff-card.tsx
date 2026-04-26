"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { approveStaffMember, declineStaffMember } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type PendingUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: Date;
};

export function PendingStaffCard({ pending }: { pending: PendingUser[] }) {
  const t = useTranslations("staff");
  const router = useRouter();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  if (pending.length === 0) return null;

  async function handleApprove(userId: string) {
    setApprovingId(userId);
    try {
      const result = await approveStaffMember(userId);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setApprovingId(null);
    }
  }

  async function handleDecline(userId: string) {
    setDecliningId(userId);
    try {
      const result = await declineStaffMember(userId);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setDecliningId(null);
    }
  }

  return (
    <Card className="border-amber-200/60 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 p-1.5">
            <UserCheck className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-base font-heading">{t("pendingTitle")}</CardTitle>
            <CardDescription className="text-xs">{t("pendingDescription")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-2">
          {pending.map((u) => (
            <li
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{u.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer border-destructive/50 text-destructive hover:bg-destructive/10"
                  disabled={approvingId === u.id || decliningId === u.id}
                  onClick={() => handleDecline(u.id)}
                >
                  {decliningId === u.id ? "…" : t("decline")}
                </Button>
                <Button
                  size="sm"
                  className="cursor-pointer"
                  disabled={approvingId === u.id || decliningId === u.id}
                  onClick={() => handleApprove(u.id)}
                >
                  {approvingId === u.id ? "…" : t("approve")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
