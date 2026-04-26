import { getTranslations } from "next-intl/server";
import { getBlogCategories } from "@/lib/actions/blog-category-actions";
import { BlogCategoriesList } from "./blog-categories-list";

export const dynamic = "force-dynamic";

export default async function BlogCategoriesPage() {
  const categories = await getBlogCategories();
  const t = await getTranslations("blog");

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("categoriesTitle")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("categoriesPageDescription")}
          </p>
        </div>
      </div>

      <BlogCategoriesList initialCategories={categories} />
    </div>
  );
}
