import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appointments, invoices, patients, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CreateInvoiceForm } from "../../billing/new/create-invoice-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateWithLocale } from "@/lib/preferences/format";
import { DEFAULT_LOCALE, VALID_LOCALES, type LocaleCode } from "@/lib/preferences/constants";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "receptionist") redirect("/dashboard/invoices");

  const { appointmentId } = await searchParams;
  const cookieStore = await cookies();
  const preferredLocale = (cookieStore.get("preferred_locale")?.value ?? DEFAULT_LOCALE) as string;
  const locale: LocaleCode = (VALID_LOCALES as readonly string[]).includes(preferredLocale) ? (preferredLocale as LocaleCode) : DEFAULT_LOCALE;

  const t = await getTranslations("invoices");

  if (!appointmentId) {
    const completed = await db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        patientName: patients.fullName,
        doctorName: users.fullName,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .where(eq(appointments.status, "completed"));

    const withInvoice = await db.select({ appointmentId: invoices.appointmentId }).from(invoices);
    const idsWithInvoice = new Set(withInvoice.map((r) => r.appointmentId));
    const available = completed.filter((a) => !idsWithInvoice.has(a.id));

    return (
      <div className="space-y-6 max-w-lg">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/invoices">{t("newPageBackToInvoices")}</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{t("newPageCreateInvoice")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("newPageSelectAppointment")}</p>
          </CardHeader>
          <CardContent>
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("newPageNoCompleted")}</p>
            ) : (
              <ul className="divide-y">
                {available.map((apt) => (
                  <li key={apt.id} className="py-2">
                    <Link
                      href={`/dashboard/invoices/new?appointmentId=${apt.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {apt.patientName} · {apt.doctorName} · {formatDateWithLocale(apt.startTime, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const [apt] = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      status: appointments.status,
      patientName: patients.fullName,
      doctorName: users.fullName,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(appointments.doctorId, users.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!apt || apt.status !== "completed") redirect("/dashboard/invoices/new");

  const [existing] = await db.select().from(invoices).where(eq(invoices.appointmentId, appointmentId)).limit(1);
  if (existing) redirect("/dashboard/invoices");

  return (
    <div className="space-y-6 max-w-lg">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/invoices/new">{t("newPageBack")}</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{t("newPageNewInvoice")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {apt.patientName} · {apt.doctorName} · {formatDateWithLocale(apt.startTime, locale)}
          </p>
        </CardHeader>
        <CardContent>
          <CreateInvoiceForm appointmentId={appointmentId} />
        </CardContent>
      </Card>
    </div>
  );
}
