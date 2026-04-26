"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteBlogPost } from "@/lib/actions/blog-actions";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeletePostButton({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted?: () => void;
}) {
  const t = useTranslations("blog");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(() => {
      deleteBlogPost(id)
        .then(() => {
          toast.success(t("toastPostDeleted"));
          onDeleted?.();
        })
        .catch((err) => toast.error(err.message || t("toastSomethingWentWrong")));
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">{t("delete")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deletePostTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deletePostDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tCommon("cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isPending}
            className="min-w-[100px]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("deleting")}
              </>
            ) : (
              t("deletePost")
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
