import { z } from "zod";

export const blogCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  description: z.string().max(500).optional().nullable(),
  color: z.string().max(7).optional().nullable(), // Hex e.g. #0F766E; empty = random
});
export type BlogCategoryFormValues = z.infer<typeof blogCategorySchema>;

export const blogPostSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(255),
    slug: z.string().optional(), // Generated if empty
    excerpt: z.string().max(500).optional().nullable(),
    content: z.string().min(10, "Content is too short").optional().nullable(),
    coverImage: z.string().url().optional().or(z.literal("")).nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    tags: z.string().optional().nullable(), // comma separated
    seoTitle: z.string().max(60).optional().nullable(),
    seoDescription: z.string().max(160).optional().nullable(),
    published: z.boolean().default(false),
    readingTime: z.coerce.number().min(1).max(60).optional().nullable(),
    customAuthorName: z.string().max(100).optional().nullable(),
    commentsEnabled: z.boolean().default(true),
});

export type BlogPostFormValues = z.infer<typeof blogPostSchema>;

export const blogCommentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    content: z.string().min(5, "Comment must be at least 5 characters").max(1000),
    postId: z.string().uuid(),
});

export type BlogCommentFormValues = z.infer<typeof blogCommentSchema>;
