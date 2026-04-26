import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Construction } from "lucide-react";

export default async function NewPayrollPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "receptionist") {
    redirect("/dashboard");
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/payroll">← Payroll</Link>
          </Button>
        </div>
        <h1 className="dashboard-page-title font-heading">Add Payroll Entry</h1>
        <p className="dashboard-page-description text-muted-foreground">
          Create payroll entry form is coming soon.
        </p>
      </div>
      <Card className="rounded-[var(--radius)] border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <Construction className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            New payroll entry creation will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/dashboard/payroll">Back to Payroll</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
