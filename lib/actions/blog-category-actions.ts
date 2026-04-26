"use server";

import { db } from "@/lib/db";
import { blogCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { blogCategorySchema, type BlogCategoryFormValues } from "@/lib/validations/blog";
import { BADGE_COLORS } from "@/lib/constants/blog";

function pickRandomColor(): string {
  return BADGE_COLORS[Math.floor(Math.random() * BADGE_COLORS.length)];
}

function normalizeColor(input: string | null | undefined): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`;
  return null;
}

export async function getBlogCategories() {
  return db.query.blogCategories.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}

export async function createBlogCategory(data: BlogCategoryFormValues) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const validated = blogCategorySchema.parse(data);
  const color = normalizeColor(validated.color) ?? pickRandomColor();

  const [row] = await db
    .insert(blogCategories)
    .values({
      name: validated.name.trim(),
      description: validated.description?.trim() || null,
      color,
      updatedAt: new Date(),
    })
    .returning();

  revalidatePath("/dashboard/blog", "layout");
  revalidatePath("/dashboard/blog/categories");
  return { success: true, data: row };
}

export async function updateBlogCategory(id: string, data: BlogCategoryFormValues) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const validated = blogCategorySchema.parse(data);
  const existing = await db.query.blogCategories.findFirst({ where: eq(blogCategories.id, id) });
  if (!existing) throw new Error("Category not found");

  const color =
    validated.color !== undefined && validated.color !== null && String(validated.color).trim() !== ""
      ? normalizeColor(String(validated.color)) ?? existing.color ?? pickRandomColor()
      : existing.color ?? pickRandomColor();

  await db
    .update(blogCategories)
    .set({
      name: validated.name.trim(),
      description: validated.description?.trim() ?? null,
      color,
      updatedAt: new Date(),
    })
    .where(eq(blogCategories.id, id));

  revalidatePath("/dashboard/blog", "layout");
  revalidatePath("/dashboard/blog/categories");
  return { success: true };
}

export async function deleteBlogCategory(id: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  await db.delete(blogCategories).where(eq(blogCategories.id, id));
  revalidatePath("/dashboard/blog", "layout");
  revalidatePath("/dashboard/blog/categories");
  return { success: true };
}
