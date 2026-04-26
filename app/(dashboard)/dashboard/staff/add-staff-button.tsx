"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CreateStaffForm } from "./new/create-staff-form";
import { UserPlus } from "lucide-react";

export function AddStaffButton({
  variant = "default",
  size,
  className,
  children,
  departments,
}: {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  departments: { id: string; name: string }[];
}) {
  const t = useTranslations("staff");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        {children ?? t("addStaff")}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
        >
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
              {t("addNewStaff")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <CreateStaffForm
              departments={departments}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
