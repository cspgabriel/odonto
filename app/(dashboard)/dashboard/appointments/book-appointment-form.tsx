"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { format } from "date-fns";
import { z } from "zod";
import { createAppointment, getDoctorsWithDepartment } from "@/lib/actions/appointment-actions";
import { getPatients } from "@/lib/actions/patient-actions";
import { getServices } from "@/lib/actions/service-actions";
import { formatDoctorName } from "@/lib/utils/staff-display";
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
import { DatePicker } from "@/components/ui/date-picker";

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
function getSchema(messages: {
  selectPatient: string;
  selectDoctor: string;
  startDateRequired: string;
  startTimeRequired: string;
  timeFormat: string;
  endDateRequired: string;
  endTimeRequired: string;
  endAfterStart: string;
}) {
  return z
    .object({
      patientId: z.string().uuid(messages.selectPatient),
      doctorId: z.string().uuid(messages.selectDoctor),
      serviceId: z.string().uuid().optional().nullable(),
      startDate: z.date({ required_error: messages.startDateRequired }),
      startTime: z.string().min(1, messages.startTimeRequired).regex(timeRegex, messages.timeFormat),
      endDate: z.date({ required_error: messages.endDateRequired }),
      endTime: z.string().min(1, messages.endTimeRequired).regex(timeRegex, messages.timeFormat),
      notes: z.string().optional(),
    })
    .refine(
      (data) => {
        const start = new Date(`${format(data.startDate, "yyyy-MM-dd")}T${data.startTime}`);
        const end = new Date(`${format(data.endDate, "yyyy-MM-dd")}T${data.endTime}`);
        return end > start;
      },
      { message: messages.endAfterStart, path: ["endTime"] }
    );
}

type FormData = z.infer<ReturnType<typeof getSchema>>;

export function BookAppointmentForm({
  patientId: defaultPatientId,
  defaultStartDate,
  onSuccess,
}: {
  patientId?: string;
  defaultStartDate?: Date;
  onSuccess?: () => void;
}) {
  const t = useTranslations("appointments");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<{ id: string; fullName: string; specialization: string | null; departmentName: string | null }[]>([]);
  const [patients, setPatients] = useState<{ id: string; fullName: string }[]>([]);
  const [servicesList, setServicesList] = useState<{ id: string; name: string; duration: number }[]>([]);

  const schema = getSchema({
    selectPatient: t("selectPatientRequired"),
    selectDoctor: t("selectDoctorRequired"),
    startDateRequired: t("startDateRequired"),
    startTimeRequired: t("startTimeRequired"),
    timeFormat: t("timeFormat"),
    endDateRequired: t("endDateRequired"),
    endTimeRequired: t("endTimeRequired"),
    endAfterStart: t("endAfterStart"),
  });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: defaultPatientId ?? "",
      doctorId: "",
      serviceId: null,
      startDate: defaultStartDate ?? new Date(),
      startTime: "09:00",
      endDate: defaultStartDate ?? new Date(),
      endTime: "09:30",
      notes: "",
    },
  });

  useEffect(() => {
    getDoctorsWithDepartment().then(setDoctors);
    getPatients().then(setPatients);
    getServices().then((r) => {
      if (r.success && r.data) {
        setServicesList(r.data.map((s) => ({ id: s.id, name: s.name, duration: s.duration ?? 0 })));
      }
    });
  }, []);

  const selectedServiceId = watch("serviceId");
  const selectedService = servicesList.find((s) => s.id === selectedServiceId);
  useEffect(() => {
    if (!selectedService?.duration) return;
    const startDate = watch("startDate");
    const startTime = watch("startTime");
    if (!startDate || !startTime) return;
    const start = new Date(`${format(startDate, "yyyy-MM-dd")}T${startTime}`);
    const end = new Date(start.getTime() + selectedService.duration * 60 * 1000);
    setValue("endDate", end);
    setValue("endTime", format(end, "HH:mm"));
  }, [selectedService?.id, selectedService?.duration, setValue]);

  async function onSubmit(data: FormData) {
    setError(null);
    const startTime = `${format(data.startDate, "yyyy-MM-dd")}T${data.startTime}`;
    const endTime = `${format(data.endDate, "yyyy-MM-dd")}T${data.endTime}`;
    const result = await createAppointment({
      patientId: data.patientId,
      doctorId: data.doctorId,
      serviceId: data.serviceId ?? undefined,
      startTime,
      endTime,
      notes: data.notes,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("tablePatient")}</Label>
        <Select
          value={watch("patientId") || undefined}
          onValueChange={(v) => setValue("patientId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectPatient")} />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.patientId && (
          <p className="text-sm text-destructive">{errors.patientId.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>{t("serviceOptional")}</Label>
        <Select
          value={watch("serviceId") ?? ""}
          onValueChange={(v) => setValue("serviceId", v || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectService")} />
          </SelectTrigger>
          <SelectContent>
            {servicesList.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} {s.duration ? `(${s.duration} min)` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("doctor")}</Label>
        <Select
          value={watch("doctorId")}
          onValueChange={(v) => setValue("doctorId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectDoctor")} />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {formatDoctorName(d.fullName, d.specialization ?? null)}
                {d.departmentName ? ` | ${d.departmentName}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.doctorId && (
          <p className="text-sm text-destructive">{errors.doctorId.message}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("startDate")}</Label>
          <DatePicker
            date={watch("startDate")}
            onSelect={(d) => d && setValue("startDate", d)}
            placeholder={t("pickStartDate")}
          />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime">{t("startTime")}</Label>
          <Input
            id="startTime"
            type="time"
            {...register("startTime")}
          />
          {errors.startTime && (
            <p className="text-sm text-destructive">{errors.startTime.message}</p>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("endDate")}</Label>
          <DatePicker
            date={watch("endDate")}
            onSelect={(d) => d && setValue("endDate", d)}
            placeholder={t("pickEndDate")}
          />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">{t("endTime")}</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
          {errors.endTime && (
            <p className="text-sm text-destructive">{errors.endTime.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t("notesOptional")}</Label>
        <Input id="notes" {...register("notes")} />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("booking") : t("book")}
      </Button>
    </form>
  );
}

