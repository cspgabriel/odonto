import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const METRIC_CARDS = [
  { label: "Today's Appointments", icon: Calendar },
  { label: "Total Patients", icon: Users },
  { label: "Monthly Revenue", icon: DollarSign },
  { label: "Low Stock", icon: AlertTriangle },
] as const;

export function DashboardSkeleton() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title font-heading">Dashboard</h1>
        <p className="dashboard-page-description text-muted-foreground">
          Overview of your clinic performance and activity.
        </p>
      </div>

      {/* Metric cards – real UI, shimmer only on data */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {METRIC_CARDS.map(({ label, icon: Icon }) => (
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
            <CardContent className="space-y-2 px-4 pb-4">
              <div>
                <Skeleton className="h-8 w-14 rounded" />
                <p className="text-xs text-muted-foreground mt-1">—</p>
              </div>
              <div className="flex items-center justify-end">
                <Skeleton className="h-3 w-10 rounded" />
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="skeleton-shimmer h-full w-1/3 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Charts – same grid and card size as real dashboard */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Revenue chart – md:col-span-4, same card and chart height as RevenueChart */}
        <div className="md:col-span-4">
          <Card className="card-hover dashboard-chart-card group relative transition-all duration-200 py-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div>
                <CardTitle className="text-base font-semibold font-heading">
                  Revenue Overview
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monthly revenue (paid invoices)
                </p>
              </div>
              <Button disabled variant="outline" size="sm" className="rounded-xl opacity-50">
                View Details
              </Button>
            </CardHeader>
            <CardContent className="pb-4">
              <div
                className="h-[280px] min-h-[200px] w-full min-w-0 overflow-hidden rounded-md"
                style={{ minHeight: 200 }}
              >
                <div className="skeleton-shimmer h-full w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointment status chart – md:col-span-3, same card and chart height */}
        <div className="md:col-span-3">
          <Card className="card-hover dashboard-chart-card group relative transition-all duration-200 py-0">
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                Appointment Status
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Distribution of appointment statuses.
              </p>
            </CardHeader>
            <CardContent className="pb-4">
              <div
                className="h-[280px] min-h-[200px] w-full min-w-0 overflow-hidden rounded-md flex items-center justify-center"
                style={{ minHeight: 200 }}
              >
                <div className="skeleton-shimmer h-full w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 2b: Activity chart – full width, same card and chart height as ActivityChart */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="card-hover dashboard-chart-card group relative transition-all duration-200 py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-base font-semibold font-heading">
              Activity (Appointments)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Appointments per month — last 12 months.
            </p>
          </CardHeader>
          <CardContent className="pb-4">
            <div
              className="h-[280px] min-h-[200px] w-full min-w-0 overflow-hidden rounded-md"
              style={{ minHeight: 200 }}
            >
              <div className="skeleton-shimmer h-full w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Recent lists – same structure as real dashboard */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="group relative transition-all duration-200 border-border/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold font-heading">
              Recent Appointments
            </CardTitle>
            <span className="flex items-center gap-1 text-xs text-muted-foreground opacity-60">
              View all <ArrowRight className="h-3 w-3" />
            </span>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-xl border border-border/50"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <Skeleton className="h-5 w-16 shrink-0 rounded" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="group relative transition-all duration-200 border-border/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold font-heading">
              Recent Patients
            </CardTitle>
            <span className="flex items-center gap-1 text-xs text-muted-foreground opacity-60">
              View all <ArrowRight className="h-3 w-3" />
            </span>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-xl border border-border/50"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-4 w-36 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-50" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
