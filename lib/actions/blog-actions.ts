"use server";

import { db } from "@/lib/db";
import { blogPosts, blogComments } from "@/lib/db/schema";
import { eq, desc, ilike, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { blogPostSchema, blogCommentSchema, type BlogPostFormValues, type BlogCommentFormValues } from "@/lib/validations/blog";
import { z } from "zod";

type BlogPost = typeof blogPosts.$inferSelect;

export async function getBlogPosts(
    page: number = 1,
    limit: number = 10,
    query?: string,
    status?: "all" | "published" | "draft"
) {
    if (process.env.NODE_ENV === "development" && process.env.LICENSE_TEST_CODE) {
        return {
            data: [],
            meta: { total: 0, page, limit, totalPages: 0 },
        };
    }

    const offset = (page - 1) * limit;

    const conditions = [];
    if (query) {
        conditions.push(ilike(blogPosts.title, `%${query}%`));
    }
    if (status === "published") {
        conditions.push(eq(blogPosts.published, true));
    } else if (status === "draft") {
        conditions.push(eq(blogPosts.published, false));
    }

    const whereClause = conditions.length > 0
        ? sql.join(conditions, sql` AND `)
        : undefined;

    const data = await db.query.blogPosts.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: desc(blogPosts.createdAt),
        with: {
            author: true,
            category: true,
            comments: {
                columns: { id: true, approved: true },
            },
        },
    });

    const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(blogPosts)
        .where(whereClause);

    const total = Number(totalRes[0]?.count || 0);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getBlogPostById(id: string) {
    const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.id, id),
        with: {
            author: true,
            category: true,
            comments: {
                where: eq(blogComments.approved, true),
                orderBy: desc(blogComments.createdAt),
            },
        },
    });
    return post;
}

export async function getBlogPostBySlug(slug: string) {
    const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, slug),
        with: {
            author: true,
            category: true,
            comments: {
                where: eq(blogComments.approved, true),
                orderBy: desc(blogComments.createdAt),
            },
        },
    });
    return post;
}


export async function createBlogPost(data: BlogPostFormValues) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    const validated = blogPostSchema.parse(data);

    let slug = validated.slug;
    if (!slug) {
        slug = validated.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    const existing = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, slug!),
    });
    if (existing) {
        slug = `${slug}-${Date.now()}`;
    }

    const [newPost] = await db.insert(blogPosts).values({
        title: validated.title,
        slug: slug!,
        excerpt: validated.excerpt || null,
        content: validated.content || null,
        coverImage: validated.coverImage || null,
        authorId: user.id,
        customAuthorName: validated.customAuthorName || null,
        categoryId: validated.categoryId || null,
        published: validated.published,
        publishedAt: validated.published ? new Date() : null,
        tags: validated.tags || null,
        seoTitle: validated.seoTitle || null,
        seoDescription: validated.seoDescription || null,
        readingTime: validated.readingTime || null,
        commentsEnabled: validated.commentsEnabled ?? true,
    }).returning();

    revalidatePath("/dashboard/blog", "layout");
    revalidatePath(`/blog/${slug}`, "page");
    revalidatePath("/blog", "page");
    return { success: true, data: newPost };
}

export async function updateBlogPost(id: string, data: BlogPostFormValues) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    const validated = blogPostSchema.parse(data);

    await db.update(blogPosts)
        .set({
            title: validated.title,
            slug: validated.slug || undefined,
            excerpt: validated.excerpt || null,
            content: validated.content || null,
            coverImage: validated.coverImage || null,
            customAuthorName: validated.customAuthorName || null,
            categoryId: validated.categoryId ?? null,
            published: validated.published,
            publishedAt: validated.published ? (sql`COALESCE(published_at, NOW())`) : null,
            tags: validated.tags || null,
            seoTitle: validated.seoTitle || null,
            seoDescription: validated.seoDescription || null,
            readingTime: validated.readingTime || null,
            commentsEnabled: validated.commentsEnabled ?? true,
            updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, id));
    revalidatePath("/dashboard/blog", "layout");
    revalidatePath(`/blog/${validated.slug}`, "page");
    revalidatePath("/blog", "page");
    return { success: true };
}

export async function deleteBlogPost(id: string) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    revalidatePath("/dashboard/blog");
    return { success: true };
}

// ─── Comment Actions ─────────────────────────────────────────────────────────

export async function submitComment(data: BlogCommentFormValues) {
    const validated = blogCommentSchema.parse(data);

    // Verify post exists and comments are enabled
    const post = await db.query.blogPosts.findFirst({
        where: and(
            eq(blogPosts.id, validated.postId),
            eq(blogPosts.commentsEnabled, true),
        ),
    });

    if (!post) {
        throw new Error("Post not found or comments are disabled.");
    }

    const [comment] = await db.insert(blogComments).values({
        postId: validated.postId,
        name: validated.name,
        email: validated.email || null,
        content: validated.content,
        approved: false, // new comments require admin approval
    }).returning();

    try {
        const { createNotification } = await import("./notification-actions");
        await createNotification(
            "comment",
            "New Blog Comment",
            `${validated.name} left a comment on "${post.title}". It requires your approval.`,
            `/dashboard/blog/${post.id}/edit`,
            post.authorId
        );
    } catch (err) {
        console.error("Failed to emit notification", err);
    }

    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/dashboard/blog", "layout");
    return { success: true, data: comment };
}

export async function getCommentsByPostId(postId: string) {
    return db.query.blogComments.findMany({
        where: and(
            eq(blogComments.postId, postId),
            eq(blogComments.approved, true),
        ),
        orderBy: desc(blogComments.createdAt),
    });
}

export async function getAdminCommentsByPostId(postId: string) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    return db.query.blogComments.findMany({
        where: eq(blogComments.postId, postId),
        orderBy: desc(blogComments.createdAt),
    });
}

export async function approveComment(commentId: string) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    await db.update(blogComments)
        .set({ approved: true })
        .where(eq(blogComments.id, commentId));

    revalidatePath("/dashboard/blog");
    return { success: true };
}

export async function declineComment(commentId: string) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    await db.delete(blogComments)
        .where(eq(blogComments.id, commentId));

    revalidatePath("/dashboard/blog");
    return { success: true };
}
