"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  ClipboardList,
  LogOut,
  Monitor,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth-actions";
import type { UserRole } from "@/lib/auth";
import { useState } from "react";

const navItems: { href: string; label: string; icon: React.ElementType; roles: UserRole[] }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "doctor", "receptionist", "nurse"] },
  { href: "/dashboard/patients", label: "Patients", icon: Users, roles: ["admin", "doctor", "receptionist", "nurse"] },
  { href: "/dashboard/appointments", label: "Appointments", icon: Calendar, roles: ["admin", "doctor", "receptionist", "nurse"] },
  { href: "/dashboard/billing", label: "Billing", icon: FileText, roles: ["admin", "receptionist"] },
  { href: "/dashboard/blog", label: "Blog / News", icon: ClipboardList, roles: ["admin", "doctor"] },
  { href: "/dashboard/blog/categories", label: "Blog Categories", icon: ClipboardList, roles: ["admin", "doctor"] },
  { href: "/dashboard/clinical", label: "Clinical (soon)", icon: ClipboardList, roles: ["admin", "doctor", "receptionist", "nurse"] },
];

const demoItems = [
  { href: "/?clinic=dental", label: "Dental" },
  { href: "/?clinic=general", label: "General" },
  { href: "/?clinic=ophthalmology", label: "Ophthalmology" },
  { href: "/login", label: "Dashboard (Login)" },
];

export function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [demosOpen, setDemosOpen] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r bg-card p-4 flex flex-col">
      <div className="mb-6">
        <Link href="/dashboard" className="text-lg font-semibold text-foreground">
          CareNova
        </Link>
      </div>
      <nav className="flex flex-col gap-1">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setDemosOpen((prev) => !prev)}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
        >
          <Monitor className="h-4 w-4" />
          <span className="flex-1">Demos</span>
          {demosOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {demosOpen && (
          <div className="ml-4 flex flex-col gap-1">
            {demoItems.map((item) => (
              <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </nav>
      <div className="mt-auto pt-4 border-t">
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full justify-start gap-3">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
