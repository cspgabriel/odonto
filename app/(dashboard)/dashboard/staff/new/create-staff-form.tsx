"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createStaff } from "@/lib/actions/staff-actions";
import { createStaffSchema, type CreateStaffInput } from "@/lib/validations/operations";
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
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
const DAY_KEYS: Record<(typeof DAYS)[number], string> = {
  monday: "formDayMonday",
  tuesday: "formDayTuesday",
  wednesday: "formDayWednesday",
  thursday: "formDayThursday",
  friday: "formDayFriday",
  saturday: "formDaySaturday",
  sunday: "formDaySunday",
};

const defaultSchedule = () => {
  const o: Record<string, { enabled: boolean; from: string; to: string }> = {};
  DAYS.forEach((d) => {
    o[d] = {
      enabled: ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(d),
      from: "09:00",
      to: "17:00",
    };
  });
  return o;
};

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const num = "23456789";
  const special = "@$!%*?&";
  let p = "";
  p += upper[Math.floor(Math.random() * upper.length)];
  p += lower[Math.floor(Math.random() * lower.length)];
  p += num[Math.floor(Math.random() * num.length)];
  p += special[Math.floor(Math.random() * special.length)];
  const rest = upper + lower + num + special;
  for (let i = 0; i < 8; i++) {
    p += rest[Math.floor(Math.random() * rest.length)];
  }
  return p.split("").sort(() => Math.random() - 0.5).join("");
}

function validatePassword(p: string): {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
} {
  return {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[@$!%*?&]/.test(p),
  };
}

interface CreateStaffFormProps {
  departments: { id: string; name: string }[];
  onSuccess?: () => void;
}

export function CreateStaffForm({ departments, onSuccess }: CreateStaffFormProps) {
  const t = useTranslations("staff");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      fullName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      address: "",
      role: "receptionist",
      departmentId: null,
      salary: "",
      joinedDate: null,
      qualifications: "",
      status: "pending",
      notes: "",
      workSchedule: defaultSchedule(),
    },
  });

  const password = watch("password") ?? "";
  const schedule = watch("workSchedule") ?? defaultSchedule();
  const pwChecks = validatePassword(password);

  const setScheduleDay = useCallback(
    (day: (typeof DAYS)[number], enabled: boolean, from?: string, to?: string) => {
      const next = { ...schedule };
      next[day] = {
        enabled,
        from: from ?? next[day]?.from ?? "09:00",
        to: to ?? next[day]?.to ?? "17:00",
      };
      setValue("workSchedule", next as CreateStaffInput["workSchedule"]);
    },
    [schedule, setValue]
  );

  async function onSubmit(data: CreateStaffInput) {
    setError(null);
    const fullName =
      data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`.trim()
        : data.fullName;
    if (!fullName) {
      setError(t("formFullNameRequired"));
      return;
    }
    const result = await createStaff({
      ...data,
      fullName,
      email: data.email || undefined,
      password: data.password && data.password.length >= 8 ? data.password : undefined,
      workSchedule: data.workSchedule ?? undefined,
    });
    if (!result.success) {
      toast.error(result.error);
      setError(result.error);
      return;
    }
    toast.success(t("formStaffAdded"));
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/dashboard/staff");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1 — Personal */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          {t("formPersonalInfo")}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t("formFirstName")}</Label>
            <Input id="firstName" {...register("firstName")} placeholder={t("formPlaceholderFirstName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t("formLastName")}</Label>
            <Input id="lastName" {...register("lastName")} placeholder={t("formPlaceholderLastName")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("formFullName")}</Label>
          <Input
            id="fullName"
            {...register("fullName")}
            placeholder={t("formPlaceholderFullName")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("formEmail")}</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder={t("formPlaceholderEmail")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("formPhone")}</Label>
          <Input id="phone" {...register("phone")} placeholder={t("formPlaceholderPhone")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("formPassword")}</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder={t("formPlaceholderPassword")}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setValue("password", generatePassword())}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
              <li className={pwChecks.length ? "text-emerald-600" : ""}>
                {pwChecks.length ? "✓" : "○"} {t("formPwLength")}
              </li>
              <li className={pwChecks.upper ? "text-emerald-600" : ""}>
                {pwChecks.upper ? "✓" : "○"} {t("formPwUpper")}
              </li>
              <li className={pwChecks.lower ? "text-emerald-600" : ""}>
                {pwChecks.lower ? "✓" : "○"} {t("formPwLower")}
              </li>
              <li className={pwChecks.number ? "text-emerald-600" : ""}>
                {pwChecks.number ? "✓" : "○"} {t("formPwNumber")}
              </li>
              <li className={pwChecks.special ? "text-emerald-600" : ""}>
                {pwChecks.special ? "✓" : "○"} {t("formPwSpecial")}
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("formConfirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t("formPlaceholderRepeatPassword")}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">{t("formAddress")}</Label>
          <Input id="address" {...register("address")} placeholder={t("formPlaceholderAddress")} />
        </div>
      </div>

      {/* Section 2 — Professional */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          {t("formProfessionalInfo")}
        </h3>
        <div className="space-y-2">
          <Label>{t("formRole")}</Label>
          <Select
            value={watch("role")}
            onValueChange={(v) => setValue("role", v as CreateStaffInput["role"])}
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
          <Label htmlFor="salary">{t("formAnnualSalary")}</Label>
          <Input
            id="salary"
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
        <div className="space-y-2">
          <Label htmlFor="qualifications">{t("formQualifications")}</Label>
          <textarea
            id="qualifications"
            {...register("qualifications")}
            placeholder={t("formPlaceholderQualifications")}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Section 3 — Work Schedule */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          {t("formWorkSchedule")}
        </h3>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const daySchedule = schedule[day];
            const enabled = daySchedule?.enabled ?? false;
            return (
              <div
                key={day}
                className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
                  enabled ? "border-slate-200 dark:border-slate-800" : "opacity-60"
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) =>
                      setScheduleDay(day, e.target.checked)
                    }
                    className="rounded border-input"
                  />
                  <span className="font-medium">{t(DAY_KEYS[day])}</span>
                </label>
                {enabled && (
                  <>
                    <Label className="sr-only">{t("formFrom")}</Label>
                    <Input
                      type="time"
                      value={daySchedule?.from ?? "09:00"}
                      onChange={(e) =>
                        setScheduleDay(day, true, e.target.value, daySchedule?.to)
                      }
                      className="w-28"
                    />
                    <Label className="sr-only">{t("formTo")}</Label>
                    <Input
                      type="time"
                      value={daySchedule?.to ?? "17:00"}
                      onChange={(e) =>
                        setScheduleDay(day, true, daySchedule?.from, e.target.value)
                      }
                      className="w-28"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("formAdding") : t("formAddStaff")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.push("/dashboard/staff")}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
