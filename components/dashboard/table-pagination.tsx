"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = [10, 25, 50, 100] as const;

export function TablePagination({
  totalCount,
  currentPage,
  pageSize,
  basePath,
}: {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  basePath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("common");
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  function buildUrl(updates: { page?: number; pageSize?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    const newPage = updates.page ?? currentPage;
    const newPageSize = updates.pageSize ?? pageSize;
    params.set("page", String(newPage));
    params.set("pageSize", String(newPageSize));
    return `${basePath}?${params.toString()}`;
  }

  function goToPage(page: number) {
    router.push(buildUrl({ page }));
  }

  function onPageSizeChange(value: string) {
    router.push(buildUrl({ pageSize: Number(value), page: 1 }));
  }

  if (totalCount === 0) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-3">
      <p className="text-sm text-muted-foreground">
        {t("showingXOfY", { from: String(from), to: String(to), total: String(totalCount) })}
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">{t("rowsPerPage")}</span>
          <Select
            value={String(pageSize)}
            onValueChange={onPageSizeChange}
          >
            <SelectTrigger className="w-[70px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t("pageXOfY", { current: String(currentPage), total: String(totalPages) })}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label={t("previousPage")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label={t("nextPage")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
