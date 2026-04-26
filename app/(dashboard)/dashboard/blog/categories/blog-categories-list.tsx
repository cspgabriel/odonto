"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { PlusCircle, Pencil, Trash2, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { createBlogCategory, updateBlogCategory, deleteBlogCategory } from "@/lib/actions/blog-category-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategoryBadgeColor } from "@/lib/constants/blog";

const DEFAULT_BADGE_HEX = "#1E88E5";

type Category = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function BlogCategoriesList({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const t = useTranslations("blog");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setColor("");
    setSheetOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description || "");
    setColor(c.color || "");
    setSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t("toastFixValidation"));
      return;
    }
    startTransition(async () => {
      try {
        if (editingId) {
          await updateBlogCategory(editingId, { name: trimmedName, description: description.trim() || null, color: color.trim() || null });
          toast.success(t("toastPostUpdated"));
        } else {
          await createBlogCategory({ name: trimmedName, description: description.trim() || null, color: color.trim() || null });
          toast.success(t("toastPostCreated"));
        }
        setSheetOpen(false);
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error(editingId ? t("toastFailedToUpdatePost") : t("toastFailedToCreatePost"));
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteBlogCategory(deleteId);
        toast.success(t("toastPostDeleted"));
        setDeleteId(null);
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error(t("toastSomethingWentWrong"));
      }
    });
  };

  return (
    <>
      {initialCategories.length === 0 ? (
        <EmptyState
          icon={<Folder className="h-6 w-6" />}
          title={t("noCategoriesYet")}
          description={t("createFirstCategory")}
          action={
            <Button onClick={openCreate} className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-md">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("addCategory")}
            </Button>
          }
        />
      ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-row items-center justify-between">
          <Button variant="outline" size="sm" onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("addCategory")}
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent">
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest bg-slate-50/50 dark:bg-slate-900/50">
                {t("categoryName")}
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest bg-slate-50/50 dark:bg-slate-900/50 max-w-[200px] hidden md:table-cell">
                {t("categoryDescription")}
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest bg-slate-50/50 dark:bg-slate-900/50">
                {t("categoryColor")}
              </TableHead>
              <TableHead className="w-[120px] font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest bg-slate-50/50 dark:bg-slate-900/50 text-right">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCategories.map((c) => (
              <TableRow key={c.id} className="border-slate-200/60 dark:border-slate-800/60">
                <TableCell className="py-4 pl-6 align-middle">{c.name}</TableCell>
                <TableCell className="py-4 align-middle max-w-[200px] truncate hidden md:table-cell text-muted-foreground text-sm">
                  {c.description || "—"}
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <span
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: getCategoryBadgeColor(c.id, c.color) }}
                  >
                    {c.color || "Auto"}
                  </span>
                </TableCell>
                <TableCell className="py-4 pr-6 text-right align-middle">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
            <SheetTitle className="text-xl font-black tracking-tight font-heading">
              {editingId ? t("editCategory") : t("addCategory")}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">{t("categoryName")}</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("categoryNamePlaceholder")}
                className="h-10 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">{t("categoryDescription")}</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("categoryDescriptionPlaceholder")}
                className="min-h-[80px] rounded-lg resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("categoryColor")}</Label>
              <div className="flex gap-3 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-10 w-12 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm hover:ring-2 hover:ring-ring"
                      style={{ backgroundColor: color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : DEFAULT_BADGE_HEX }}
                      aria-label={t("categoryColor")}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                    <ColorPicker
                      value={color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : DEFAULT_BADGE_HEX}
                      onChange={(val) => setColor(val)}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  id="cat-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder={t("categoryColorPlaceholder")}
                  className="h-10 rounded-lg flex-1 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("categoryColorDescription")}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("saving") : editingId ? t("updatePost") : t("createPostButton")}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCategoryTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteCategoryDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive text-destructive-foreground">
              {isPending ? t("deleting") : t("deletePost")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
