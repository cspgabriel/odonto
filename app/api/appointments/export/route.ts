import { db } from "@/lib/db";
import { appointments, patients, users } from "@/lib/db/schema";
import { ilike, or, and, eq, desc, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/actions/permission-actions";

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    const canExport = await hasPermission(user.role, "appointments.export");
    if (!canExport) return new NextResponse("Forbidden", { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");
    const dateFilter = searchParams.get("date");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    let dateCondition = undefined;
    if (dateFilter === "today") {
        dateCondition = and(gte(appointments.startTime, startOfToday), lte(appointments.startTime, endOfToday));
    } else if (dateFilter === "tomorrow") {
        dateCondition = and(gte(appointments.startTime, startOfTomorrow), lte(appointments.startTime, endOfTomorrow));
    } else if (dateFilter === "this_week") {
        dateCondition = and(gte(appointments.startTime, startOfToday), lte(appointments.startTime, endOfWeek));
    }

    const baseConditions = [
        doctorId ? eq(appointments.doctorId, doctorId) : undefined,
        status && status !== "all" ? eq(appointments.status, status as any) : undefined,
        dateCondition,
    ].filter(Boolean) as any[];

    const searchCondition = search
        ? or(
            ilike(patients.fullName, `%${search}%`),
            ilike(users.fullName, `%${search}%`)
        )
        : undefined;

    const whereClause =
        baseConditions.length > 0
            ? searchCondition
                ? and(...baseConditions, searchCondition)
                : and(...baseConditions)
            : searchCondition ?? undefined;

    const list = await db
        .select({
            id: appointments.id,
            startTime: appointments.startTime,
            endTime: appointments.endTime,
            status: appointments.status,
            notes: appointments.notes,
            patientName: patients.fullName,
            doctorName: users.fullName,
        })
        .from(appointments)
        .leftJoin(patients, eq(appointments.patientId, patients.id))
        .leftJoin(users, eq(appointments.doctorId, users.id))
        .where(whereClause)
        .orderBy(desc(appointments.startTime));

    const headers = [
        "ID",
        "Patient Name",
        "Doctor Name",
        "Start Time",
        "End Time",
        "Status",
        "Notes",
    ];

    const rows = list.map((a) => [
        a.id,
        a.patientName || "",
        a.doctorName || "",
        a.startTime ? new Date(a.startTime).toISOString() : "",
        a.endTime ? new Date(a.endTime).toISOString() : "",
        a.status,
        (a.notes || "").replace(/,/g, " "),
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="appointments_export_${new Date().getTime()}.csv"`,
            "Cache-Control": "no-store",
        },
    });
}
