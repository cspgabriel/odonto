"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePreferences } from "@/contexts/preferences-context";

export type RevenueMonth = { month: string; revenue: number; expenses?: number };

export function RevenueChart({
  data,
  title = "Revenue Overview",
  subtitle = "Monthly revenue and expenses",
  viewDetailsLabel = "View Details",
}: {
  data: RevenueMonth[];
  title?: string;
  subtitle?: string;
  viewDetailsLabel?: string;
}) {
  const { formatAmount } = usePreferences();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Card className="card-hover dashboard-chart-card group relative transition-all duration-200 py-0 select-none" tabIndex={-1}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
        <div>
          <CardTitle className="text-base font-semibold font-heading">{title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-xl">
          <Link href="/dashboard/billing">{viewDetailsLabel}</Link>
        </Button>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[280px] min-h-[200px] w-full min-w-0" style={{ minHeight: 200 }}>
          {mounted && (
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3337ff" stopOpacity={1} />
                  <stop offset="50%" stopColor="#587dff" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#72a5ff" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatAmount(v)}
                width={60}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const rev = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
                  const exp = payload.find((p) => p.dataKey === "expenses")?.value ?? 0;
                  return (
                    <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-lg">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="text-sm font-semibold text-primary">
                        Revenue: {formatAmount(Number(rev))}
                      </p>
                      {typeof exp === "number" && (
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          Expenses: {formatAmount(Number(exp))}
                        </p>
                      )}
                    </div>
                  );
                }}
                cursor={false}
              />
              <Bar
                dataKey="revenue"
                fill="url(#revenueGradient)"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />
              {data.some((d) => typeof d.expenses === "number" && d.expenses > 0) && (
                <Bar
                  dataKey="expenses"
                  fill="url(#expensesGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
