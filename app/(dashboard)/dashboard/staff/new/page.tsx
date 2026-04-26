import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDepartments } from "@/lib/actions/department-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateStaffForm } from "./create-staff-form";
import { ArrowLeft } from "lucide-react";

export default async function NewStaffPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const deptResult = await getDepartments();
  const departments = deptResult.success && deptResult.data ? deptResult.data : [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/staff">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <h1 className="dashboard-page-title font-heading">Add staff</h1>
        <p className="dashboard-page-description text-muted-foreground">
          Create a new staff member. They will be able to sign in with the email and password you set.
        </p>
      </div>

      <Card className="rounded-[var(--radius)] border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading">Staff details</CardTitle>
          <CardDescription>Personal info, professional details, and work schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateStaffForm departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}
