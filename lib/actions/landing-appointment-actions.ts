"use server";

import { db } from "@/lib/db";
import { appointments, patients, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "./notification-actions";

export async function submitLandingAppointment(data: {
    name: string;
    phone: string;
    service: string;
    date: string;
}) {
    try {
        // 1. Find or create patient by phone
        let patient = await db.query.patients.findFirst({
            where: eq(patients.phone, data.phone),
        });

        if (!patient) {
            const [newPatient] = await db.insert(patients).values({
                fullName: data.name,
                phone: data.phone,
                dateOfBirth: "1900-01-01", // Placeholder
            }).returning();
            patient = newPatient;
        }

        // 2. Assign to a doctor (find the first available doctor, or fallback to any user)
        let doctor = await db.query.users.findFirst({
            where: eq(users.role, "doctor"),
        });

        if (!doctor) {
            doctor = await db.query.users.findFirst();
        }

        if (!doctor || !patient) {
            throw new Error("Unable to process appointment");
        }

        // 3. Create Start/End time (assume requested date at 09:00 AM)
        const startTime = new Date(`${data.date}T09:00:00`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour

        // 4. Create pending appointment
        await db.insert(appointments).values({
            patientId: patient.id,
            doctorId: doctor.id,
            startTime,
            endTime,
            status: "pending",
            notes: `Service requested from landing page: ${data.service}`,
        });

        // 5. Send notification to all admins
        await createNotification(
            "appointment",
            "New Appointment Request",
            `${data.name} requested a ${data.service} on ${data.date}. Phone: ${data.phone}`,
            "/dashboard/appointments"
        );

        return { success: true };
    } catch (error) {
        console.error("Failed to submit landing appointment:", error);
        return { success: false, error: "Failed to submit appointment" };
    }
}
