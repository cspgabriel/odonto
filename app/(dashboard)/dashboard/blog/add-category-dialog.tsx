"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createBlogCategory } from "@/lib/actions/blog-category-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { toast } from "sonner";

const DEFAULT_BADGE_HEX = "#1E88E5";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCategoryDialog({ open, onOpenChange }: AddCategoryDialogProps) {
  const t = useTranslations("blog");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName("");
      setDescription("");
      setColor("");
    }
    onOpenChange(next);
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
        await createBlogCategory({
          name: trimmedName,
          description: description.trim() || null,
          color: color.trim() || null,
        });
        toast.success(t("toastPostCreated"));
        handleOpenChange(false);
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error(t("toastFailedToCreatePost"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("addCategory")}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            {t("categoriesPageDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-cat-name">{t("categoryName")}</Label>
            <Input
              id="add-cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("categoryNamePlaceholder")}
              className="h-10 rounded-lg"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-cat-desc">{t("categoryDescription")}</Label>
            <Textarea
              id="add-cat-desc"
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
                id="add-cat-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder={t("categoryColorPlaceholder")}
                className="h-10 rounded-lg flex-1 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("categoryColorDescription")}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("addCategory")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
