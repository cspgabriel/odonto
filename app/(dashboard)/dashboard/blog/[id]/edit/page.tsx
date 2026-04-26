import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getBlogPostById } from "@/lib/actions/blog-actions";
import { getBlogCategories } from "@/lib/actions/blog-category-actions";
import { BlogPostForm } from "../../post-form";
import { getAdminCommentsByPostId } from "@/lib/actions/blog-actions";
import { PostComments } from "./post-comments";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("blog");
  const [post, categories] = await Promise.all([
    getBlogPostById(id),
    getBlogCategories(),
  ]);
  const comments = await getAdminCommentsByPostId(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("editPost")}</h2>
      </div>
      <BlogPostForm
        categories={categories}
        initialData={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || "",
          content: post.content || "",
          coverImage: post.coverImage || "",
          categoryId: post.categoryId || null,
          tags: post.tags || "",
          published: post.published ?? false,
          seoTitle: post.seoTitle || "",
          seoDescription: post.seoDescription || "",
          commentsEnabled: post.commentsEnabled ?? true,
          customAuthorName: post.customAuthorName || "",
          readingTime: post.readingTime || 5,
        }}
      />
      <div className="mt-8">
        <PostComments initialComments={comments.map(c => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        }))} />
      </div>
    </div>
  );
}
