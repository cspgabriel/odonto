"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { BlogPostFormValues, blogPostSchema } from "@/lib/validations/blog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/settings/landing/image-upload-field";
import { createBlogPost, updateBlogPost } from "@/lib/actions/blog-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { type ControllerRenderProps } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; color: string | null };

interface BlogPostFormProps {
  categories: Category[];
  initialData?: BlogPostFormValues & { id: string };
}

export function BlogPostForm({ categories, initialData }: BlogPostFormProps) {
  const t = useTranslations("blog");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: initialData || {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      categoryId: null,
      tags: "",
      published: false,
      seoTitle: "",
      seoDescription: "",
      coverImage: "",
      readingTime: 5,
      customAuthorName: "",
      commentsEnabled: true,
    },
  });

  async function onSubmit(data: BlogPostFormValues) {
    if (initialData) {
      startTransition(async () => {
        try {
          await updateBlogPost(initialData.id, data);
          toast.success(t("toastPostUpdated"));
          router.push("/dashboard/blog");
        } catch (error) {
          console.error(error);
          toast.error(t("toastFailedToUpdatePost"));
        }
      });
    } else {
      startTransition(async () => {
        try {
          await createBlogPost(data);
          toast.success(t("toastPostCreated"));
          router.push("/dashboard/blog");
        } catch (error) {
          console.error(error);
          toast.error(t("toastFailedToCreatePost"));
        }
      });
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit, () => {
          toast.error(t("toastFixValidation"));
        })} 
        className="space-y-8"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("postContent")}</CardTitle>
                <CardDescription>{t("postContentDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "title"> }) => (
                    <FormItem>
                      <FormLabel>{t("titleLabel")} <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder={t("titlePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "slug"> }) => (
                    <FormItem>
                      <FormLabel>{t("slugLabel")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("slugPlaceholder")} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>{t("slugDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "excerpt"> }) => (
                    <FormItem>
                      <FormLabel>{t("excerptLabel")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("excerptPlaceholder")} {...field} value={field.value || ""} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "content"> }) => (
                    <FormItem>
                      <FormLabel>{t("contentLabel")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t("contentPlaceholder")} 
                          className="min-h-[400px] font-mono text-sm" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        {t("contentTip")}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("seoSettings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="seoTitle"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "seoTitle"> }) => (
                    <FormItem>
                      <FormLabel>{t("seoTitle")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("seoTitlePlaceholder")} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="seoDescription"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "seoDescription"> }) => (
                    <FormItem>
                      <FormLabel>{t("seoDescription")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("seoDescriptionPlaceholder")} {...field} value={field.value || ""} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("publishing")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "published"> }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t("publishedLabel")}</FormLabel>
                        <FormDescription>{t("visibleToPublic")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commentsEnabled"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "commentsEnabled"> }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t("comments")}</FormLabel>
                        <FormDescription>{t("allowReadersToComment")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customAuthorName"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "customAuthorName"> }) => (
                    <FormItem>
                      <FormLabel>{t("authorDisplayName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("authorPlaceholder")} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>{t("authorDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>{t("cancel")}</Button>
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? t("saving") : (initialData ? t("updatePost") : t("createPostButton"))}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("featuredImage")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "coverImage"> }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploadField
                          label={t("coverImage")}
                          currentImageUrl={field.value || undefined}
                          onImageUploaded={(url) => field.onChange(url)}
                          assetType="blog-cover"
                          recommendedSize="1200x630px"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("organization")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "categoryId"> }) => (
                    <FormItem>
                      <FormLabel>{t("categoryLabel")}</FormLabel>
                      <Select
                        value={field.value ?? "__none__"}
                        onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg">
                            <SelectValue placeholder={t("noCategory")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">{t("noCategory")}</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "tags"> }) => (
                    <FormItem>
                      <FormLabel>{t("tags")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("tagsPlaceholder")} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>{t("tagsDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="readingTime"
                  render={({ field }: { field: ControllerRenderProps<BlogPostFormValues, "readingTime"> }) => (
                    <FormItem>
                      <FormLabel>{t("readingTime")}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t("readingTimePlaceholder")} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
