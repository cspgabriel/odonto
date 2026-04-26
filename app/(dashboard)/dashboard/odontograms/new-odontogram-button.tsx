"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const CreateOdontogramModal = dynamic(
  () => import("./create-odontogram-modal").then((mod) => mod.CreateOdontogramModal),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" />,
    ssr: false,
  }
);

export function NewOdontogramButton() {
  const t = useTranslations("odontograms");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" /> {t("newOdontogram")}
      </Button>
      <CreateOdontogramModal open={open} onOpenChange={setOpen} />
    </>
  );
}
