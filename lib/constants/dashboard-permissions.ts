/**
 * Dashboard widget visibility by role.
 * Same UI layout for all roles; only visible widgets differ.
 * Role comes from public.users (DB) — single source of truth.
 */

export type DashboardWidget =
  | "stats_patients"
  | "stats_appointments"
  | "stats_revenue"
  | "stats_staff"
  | "appointments_today"
  | "appointments_upcoming"
  | "patients_recent"
  | "revenue_chart"
  | "revenue_summary"
  | "staff_overview"
  | "inventory_alerts"
  | "quick_actions"
  | "overdue_banner"
  | "appointment_status_chart"
  | "activity_chart"
  | "recent_appointments"
  | "recent_unpaid_invoices";

export type UserRole = "admin" | "doctor" | "receptionist" | "nurse";

export const DASHBOARD_PERMISSIONS: Record<UserRole, DashboardWidget[]> = {
  admin: [
    "stats_patients",
    "stats_appointments",
    "stats_revenue",
    "stats_staff",
    "appointments_today",
    "appointments_upcoming",
    "patients_recent",
    "revenue_chart",
    "revenue_summary",
    "staff_overview",
    "inventory_alerts",
    "quick_actions",
    "overdue_banner",
    "appointment_status_chart",
    "activity_chart",
    "recent_appointments",
    "recent_unpaid_invoices",
  ],
  doctor: [
    "stats_appointments",
    "stats_patients",
    "appointments_today",
    "appointments_upcoming",
    "patients_recent",
    "quick_actions",
  ],
  receptionist: [
    "stats_appointments",
    "stats_patients",
    "appointments_today",
    "appointments_upcoming",
    "patients_recent",
    "quick_actions",
    "recent_unpaid_invoices",
  ],
  nurse: [
    "stats_patients",
    "stats_appointments",
    "appointments_today",
    "patients_recent",
    "inventory_alerts",
    "quick_actions",
  ],
};

export function canViewWidget(
  role: UserRole,
  widget: DashboardWidget
): boolean {
  return DASHBOARD_PERMISSIONS[role]?.includes(widget) ?? false;
}
