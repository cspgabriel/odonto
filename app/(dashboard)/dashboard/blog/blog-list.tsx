"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Eye, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteBlogPost } from "@/lib/actions/blog-actions";
import { DeletePostButton } from "./delete-post-button";

type Author = { fullName: string | null } | null;
type Comment = { id: string; approved: boolean };

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  updatedAt: Date;
  customAuthorName: string | null;
  author: Author;
  comments?: Comment[];
  commentsEnabled: boolean;
};

export function BlogList({
  posts,
  searchContent,
  createAction,
  children,
}: {
  posts: BlogPostRow[];
  searchContent?: React.ReactNode;
  createAction?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations("blog");
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedRows(new Set(posts.map((p) => p.id)));
    else setSelectedRows(new Set());
  };

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedRows);
    const promise = Promise.all(ids.map((id) => deleteBlogPost(id)));
    toast.promise(promise, {
      loading: t("deletingPosts", { count: ids.length }),
      success: () => {
        setSelectedRows(new Set());
        router.refresh();
        return t("postsDeleted");
      },
      error: t("failedToDeletePosts"),
    });
  }, [selectedRows, router, t]);

  const list = posts;

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title={t("noPostsFound")}
        description={t("createPostToGetStarted")}
        action={createAction ?? undefined}
      />
    );
  }

  const authorName = (post: BlogPostRow) =>
    post.customAuthorName ?? (post.author?.fullName ?? "—");
  const commentCount = (post: BlogPostRow) => post.comments?.length ?? 0;
  const hasPendingComments = (post: BlogPostRow) =>
    post.comments?.some((c) => !c.approved) ?? false;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
          {React.isValidElement(searchContent)
            ? React.cloneElement(searchContent as React.ReactElement<{ selectedCount?: number; onDeleteSelected?: () => void; onClearSelection?: () => void }>, {
                selectedCount: selectedRows.size,
                onDeleteSelected: handleBulkDelete,
                onClearSelection: () => setSelectedRows(new Set()),
              })
            : searchContent}
        </div>
      )}

      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            <TableHead className="pl-6 w-[50px]">
              <Checkbox
                checked={selectedRows.size === list.length && list.length > 0}
                onCheckedChange={(checked) => toggleAll(!!checked)}
                className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
              />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2 w-[280px]">
              {t("tableTitle")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              {t("tableAuthor")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              {t("tableComments")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              {t("tableStatus")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
              {t("tableDate")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[120px]">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((post) => (
            <TableRow
              key={post.id}
              className="border-slate-200/60 dark:border-slate-800/60"
            >
              <TableCell className="pl-6 py-4 align-middle">
                <Checkbox
                  checked={selectedRows.has(post.id)}
                  onCheckedChange={() => toggleRow(post.id)}
                  className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                />
              </TableCell>
              <TableCell className="py-4 align-middle pl-2">
                <div className="flex flex-col">
                  <Link
                    href={`/dashboard/blog/${post.id}/edit`}
                    className="hover:underline font-semibold text-foreground"
                  >
                    {post.title}
                  </Link>
                  <span className="text-xs text-muted-foreground truncate max-w-[260px]">
                    {post.excerpt || t("noExcerpt")}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-4 align-middle text-sm font-medium">
                {authorName(post)}
              </TableCell>
              <TableCell className="py-4 align-middle">
                {post.commentsEnabled ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{commentCount(post)}</span>
                    {hasPendingComments(post) && (
                      <span
                        className="flex h-2 w-2 rounded-full bg-red-500"
                        title={t("pending")}
                      />
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    {t("disabled")}
                  </span>
                )}
              </TableCell>
              <TableCell className="py-4 align-middle">
                {post.published ? (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-green-500/15 text-green-700 dark:text-green-400">
                    {t("published")}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">
                    {t("draft")}
                  </span>
                )}
              </TableCell>
              <TableCell className="py-4 align-middle text-muted-foreground text-sm">
                {format(new Date(post.updatedAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="py-4 align-middle pr-6 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                      <span className="sr-only">{t("view")}</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/blog/${post.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{t("edit")}</span>
                    </Link>
                  </Button>
                  <DeletePostButton
                    id={post.id}
                    onDeleted={() => router.refresh()}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {children}
    </div>
  );
}
