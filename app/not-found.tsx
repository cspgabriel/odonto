import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home, LayoutDashboard, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h1 className="font-heading text-6xl font-semibold tracking-tight text-foreground">
            404
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            This page could not be found.
          </p>
        </div>

        <Card className="border-border/50 text-left">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">
              What you can do
            </CardTitle>
            <CardDescription>
              The link may be broken or the page may have been moved. Use one of
              the options below to get back on track.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild className="gap-2">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Go to Home
              </Link>
            </Button>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          CareNova – Clinic Management
        </p>
      </div>
    </div>
  );
}
