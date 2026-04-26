import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LucideIcon } from "lucide-react";

/** Real UI shell with shimmer only on data placeholders */
interface StatCardConfig {
  label: string;
  icon: LucideIcon;
  /** Simple = one data line; full = data + secondary line */
  variant?: "simple" | "full";
}

interface PageSkeletonProps {
  pageTitle: string;
  pageDescription: string;
  /** Header button label (shimmer on button, not on text) */
  buttonLabel?: string;
  statCards: StatCardConfig[];
  tableHeaders: string[];
  tableRows?: number;
}

export function PageSkeleton({
  pageTitle,
  pageDescription,
  buttonLabel = "Add",
  statCards,
  tableHeaders,
  tableRows = 6,
}: PageSkeletonProps) {
  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      {/* Header – real UI; button is disabled/deactivated */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {pageTitle}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {pageDescription}
          </p>
        </div>
        <Button disabled className="shrink-0 h-9 px-4 opacity-60 cursor-not-allowed">
          {buttonLabel}
        </Button>
      </div>

      {/* Stats – real Cards, real labels, shimmer only on data */}
      <div
        className={`grid gap-3 ${
          statCards.length === 1
            ? "grid-cols-1"
            : statCards.length === 2
              ? "grid-cols-1 md:grid-cols-2"
              : statCards.length === 3
                ? "grid-cols-1 md:grid-cols-3"
                : "grid-cols-1 md:grid-cols-4"
        }`}
      >
        {statCards.map(({ label, icon: Icon, variant = "full" }) => (
          <Card
            key={label}
            className="group relative transition-all duration-200 border-border/50 py-0"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <div className="rounded-lg bg-muted p-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Skeleton className="h-8 w-14 rounded" />
              {variant === "full" ? (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">—</span>
                  <Skeleton className="h-3 w-8 rounded" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">—</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table – real structure, real headers, shimmer only in data cells */}
      <div className="space-y-4">
        <div className="flex h-10 w-full max-w-md items-center rounded-md border border-input bg-background px-3">
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <div className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent">
                {tableHeaders.map((h) => (
                  <TableHead
                    key={h}
                    className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: tableRows }).map((_, i) => (
                <TableRow
                  key={i}
                  className="border-slate-200/60 dark:border-slate-800/60"
                >
                  {tableHeaders.map((_) => (
                    <TableCell key={_} className="py-4">
                      <Skeleton className="h-4 w-full max-w-[120px] rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 rounded-b-lg">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">—</span>
            <div className="flex items-center gap-2">
              <Button disabled variant="outline" size="icon" className="h-8 w-8 opacity-50" />
              <Button disabled variant="outline" size="icon" className="h-8 w-8 opacity-50" />
              <Button disabled variant="outline" size="sm" className="h-8 opacity-50">
                —
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
