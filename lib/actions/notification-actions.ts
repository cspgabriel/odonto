"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getNotifications(limit: number = 20) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    return db.query.notifications.findMany({
        where: or(
            eq(notifications.userId, user.id),
            isNull(notifications.userId)
        ),
        orderBy: desc(notifications.createdAt),
        limit,
    });
}

export async function getUnreadNotificationsCount() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return 0;
    }

    const result = await db.query.notifications.findMany({
        where: and(
            or(
                eq(notifications.userId, user.id),
                isNull(notifications.userId)
            ),
            eq(notifications.isRead, false)
        ),
        columns: { id: true }
    });

    return result.length;
}

export async function markNotificationAsRead(id: string) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    await db.update(notifications)
        .set({ isRead: true })
        .where(
            and(
                eq(notifications.id, id),
                or(eq(notifications.userId, user.id), isNull(notifications.userId))
            )
        );

    revalidatePath("/", "layout");
    return { success: true };
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    await db.update(notifications)
        .set({ isRead: true })
        .where(
            and(
                or(eq(notifications.userId, user.id), isNull(notifications.userId)),
                eq(notifications.isRead, false)
            )
        );

    revalidatePath("/", "layout");
    return { success: true };
}

export async function createNotification(type: string, title: string, message: string, link: string | null = null, userId: string | null = null) {
    await db.insert(notifications).values({
        userId,
        type,
        title,
        message,
        link,
    });
    revalidatePath("/", "layout");
    return { success: true };
}

export async function deleteNotification(id: string) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    await db.delete(notifications)
        .where(
            and(
                eq(notifications.id, id),
                or(eq(notifications.userId, user.id), isNull(notifications.userId))
            )
        );

    revalidatePath("/", "layout");
    return { success: true };
}
