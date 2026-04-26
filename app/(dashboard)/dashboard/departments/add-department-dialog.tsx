"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { toast } from "sonner";
import { z } from "zod";
import { createDepartment } from "@/lib/actions/department-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Phone, Mail, User, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const getSchema = (nameRequired: string) =>
  z.object({
    code: z.string().max(20).optional(),
    status: z.enum(["active", "inactive"]).default("active"),
    name: z.string().min(1, nameRequired),
    description: z.string().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    headOfDepartment: z.string().optional(),
    annualBudget: z.string().optional(),
  });

type FormData = z.infer<ReturnType<typeof getSchema>>;

type TabId = "basic" | "contact" | "management";

interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffCount?: number;
}

function deriveCode(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return words
      .map((w) => w.slice(0, 2).toUpperCase())
      .join("")
      .slice(0, 4);
  }
  return trimmed.slice(0, 4).toUpperCase();
}

export function AddDepartmentDialog({
  open,
  onOpenChange,
  staffCount = 0,
}: AddDepartmentDialogProps) {
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [error, setError] = useState<string | null>(null);
  const [codeTouched, setCodeTouched] = useState(false);

  const schema = getSchema(t("nameRequired"));
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      status: "active",
      name: "",
      description: "",
      location: "",
      phone: "",
      email: "",
      headOfDepartment: "",
      annualBudget: "",
    },
  });

  const name = watch("name");
  const code = watch("code");
  const status = watch("status");
  const headOfDepartment = watch("headOfDepartment");
  const location = watch("location");

  useEffect(() => {
    if (!codeTouched && name) {
      setValue("code", deriveCode(name));
    }
  }, [name, codeTouched, setValue]);

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const result = await createDepartment({
        name: data.name,
        description: data.description || undefined,
        headOfDepartment: data.headOfDepartment || undefined,
        status: data.status,
        code: data.code || undefined,
        location: data.location || undefined,
        phone: data.phone || undefined,
        email: data.email && data.email !== "" ? data.email : undefined,
        annualBudget: data.annualBudget || undefined,
      });
      if (!result.success) {
        toast.error(result.error || t("failedToCreate"));
        setError(result.error);
        return;
      }
      toast.success(t("createSuccess"));
      onOpenChange(false);
      setCodeTouched(false);
      reset();
      router.refresh();
    } catch {
      setError(t("unexpectedError"));
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "basic", label: t("tabBasic") },
    { id: "contact", label: t("tabContactLocation") },
    { id: "management", label: t("tabManagement") },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[640px] sm:max-w-[640px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white">
            {t("addDepartmentTitle")}
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500 dark:text-slate-400">
            {t("addDepartmentDescription")}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 rounded-lg font-semibold",
                  activeTab === tab.id
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <form
          id="department-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col min-h-0 flex-1 overflow-y-auto"
        >
          <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
            {activeTab === "basic" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">{t("departmentCode")}</Label>
                    <Input
                      id="code"
                      {...register("code")}
                      placeholder="e.g. GEN"
                      maxLength={20}
                      onFocus={() => setCodeTouched(true)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("codeHint")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("tableStatus")}</Label>
                    <Select
                      value={status}
                      onValueChange={(v) =>
                        setValue("status", v as "active" | "inactive")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t("statusActive")}</SelectItem>
                        <SelectItem value="inactive">{t("statusInactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t("departmentName")}</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g., General Medicine"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("description")}</Label>
                  <textarea
                    id="description"
                    {...register("description")}
                    placeholder={t("descriptionPlaceholder")}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </>
            )}

            {activeTab === "contact" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t("location")}
                  </Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder={t("locationPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("phoneNumber")}
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="e.g., +1-555-0100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("emailAddress")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="department@clinic.com"
                  />
                </div>
              </>
            )}

            {activeTab === "management" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="headOfDepartment"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {t("departmentHead")}
                  </Label>
                  <Input
                    id="headOfDepartment"
                    {...register("headOfDepartment")}
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="annualBudget"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    {t("annualBudgetUsd")}
                  </Label>
                  <Input
                    id="annualBudget"
                    type="number"
                    step="0.01"
                    {...register("annualBudget")}
                    placeholder="0.00"
                  />
                </div>
                <div className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    {t("departmentPreview")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {code && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {code}
                      </span>
                    )}
                    <span className="font-medium">{name || "—"}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        status === "active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("headLabel")}: {headOfDepartment || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("locationLabel")}: {location || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("staffCountLabel")}: {staffCount}
                  </p>
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="px-6 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" form="department-form" disabled={isSubmitting}>
              {isSubmitting ? t("creating") : t("addDepartmentButton")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
