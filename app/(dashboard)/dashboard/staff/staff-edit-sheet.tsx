"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getStaffById, updateStaff } from "@/lib/actions/staff-actions";
import { updateStaffSchema, type UpdateStaffInput } from "@/lib/validations/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

type StaffWithDept = Extract<Awaited<ReturnType<typeof getStaffById>>, { success: true }>["data"];

export function StaffEditSheet({
  staffId,
  open,
  onOpenChange,
  onSuccess,
  departments,
}: {
  staffId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  departments: { id: string; name: string }[];
}) {
  const t = useTranslations("staff");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [staff, setStaff] = useState<StaffWithDept>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateStaffInput>({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: {
      staffId: "",
      fullName: "",
      firstName: "",
      lastName: "",
      role: "receptionist",
      departmentId: null,
      phone: "",
      email: "",
      address: "",
      salary: "",
      joinedDate: null,
      status: "pending",
      notes: "",
      qualifications: "",
      workSchedule: undefined,
    },
  });

  useEffect(() => {
    if (!open || !staffId) {
      setStaff(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getStaffById(staffId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success && res.data) {
        const s = res.data;
        setStaff(s);
        const statusNorm =
          s.status === "active" ? "approved" : s.status === "inactive" ? "rejected" : s.status === "on_leave" ? "pending" : s.status;
        reset({
          staffId: s.id,
          fullName: s.fullName ?? "",
          firstName: s.firstName ?? "",
          lastName: s.lastName ?? "",
          role: s.role as UpdateStaffInput["role"],
          departmentId: s.departmentId ?? null,
          phone: s.phone ?? "",
          email: s.email ?? "",
          address: s.address ?? "",
          salary: s.salary != null ? String(s.salary) : "",
          joinedDate: s.joinedDate ?? null,
          status: (statusNorm === "approved" || statusNorm === "pending" || statusNorm === "rejected" ? statusNorm : "pending") as UpdateStaffInput["status"],
          notes: s.notes ?? "",
          qualifications: s.qualifications ?? "",
          workSchedule: (s.workSchedule as UpdateStaffInput["workSchedule"]) ?? undefined,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, staffId, reset]);

  async function onSubmit(data: UpdateStaffInput) {
    const result = await updateStaff(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(t("staffUpdated"));
    onOpenChange(false);
    onSuccess?.();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("editStaff")}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">{t("loadingStaff")}</p>
            </div>
          ) : staff ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">{t("formFullName")}</Label>
                <Input
                  id="edit-fullName"
                  {...register("fullName")}
                  placeholder={t("formPlaceholderFullName")}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t("formEmail")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...register("email")}
                  placeholder={t("formPlaceholderEmail")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t("formPhone")}</Label>
                <Input id="edit-phone" {...register("phone")} placeholder={t("formPlaceholderPhone")} />
              </div>
              <div className="space-y-2">
                <Label>{t("formRole")}</Label>
                <Select
                  value={watch("role")}
                  onValueChange={(v) => setValue("role", v as UpdateStaffInput["role"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                    <SelectItem value="doctor">{t("roleDoctor")}</SelectItem>
                    <SelectItem value="nurse">{t("roleNurse")}</SelectItem>
                    <SelectItem value="receptionist">{t("roleReceptionist")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("formDepartment")}</Label>
                <Select
                  value={watch("departmentId") ?? "__none__"}
                  onValueChange={(v) => setValue("departmentId", v === "__none__" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("formSelectDepartment")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("formNone")}</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("tableStatus")}</Label>
                <Select
                  value={watch("status") ?? "pending"}
                  onValueChange={(v) => setValue("status", v as UpdateStaffInput["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">{t("statusApproved")}</SelectItem>
                    <SelectItem value="pending">{t("statusPending")}</SelectItem>
                    <SelectItem value="rejected">{t("statusRejected")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary">{t("formAnnualSalary")}</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  step="0.01"
                  {...register("salary")}
                  placeholder={t("formPlaceholderSalary")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("formJoiningDate")}</Label>
                <DatePicker
                  date={watch("joinedDate") ? new Date(watch("joinedDate")!) : undefined}
                  onSelect={(d) => setValue("joinedDate", d ? format(d, "yyyy-MM-dd") : null)}
                  placeholder={t("formPickDate")}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    tCommon("save")
                  )}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
