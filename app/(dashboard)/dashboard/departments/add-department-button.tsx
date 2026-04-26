"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { AddDepartmentDialog } from "./add-department-dialog";

export function AddDepartmentButton({
  variant = "default",
  size,
  className,
  children,
  staffCount = 0,
}: {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  staffCount?: number;
}) {
  const t = useTranslations("departments");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children ?? t("addDepartment")}
      </Button>
      <AddDepartmentDialog
        open={open}
        onOpenChange={setOpen}
        staffCount={staffCount}
      />
    </>
  );
}
