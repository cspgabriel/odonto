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

export type ActivityMonth = { month: string; appointments: number };

export function ActivityChart({
  data,
  title = "Activity (Appointments)",
  subtitle = "Appointments per month (last 12 months).",
}: {
  data: ActivityMonth[];
  title?: string;
  subtitle?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Card className="card-hover dashboard-chart-card group relative transition-all duration-200 py-0 select-none" tabIndex={-1}>
      <CardHeader className="pt-4 pb-2">
        <CardTitle className="text-base font-semibold font-heading">{title}</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
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
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#67dcff" stopOpacity={1} />
                    <stop offset="100%" stopColor="#72a5ff" stopOpacity={0.6} />
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
                  width={32}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-lg">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className="text-sm font-semibold">
                          {Number(payload[0]?.value ?? 0)} appointments
                        </p>
                      </div>
                    );
                  }}
                  cursor={false}
                />
                <Bar
                  dataKey="appointments"
                  fill="url(#activityGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
