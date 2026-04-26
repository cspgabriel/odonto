"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PlusCircle, Tag } from "lucide-react";
import { AddCategoryDialog } from "./add-category-dialog";

export function BlogPageActions() {
  const t = useTranslations("blog");
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <Button
        type="button"
        variant="outline"
        className="h-9 px-4 text-sm font-semibold rounded-md"
        onClick={() => setAddCategoryOpen(true)}
      >
        <Tag className="mr-2 h-4 w-4" />
        {t("addCategory")}
      </Button>
      <Button asChild className="h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md">
        <Link href="/dashboard/blog/new">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("createPost")}
        </Link>
      </Button>
      <AddCategoryDialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
    </div>
  );
}
