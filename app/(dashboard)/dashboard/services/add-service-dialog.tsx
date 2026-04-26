"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { createService } from "@/lib/actions/service-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Clock, DollarSign, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryOptions: { value: string; labelKey: string }[] = [
  { value: "consultation", labelKey: "categoryConsultation" },
  { value: "specialist_consultation", labelKey: "categorySpecialistConsultation" },
  { value: "diagnostic", labelKey: "categoryDiagnostic" },
  { value: "treatment", labelKey: "categoryTreatment" },
  { value: "imaging", labelKey: "categoryImaging" },
  { value: "preventive", labelKey: "categoryPreventive" },
  { value: "emergency", labelKey: "categoryEmergency" },
  { value: "surgery", labelKey: "categorySurgery" },
  { value: "therapy", labelKey: "categoryTherapy" },
];

const schema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  price: z.string().min(1, "Price is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  status: z.enum(["active", "inactive"]).default("active"),
  category: z.enum([
    "consultation",
    "specialist_consultation",
    "diagnostic",
    "treatment",
    "imaging",
    "preventive",
    "emergency",
    "surgery",
    "therapy",
  ]).optional(),
  maxBookingsPerDay: z.coerce.number().min(1).default(20),
  followUpRequired: z.boolean().default(false),
  prerequisites: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type TabId = "basic" | "pricing" | "scheduling" | "instructions";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: { id: string; name: string }[];
}

export function AddServiceDialog({
  open,
  onOpenChange,
  departments,
}: AddServiceDialogProps) {
  const t = useTranslations("services");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [error, setError] = useState<string | null>(null);

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
      name: "",
      description: "",
      departmentId: "",
      price: "",
      duration: 30,
      status: "active",
      category: undefined,
      maxBookingsPerDay: 20,
      followUpRequired: false,
      prerequisites: "",
      specialInstructions: "",
    },
  });

  const category = watch("category");
  const departmentId = watch("departmentId");
  const duration = watch("duration");
  const price = watch("price");
  const maxBookingsPerDay = watch("maxBookingsPerDay");
  const followUpRequired = watch("followUpRequired");
  const status = watch("status");
  const name = watch("name");

  const departmentName =
    departments.find((d) => d.id === departmentId)?.name ?? "—";

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const result = await createService({
        name: data.name,
        description: data.description || undefined,
        departmentId: data.departmentId || undefined,
        price: data.price,
        duration: data.duration,
        status: data.status,
        category: data.category,
        maxBookingsPerDay: data.maxBookingsPerDay,
        followUpRequired: data.followUpRequired,
        prerequisites: data.prerequisites,
        specialInstructions: data.specialInstructions,
      });
      if (!result.success) {
        toast.error(result.error || t("failedToCreate"));
        setError(result.error);
        return;
      }
      toast.success(t("createdSuccess"));
      onOpenChange(false);
      reset();
      setActiveTab("basic");
      router.refresh();
    } catch {
      setError(t("unexpectedError"));
    }
  }

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: "basic", labelKey: "tabBasic" },
    { id: "pricing", labelKey: "tabPricing" },
    { id: "scheduling", labelKey: "tabScheduling" },
    { id: "instructions", labelKey: "tabInstructions" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[640px] sm:max-w-[640px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white">
            {t("addServiceTitle")}
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500 dark:text-slate-400">
            {t("addServiceDescription")}
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
                {t(tab.labelKey)}
              </Button>
            ))}
          </div>
        </div>

        <form
          id="service-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col min-h-0 flex-1 overflow-y-auto"
        >
          <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
            {activeTab === "basic" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {t("serviceName")} *
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder={t("serviceNamePlaceholder")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("category")}</Label>
                  <Select
                    value={category ?? ""}
                    onValueChange={(v) =>
                      setValue("category", v as FormData["category"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("department")}</Label>
                  <Select
                    value={departmentId ?? "__none__"}
                    onValueChange={(v) =>
                      setValue("departmentId", v === "__none__" ? null : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectDepartment")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t("none")}</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    {t("descriptionLabel")}
                  </Label>
                  <textarea
                    id="description"
                    {...register("description")}
                    placeholder={t("descriptionPlaceholder")}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={status === "active"}
                    onCheckedChange={(checked) =>
                      setValue("status", checked ? "active" : "inactive")
                    }
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    {t("activeService")}
                  </Label>
                </div>
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t("durationMinutes")}
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    {...register("duration", { valueAsNumber: true })}
                    placeholder="30"
                  />
                  {errors.duration && (
                    <p className="text-sm text-destructive">
                      {errors.duration.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t("priceUsd")}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price")}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "scheduling" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="maxBookings"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {t("maxBookingsPerDay")}
                  </Label>
                  <Input
                    id="maxBookings"
                    type="number"
                    min={1}
                    {...register("maxBookingsPerDay", {
                      valueAsNumber: true,
                    })}
                    placeholder="20"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("maxBookingsHelp")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="followUp"
                    checked={watch("followUpRequired")}
                    onCheckedChange={(checked) =>
                      setValue("followUpRequired", checked)
                    }
                  />
                  <Label htmlFor="followUp" className="cursor-pointer">
                    {t("followUpRequired")}
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prerequisites" className="text-sm font-medium">
                    {t("prerequisites")}
                  </Label>
                  <textarea
                    id="prerequisites"
                    {...register("prerequisites")}
                    placeholder={t("prerequisitesPlaceholder")}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  />
                </div>
              </div>
            )}

            {activeTab === "instructions" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="specialInstructions"
                    className="text-sm font-medium"
                  >
                    {t("specialInstructions")}
                  </Label>
                  <textarea
                    id="specialInstructions"
                    {...register("specialInstructions")}
                    placeholder={t("specialInstructionsPlaceholder")}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  />
                </div>
                <div className="rounded-lg border border-amber-200/60 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-4">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    {t("serviceSummary")}
                  </p>
                  <ul className="text-sm text-amber-900 dark:text-amber-100 space-y-1">
                    <li>
                      <strong>{t("serviceName").replace(" *", "")}:</strong> {name || "—"}
                    </li>
                    <li>
                      <strong>{t("category")}:</strong>{" "}
                      {category
                        ? t(categoryOptions.find((o) => o.value === category)?.labelKey ?? "category")
                        : "—"}
                    </li>
                    <li>
                      <strong>{t("department")}:</strong> {departmentName}
                    </li>
                    <li>
                      <strong>{t("tableDuration")}:</strong> {duration ?? "—"} {t("min")}
                    </li>
                    <li>
                      <strong>{t("tablePrice")}:</strong> {price ? `$${price}` : "—"}
                    </li>
                    <li>
                      <strong>{t("maxBookingsDay")}:</strong>{" "}
                      {maxBookingsPerDay ?? "—"}
                    </li>
                    <li>
                      <strong>{t("followUpRequired")}:</strong>{" "}
                      {followUpRequired ? t("yes") : t("no")}
                    </li>
                    <li>
                      <strong>{t("statusActive")}:</strong> {status === "active" ? t("statusActive") : t("statusInactive")}
                    </li>
                  </ul>
                </div>
              </div>
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
              onClick={() => reset()}
              disabled={isSubmitting}
            >
              {tCommon("reset")}
            </Button>
            <Button type="submit" form="service-form" disabled={isSubmitting}>
              {isSubmitting ? t("creating") : t("createService")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
