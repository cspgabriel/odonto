"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getLabVendors } from "@/lib/actions/lab-vendor-actions";
import { CreateInventoryForm } from "./new/create-inventory-form";

interface AddInventorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddInventorySheet({ open, onOpenChange }: AddInventorySheetProps) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setVendorsLoading(true);
      getLabVendors()
        .then((result) => {
          if (result.success && result.data) {
            setVendors(result.data.map((v) => ({ id: v.id, name: v.name ?? "" })));
          }
        })
        .finally(() => setVendorsLoading(false));
    }
  }, [open]);

  const handleSuccess = () => {
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[500px] sm:max-w-[500px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white">
            {t("addItemTitle")}
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500 dark:text-slate-400">
            {t("addItemDescription")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {vendorsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="text-sm font-medium">{tCommon("loading")}</p>
            </div>
          ) : (
            <CreateInventoryForm
              vendors={vendors}
              onSuccess={handleSuccess}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
