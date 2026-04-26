import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getBlogPosts } from "@/lib/actions/blog-actions";
import { BlogList } from "./blog-list";
import { BlogSearch } from "./blog-search";
import { BlogPageActions } from "./blog-page-actions";
import { TablePagination } from "@/components/dashboard/table-pagination";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

interface BlogPageSearchParams {
  q?: string;
  page?: string;
  pageSize?: string;
  status?: "all" | "published" | "draft";
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<BlogPageSearchParams>;
}) {
  const params = await searchParams;
  const { q, page: pageParam, pageSize: pageSizeParam, status } = params;
  const search = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(pageSizeParam ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE)
  );
  const statusFilter =
    status && (status === "published" || status === "draft") ? status : "all";

  const { data: posts, meta } = await getBlogPosts(
    page,
    pageSize,
    search || undefined,
    statusFilter
  );
  const totalCount = meta.total;
  const t = await getTranslations("blog");

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("pageDescription")}
          </p>
        </div>
        <BlogPageActions />
      </div>

      <BlogList
        posts={posts}
        searchContent={<BlogSearch defaultValue={search} pageSize={pageSize} />}
        createAction={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/blog/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("createPost")}
            </Link>
          </Button>
        }
      >
        {totalCount > 0 && (
          <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
            <TablePagination
              totalCount={totalCount}
              currentPage={page}
              pageSize={pageSize}
              basePath="/dashboard/blog"
            />
          </div>
        )}
      </BlogList>
    </div>
  );
}
