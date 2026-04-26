"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { AddInventorySheet } from "./add-inventory-sheet";

export function AddInventoryButton({
  variant = "default",
  size,
  className,
  children,
}: {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("inventory");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children ?? t("addItem")}
      </Button>
      <AddInventorySheet open={open} onOpenChange={setOpen} />
    </>
  );
}
