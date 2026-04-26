import { db } from "@/lib/db";
import { patients } from "@/lib/db/schema";
import { ilike, or, and, eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/actions/permission-actions";

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    const canExport = await hasPermission(user.role, "patients.export");
    if (!canExport) return new NextResponse("Forbidden", { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const gender = searchParams.get("gender");
    const bg = searchParams.get("bg");

    const whereClause = and(
        search
            ? or(
                ilike(patients.fullName, `%${search}%`),
                ilike(patients.phone, `%${search}%`)
            )
            : undefined,
        gender && gender !== "all" ? eq(patients.gender, gender as string) : undefined,
        bg && bg !== "all" ? eq(patients.bloodGroup, bg as string) : undefined
    );

    const list = await db
        .select()
        .from(patients)
        .where(whereClause)
        .orderBy(desc(patients.createdAt));

    const headers = [
        "ID",
        "Full Name",
        "Email",
        "Phone",
        "Date of Birth",
        "Gender",
        "Blood Group",
        "Address",
        "Created At",
    ];

    const rows = list.map((p) => [
        p.id,
        p.fullName,
        p.email || "",
        p.phone,
        p.dateOfBirth || "",
        p.gender || "",
        p.bloodGroup || "",
        (p.address || "").replace(/,/g, " "),
        p.createdAt ? new Date(p.createdAt).toISOString() : "",
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="patients_export_${new Date().getTime()}.csv"`,
            "Cache-Control": "no-store",
        },
    });
}
