import { getTranslations } from "next-intl/server";
import { getBlogCategories } from "@/lib/actions/blog-category-actions";
import { BlogPostForm } from "../post-form";

export default async function NewBlogPostPage() {
  const t = await getTranslations("blog");
  const categories = await getBlogCategories();
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("createNewPost")}</h2>
      </div>
      <BlogPostForm categories={categories} />
    </div>
  );
}
