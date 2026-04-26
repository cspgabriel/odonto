import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, CreditCard } from "lucide-react";

export default function PortalPage() {
  return (
    <>
      <header className="border-b bg-card/50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-foreground hover:underline">
            CareNova
          </Link>
          <nav className="flex gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Staff sign in</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="min-h-screen flex-1 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Patient Portal
          </h1>
          <p className="text-muted-foreground">
            View prescriptions, book appointments, and pay invoices online. Coming in Phase 3.
          </p>
          <Card className="border-dashed text-left">
            <CardHeader>
              <CardTitle className="text-base">Planned features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0" />
                View prescriptions and appointment history
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                Book appointments online
              </p>
              <p className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 shrink-0" />
                Pay invoices securely (Stripe)
              </p>
            </CardContent>
          </Card>
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
