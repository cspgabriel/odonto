"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { markInvoicePaid } from "@/lib/actions/invoice-actions";
import { Button } from "@/components/ui/button";

export function MarkInvoicePaidButton({ invoiceId, onSuccess }: { invoiceId: string; onSuccess?: () => void }) {
  const router = useRouter();
  const t = useTranslations("billing");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await markInvoicePaid({ invoiceId });
        if (result.success) {
          toast.success(t("markPaidSuccess"));
          router.refresh();
          onSuccess?.();
        } else {
          toast.error(result.error || t("markPaidFailed"));
        }
      } catch {
        toast.error(t("markPaidActionFailed"));
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      isLoading={isPending}
    >
      {t("markAsPaid")}
    </Button>
  );
}
