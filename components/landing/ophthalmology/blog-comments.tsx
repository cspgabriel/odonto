"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { MessageCircle, Send, User, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitComment } from "@/lib/actions/blog-actions";
import { toast } from "sonner";

interface Comment {
  id: string;
  name: string;
  content: string;
  createdAt: Date | string;
}

const DEFAULT_T = {
  commentsOne: "1 Comment",
  commentsCount: "{count} Comments",
  joinConversation: "Join the conversation",
  addComment: "Add Comment",
  cancel: "Cancel",
  leaveComment: "Leave a comment",
  name: "Name",
  emailOptional: "(optional)",
  comment: "Comment",
  yourName: "Your name",
  yourEmail: "your@email.com",
  shareThoughts: "Share your thoughts...",
  postComment: "Post Comment",
  posting: "Posting...",
  noCommentsYet: "No comments yet. Be the first!",
  commentPosted: "Comment posted!",
  failedToPost: "Failed to post comment. Try again.",
  justNow: "just now",
  minutesAgo: "{n}m ago",
  hoursAgo: "{n}h ago",
  daysAgo: "{n}d ago",
};

interface BlogCommentsTranslations {
  commentsOne?: string;
  commentsCount?: string;
  joinConversation?: string;
  addComment?: string;
  cancel?: string;
  leaveComment?: string;
  name?: string;
  emailOptional?: string;
  comment?: string;
  yourName?: string;
  yourEmail?: string;
  shareThoughts?: string;
  postComment?: string;
  posting?: string;
  noCommentsYet?: string;
  commentPosted?: string;
  failedToPost?: string;
  justNow?: string;
  minutesAgo?: string;
  hoursAgo?: string;
  daysAgo?: string;
}

interface BlogCommentsProps {
  postId: string;
  initialComments: Comment[];
  translations?: BlogCommentsTranslations;
}

function timeAgo(date: Date | string, t: typeof DEFAULT_T, locale: string): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return t.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t.minutesAgo.replace("{n}", String(minutes));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.hoursAgo.replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  if (days < 30) return t.daysAgo.replace("{n}", String(days));
  const loc = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : locale === "es" ? "es" : "en-US";
  return d.toLocaleDateString(loc, { month: "short", day: "numeric", year: "numeric" });
}

export function BlogComments({ postId, initialComments, translations }: BlogCommentsProps) {
  const locale = useLocale();
  const t = { ...DEFAULT_T, ...translations };
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await submitComment({ name, email, content, postId });
      if (result.success && result.data) {
        setComments((prev) => [
          {
            id: result.data!.id,
            name,
            content,
            createdAt: new Date(),
          },
          ...prev,
        ]);
        setName("");
        setEmail("");
        setContent("");
        setShowForm(false);
        toast.success(t.commentPosted);
      }
    } catch {
      toast.error(t.failedToPost);
    } finally {
      setIsSubmitting(false);
    }
  }

  const commentsLabel =
    comments.length === 1 ? t.commentsOne : t.commentsCount.replace("{count}", String(comments.length));

  return (
    <section className="mt-20 pt-12 border-t border-slate-100 dark:border-slate-800">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{commentsLabel}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t.joinConversation}
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200",
            showForm
              ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              : "bg-primary text-white hover:opacity-90 active:scale-95"
          )}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              {t.cancel}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {t.addComment}
            </>
          )}
        </button>
      </div>

      {/* Comment Form — collapsible */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          showForm ? "max-h-[600px] opacity-100 mb-10" : "max-h-0 opacity-0 mb-0"
        )}
      >
        <form
          onSubmit={handleSubmit}
          className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {t.leaveComment}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                {t.name} <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.yourName}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Email <span className="text-slate-400 font-normal">{t.emailOptional}</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.yourEmail}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              {t.comment} <span className="text-primary">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.shareThoughts}
              rows={4}
              required
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !content.trim()}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all",
                "bg-primary text-white hover:opacity-90 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? t.posting : t.postComment}
            </button>
          </div>
        </form>
      </div>

      {/* Comment List */}
      {comments.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">{t.noCommentsYet}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-4 bg-white dark:bg-slate-900/30 rounded-3xl p-5 border border-slate-100 dark:border-slate-800"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                    {comment.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                    {timeAgo(comment.createdAt, t, locale)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
