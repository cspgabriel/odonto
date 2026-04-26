"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useState } from "react";
import { toast } from "sonner";

export interface TableActionsProps {
  editHref?: string;
  onDelete?: () => Promise<{ success: boolean; error?: string }>;
  deleteLabel?: string;
  deleteDescription?: string;
  title?: string;
}

export function TableActions({
  editHref,
  onDelete,
  deleteLabel = "Delete",
  deleteDescription = "This action cannot be undone.",
  title,
}: TableActionsProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      const result = await onDelete();
      if (result.success) {
        toast.success(tCommon("deletedSuccess"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    if (editHref) router.push(editHref);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer shrink-0">
            <MoreHorizontal className="h-3.5 w-3.5" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {editHref && (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2"
              onSelect={(e) => {
                e.preventDefault();
                handleEdit();
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
              onSelect={(e) => {
                e.preventDefault();
                setOpen(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {onDelete && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{deleteLabel}</AlertDialogTitle>
              <AlertDialogDescription>
                {title ? `Delete "${title}"? ${deleteDescription}` : deleteDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
