"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export type StatusCount = { name: string; value: number; statusKey?: string };

// Brand colors for circular charts
const BRAND_COLORS = {
  primary: "#3337ff",      // Main brand blue
  mid: "#72a5ff",          // Mid blue
  mid2: "#587dff",         // Mid2 blue
  mid3: "#3f57ff",         // Mid3 blue
  cyan: "#67dcff",         // Cyan
  light: "#c6daff",        // Light blue
  deep: "#2720ff",         // Deep blue
};

const STATUS_COLORS: Record<string, string> = {
  pending: BRAND_COLORS.mid,        // Mid blue
  confirmed: BRAND_COLORS.primary,   // Primary brand blue
  completed: BRAND_COLORS.cyan,      // Cyan
  cancelled: BRAND_COLORS.mid3,      // Mid3 blue
};

export function AppointmentStatusChart({
  data,
  title = "Appointment Status",
  subtitle = "Distribution of appointment statuses.",
  noAppointmentsLabel = "No appointments yet.",
}: {
  data: StatusCount[];
  title?: string;
  subtitle?: string;
  noAppointmentsLabel?: string;
}) {
  const tCommon = useTranslations("common");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  const chartData = data
    .filter((d) => d.value > 0)
    .map((d) => ({
      ...d,
      percentage: total > 0 ? ((d.value / total) * 100).toFixed(0) : "0",
    }));

  return (
    <Card className="card-hover dashboard-chart-card group relative transition-all duration-200 py-0 select-none" tabIndex={-1}>
      <CardHeader className="pt-4 pb-2">
        <CardTitle className="text-base font-semibold font-heading">{title}</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[280px] min-h-[200px] w-full min-w-0" style={{ minHeight: 200 }}>
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {tCommon("loading")}
            </div>
          ) : total === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {noAppointmentsLabel}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  animationDuration={800}
                  stroke="transparent"
                >
                  {chartData.map((entry, index) => {
                    const brandColorArray = [
                      BRAND_COLORS.primary,
                      BRAND_COLORS.mid,
                      BRAND_COLORS.mid2,
                      BRAND_COLORS.mid3,
                      BRAND_COLORS.cyan,
                      BRAND_COLORS.light,
                      BRAND_COLORS.deep,
                    ];
                    const colorKey = (entry as StatusCount & { statusKey?: string }).statusKey ?? entry.name.toLowerCase();
                    return (
                      <Cell
                        key={entry.name + index}
                        fill={
                          STATUS_COLORS[colorKey] ??
                          brandColorArray[index % brandColorArray.length]
                        }
                        stroke="transparent"
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-lg">
                        <p className="text-xs text-muted-foreground mb-1">{data?.name}</p>
                        <p className="text-sm font-semibold">
                          {data?.value} ({data?.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={60}
                  iconType="circle"
                  formatter={(value, entry: any) => (
                    <span className="text-xs text-muted-foreground">
                      {value} ({entry.payload.percentage}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
