import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CreateLabVendorForm } from "./create-lab-vendor-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewLabVendorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    redirect("/dashboard/lab-vendors");
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/lab-vendors">← Lab Vendors</Link>
          </Button>
        </div>
        <h1 className="dashboard-page-title font-heading">Add Lab Vendor</h1>
        <p className="dashboard-page-description text-muted-foreground">
          Register a new laboratory vendor for test reports.
        </p>
      </div>

      <Card className="rounded-[var(--radius)] border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading">Vendor Information</CardTitle>
          <CardDescription>
            Enter the lab vendor details. All fields except name are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateLabVendorForm />
        </CardContent>
      </Card>
    </div>
  );
}
