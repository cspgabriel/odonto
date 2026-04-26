"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveComment, declineComment } from "@/lib/actions/blog-actions";

type AdminComment = {
  id: string;
  name: string;
  email: string | null;
  content: string;
  approved: boolean;
  createdAt: string | Date;
};

export function PostComments({ initialComments }: { initialComments: AdminComment[] }) {
  const t = useTranslations("blog");
  const [comments, setComments] = useState(initialComments);

  async function handleApprove(id: string) {
    try {
      const res = await approveComment(id);
      if (res.success) {
        setComments(comments.map(c => c.id === id ? { ...c, approved: true } : c));
        toast.success(t("toastCommentApproved"));
      }
    } catch {
      toast.error(t("toastFailedToApprove"));
    }
  }

  async function handleDecline(id: string) {
    if (!confirm(t("confirmDeleteComment"))) return;
    try {
      const res = await declineComment(id);
      if (res.success) {
        setComments(comments.filter(c => c.id !== id));
        toast.success(t("toastCommentDeleted"));
      }
    } catch {
      toast.error(t("toastFailedToDeleteComment"));
    }
  }

  if (comments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("commentsTitle")}</CardTitle>
          <CardDescription>{t("noCommentsYet")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("manageComments", { count: comments.length })}</CardTitle>
        <CardDescription>{t("manageCommentsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{comment.name}</span>
                  {comment.email && (
                    <span className="text-xs text-muted-foreground">&lt;{comment.email}&gt;</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    • {format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                  {!comment.approved && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t("pending")}</Badge>
                  )}
                  {comment.approved && (
                    <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-900 dark:text-green-400">{t("approved")}</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.content}</p>
              </div>
              <div className="flex items-start gap-2 shrink-0">
                {!comment.approved && (
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(comment.id)}>
                    <Check className="h-3.5 w-3.5" />
                    {t("approve")}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDecline(comment.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  {comment.approved ? t("delete") : t("reject")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
