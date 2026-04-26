"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import {
  User,
  Phone,
  Mail as MailIcon,
  MapPin,
  Activity,
  AlertCircle,
  ShieldAlert,
  Dna,
  Scale,
  Ruler,
  Stethoscope,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PatientFormValues } from "@/lib/validations/patient";

const defaultLabels: Record<string, string> = {
  fullName: "Full Name",
  dateOfBirth: "Date of Birth",
  phone: "Phone",
  email: "Email",
  gender: "Gender",
  bloodGroup: "Blood Group",
  height: "Height",
  weight: "Weight",
  address: "Address",
  medicalHistory: "Medical History",
  allergies: "Allergies",
  emergencyContactName: "Contact Name",
  emergencyContactPhone: "Contact Phone",
  emergencyContactRelation: "Relation",
  primaryDoctorId: "Primary Doctor",
  departmentId: "Department",
};

const defaultPlaceholders: Record<string, string> = {
  fullName: "Jane Doe",
  dateOfBirth: "Select birth date",
  phone: "+1 234 567 8900",
  email: "patient@example.com",
  gender: "e.g., Male, Female",
  bloodGroup: "Select blood type",
  height: "e.g., 175 cm",
  weight: "e.g., 70 kg",
  address: "123 Main St",
  medicalHistory: "Relevant medical notes...",
  allergies: "e.g., Penicillin, Latex",
  emergencyContactName: "Full name",
  emergencyContactPhone: "Phone number",
  emergencyContactRelation: "e.g., Spouse",
  primaryDoctorId: "Select doctor",
  departmentId: "Select department",
};

export interface PatientFormFieldsProps {
  form: UseFormReturn<PatientFormValues>;
  isLoading?: boolean;
  labelOverrides?: Partial<Record<keyof PatientFormValues, string>>;
  placeholderOverrides?: Partial<Record<keyof PatientFormValues, string>>;
  bloodGroupDefaultValue?: string;
  doctors?: { id: string; fullName: string; specialization: string | null }[];
  departments?: { id: string; name: string }[];
}

export function PatientFormFields({
  form,
  labelOverrides,
  placeholderOverrides,
  bloodGroupDefaultValue,
  doctors = [],
  departments = [],
}: PatientFormFieldsProps) {
  const { register, setValue, watch, formState: { errors } } = form;
  const dobValue = watch("dateOfBirth");

  const label = (key: keyof PatientFormValues) =>
    labelOverrides?.[key] ?? defaultLabels[key as string] ?? key;
  const placeholder = (key: keyof PatientFormValues) =>
    placeholderOverrides?.[key] ?? defaultPlaceholders[key as string] ?? "";

  return (
    <>
      {/* Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <User className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Personal Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("fullName")}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="fullName"
                {...register("fullName")}
                placeholder={placeholder("fullName")}
                className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
              />
            </div>
            {errors.fullName && (
              <p className="text-[10px] font-bold text-destructive uppercase tracking-tighter ml-1">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("dateOfBirth")}</Label>
            <DatePicker
              date={dobValue ? new Date(dobValue) : undefined}
              onSelect={(date) => setValue("dateOfBirth", date ? format(date, "yyyy-MM-dd") : "")}
              placeholder={placeholder("dateOfBirth")}
              className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
            />
            {errors.dateOfBirth && (
              <p className="text-[10px] font-bold text-destructive uppercase tracking-tighter ml-1">{errors.dateOfBirth.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("gender")}</Label>
            <Input
              id="gender"
              {...register("gender")}
              placeholder={placeholder("gender")}
              className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodGroup" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("bloodGroup")}</Label>
            <div className="relative">
              <Dna className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 z-10" />
              <Select
                value={(watch("bloodGroup") ?? bloodGroupDefaultValue ?? "") || undefined}
                onValueChange={(v) => setValue("bloodGroup", v)}
              >
                <SelectTrigger id="bloodGroup" className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus:ring-primary/30">
                  <SelectValue placeholder={placeholder("bloodGroup")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                  <SelectItem value="A+" className="cursor-pointer font-bold text-xs">A Positive (A+)</SelectItem>
                  <SelectItem value="A-" className="cursor-pointer font-bold text-xs">A Negative (A-)</SelectItem>
                  <SelectItem value="B+" className="cursor-pointer font-bold text-xs">B Positive (B+)</SelectItem>
                  <SelectItem value="B-" className="cursor-pointer font-bold text-xs">B Negative (B-)</SelectItem>
                  <SelectItem value="O+" className="cursor-pointer font-bold text-xs">O Positive (O+)</SelectItem>
                  <SelectItem value="O-" className="cursor-pointer font-bold text-xs">O Negative (O-)</SelectItem>
                  <SelectItem value="AB+" className="cursor-pointer font-bold text-xs">AB Positive (AB+)</SelectItem>
                  <SelectItem value="AB-" className="cursor-pointer font-bold text-xs">AB Negative (AB-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Care Team */}
      {(doctors.length > 0 || departments.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
            <Stethoscope className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Care Team</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="primaryDoctorId" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("primaryDoctorId")}</Label>
                <Select
                  value={watch("primaryDoctorId") ?? "__none__"}
                  onValueChange={(v) => setValue("primaryDoctorId", v === "__none__" ? null : v)}
                >
                  <SelectTrigger id="primaryDoctorId" className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus:ring-primary/30">
                    <SelectValue placeholder={placeholder("primaryDoctorId")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                    <SelectItem value="__none__" className="cursor-pointer font-medium text-slate-500">None</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="cursor-pointer">
                        Dr. {d.fullName}{d.specialization ? ` — ${d.specialization}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {departments.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="departmentId" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("departmentId")}</Label>
                <Select
                  value={watch("departmentId") ?? "__none__"}
                  onValueChange={(v) => setValue("departmentId", v === "__none__" ? null : v)}
                >
                  <SelectTrigger id="departmentId" className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus:ring-primary/30">
                    <SelectValue placeholder={placeholder("departmentId")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                    <SelectItem value="__none__" className="cursor-pointer font-medium text-slate-500">None</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="cursor-pointer">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <Phone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Contact Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("phone")}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="phone"
                {...register("phone")}
                placeholder={placeholder("phone")}
                className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
              />
            </div>
            {errors.phone && (
              <p className="text-[10px] font-bold text-destructive uppercase tracking-tighter ml-1">{errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("email")}</Label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder={placeholder("email")}
                className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("address")}</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              id="address"
              {...register("address")}
              placeholder={placeholder("address")}
              className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Medical Metrics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Medical Metrics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("height")}</Label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="height"
                {...register("height")}
                placeholder={placeholder("height")}
                className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("weight")}</Label>
            <div className="relative">
              <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="weight"
                {...register("weight")}
                placeholder={placeholder("weight")}
                className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <AlertCircle className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Medical History</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicalHistory" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("medicalHistory")}</Label>
            <textarea
              id="medicalHistory"
              {...register("medicalHistory")}
              className="flex min-h-[100px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm focus-visible:ring-primary/30 outline-none transition-all"
              placeholder={placeholder("medicalHistory")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("allergies")}</Label>
            <div className="relative">
              <ShieldAlert className="absolute left-3 top-3 h-3.5 w-3.5 text-rose-400" />
              <Input
                id="allergies"
                {...register("allergies")}
                placeholder={placeholder("allergies")}
                className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 pb-1">
          <AlertCircle className="h-4 w-4 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Emergency Contact</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("emergencyContactName")}</Label>
            <Input
              id="emergencyContactName"
              {...register("emergencyContactName")}
              placeholder={placeholder("emergencyContactName")}
              className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("emergencyContactPhone")}</Label>
              <Input
                id="emergencyContactPhone"
                {...register("emergencyContactPhone")}
                placeholder={placeholder("emergencyContactPhone")}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelation" className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none ml-1">{label("emergencyContactRelation")}</Label>
              <Input
                id="emergencyContactRelation"
                {...register("emergencyContactRelation")}
                placeholder={placeholder("emergencyContactRelation")}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus-visible:ring-primary/30"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
