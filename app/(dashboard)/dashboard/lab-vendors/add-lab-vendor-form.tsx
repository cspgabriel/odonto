"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";
import { createLabVendor } from "@/lib/actions/lab-vendor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Award, PenLine } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function makeSchema(invalidEmail: string) {
  return z
    .object({
      name: z.string().min(1, "Vendor name is required"),
      code: z.string().optional(),
      labType: z.string().min(1, "Vendor type is required"),
      contactPerson: z.string().optional(),
      licenseNumber: z.string().optional(),
      email: z.string().email(invalidEmail).optional().or(z.literal("")),
      phone: z.string().optional(),
      website: z.string().url("Invalid URL").optional().or(z.literal("")),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      accreditations: z.string().optional(),
      specialties: z.string().optional(),
      rating: z.number().min(0).max(5).optional(),
      tier: z.string().optional(),
      contractStartDate: z.string().optional(),
      contractEndDate: z.string().optional(),
      notes: z.string().optional(),
    })
    .refine((d) => {
      if (!d.contractStartDate || !d.contractEndDate) return true;
      return new Date(d.contractEndDate) >= new Date(d.contractStartDate);
    }, { message: "End date must be on or after start date", path: ["contractEndDate"] });
}

type FormData = z.infer<ReturnType<typeof makeSchema>>;

const VENDOR_TYPES = ["Reference Lab", "Specialty Lab", "Diagnostic Lab", "Imaging Center"] as const;
const ACCREDITATIONS = ["CLIA", "CAP", "AABB", "NABL", "ISO 15189", "JCAHO", "COLA", "TJC"] as const;
const SPECIALTIES = [
  "Hematology", "Clinical Chemistry", "Microbiology", "Immunology", "Molecular Diagnostics",
  "Cytopathology", "Histopathology", "Toxicology", "Genetics", "Blood Banking",
  "Serology", "Coagulation", "Endocrinology", "Cardiology"
] as const;
const TIERS = [
  { value: "budget", label: "Budget" },
  { value: "moderate", label: "Moderate" },
  { value: "premium", label: "Premium" },
];

function slugify(s: string): string {
  return s.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toUpperCase().slice(0, 8);
}

export function CreateLabVendorForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("labVendors");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const schema = useMemo(() => makeSchema(tValidation("invalidEmail")), [tValidation]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"basic" | "contact" | "credentials" | "services" | "contract">("basic");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      labType: "",
      contactPerson: "",
      licenseNumber: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      accreditations: "",
      specialties: "",
      rating: 4.5,
      tier: "",
      contractStartDate: "",
      contractEndDate: "",
      notes: "",
    },
  });

  const watched = watch();

  const vendorSummary = useMemo(() => ({
    name: watched.name || tCommon("notSpecified"),
    type: watched.labType || tCommon("notSpecified"),
    contact: watched.contactPerson || tCommon("notSpecified"),
    email: watched.email || tCommon("notSpecified"),
    phone: watched.phone || tCommon("notSpecified"),
    location: [watched.address, watched.city, watched.state, watched.zipCode].filter(Boolean).join(", ") || tCommon("notSpecified"),
    accreditations: watched.accreditations ? watched.accreditations.split(",").map((s) => s.trim()).filter(Boolean).join(", ") : "None selected",
    specialties: watched.specialties ? watched.specialties.split(",").map((s) => s.trim()).filter(Boolean).join(", ") : "None selected",
  }), [watched]);

  const autoCode = useMemo(() => {
    if (watched.name?.trim()) return "LAB" + slugify(watched.name).slice(0, 6);
    return "";
  }, [watched.name]);

  async function onSubmit(data: FormData) {
    setError(null);
    const code = data.code?.trim() || autoCode || undefined;
    const result = await createLabVendor({
      name: data.name,
      code: code ?? undefined,
      labType: (data.labType as "Reference Lab" | "Specialty Lab" | "Diagnostic Lab" | "Imaging Center") || undefined,
      contactPerson: data.contactPerson || undefined,
      licenseNumber: data.licenseNumber || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      website: data.website || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zipCode || undefined,
      accreditations: data.accreditations || undefined,
      specialties: data.specialties || undefined,
      rating: data.rating ?? undefined,
      tier: (data.tier as "budget" | "moderate" | "premium") || undefined,
      contractStart: data.contractStartDate || undefined,
      contractEnd: data.contractEndDate || undefined,
      notes: data.notes || undefined,
      status: "active",
    });
    if (!result.success) {
      toast.error(result.error ?? "Failed to create lab vendor");
      setError(result.error ?? null);
      return;
    }
    toast.success(t("vendorCreatedSuccess"));
    if (onSuccess) onSuccess();
    router.refresh();
  }

  const tabs = [
    { id: "basic" as const, labelKey: "formBasicInfo" as const },
    { id: "contact" as const, labelKey: "formContact" as const },
    { id: "credentials" as const, labelKey: "formCredentials" as const },
    { id: "services" as const, labelKey: "formServices" as const },
    { id: "contract" as const, labelKey: "formContract" as const },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="flex border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === "basic" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Lab Vendor Name *</Label>
              <Input id="name" {...register("name")} placeholder={t("formEnterVendorName")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Vendor Code</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder={autoCode ? `Auto: ${autoCode}` : "Leave empty to auto-generate"}
              />
              <p className="text-xs text-muted-foreground">Auto-generated if empty, based on vendor name</p>
            </div>
            <div className="space-y-2">
              <Label>Vendor Type *</Label>
              <Select value={watch("labType")} onValueChange={(v) => setValue("labType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor type" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.labType && <p className="text-sm text-destructive">{errors.labType.message}</p>}
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input id="contactPerson" {...register("contactPerson")} placeholder="Contact person name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input id="licenseNumber" {...register("licenseNumber")} placeholder="License number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register("email")} placeholder="vendor@example.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" {...register("phone")} placeholder="+1-555-123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register("website")} placeholder="https://vendor-website.com" />
              {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" {...register("address")} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" {...register("city")} placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input id="state" {...register("state")} placeholder="State" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input id="zipCode" {...register("zipCode")} placeholder="12345" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "credentials" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Accreditations</Label>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {ACCREDITATIONS.map((a) => {
                  const current = (watched.accreditations ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                  const checked = current.includes(a);
                  return (
                    <label key={a} className="flex items-center gap-2 cursor-pointer py-1.5">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          const next = c ? [...current, a] : current.filter((x) => x !== a);
                          setValue("accreditations", next.join(", "));
                        }}
                      />
                      <span className="text-sm text-foreground">{a}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PenLine className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Specialties</Label>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {SPECIALTIES.map((s) => {
                  const current = (watched.specialties ?? "").split(",").map((x) => x.trim()).filter(Boolean);
                  const checked = current.includes(s);
                  return (
                    <label key={s} className="flex items-center gap-2 cursor-pointer py-1.5">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          const next = c ? [...current, s] : current.filter((x) => x !== s);
                          setValue("specialties", next.join(", "));
                        }}
                      />
                      <span className="text-sm text-foreground">{s}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Initial Rating</Label>
              <Input
                id="rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                {...register("rating", { valueAsNumber: true })}
                placeholder="4.5"
              />
              <p className="text-xs text-muted-foreground">Rating out of 5 stars</p>
            </div>
            <div className="space-y-2">
              <Label>Pricing Tier</Label>
              <Select value={watch("tier")} onValueChange={(v) => setValue("tier", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing tier" />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Any additional information about the vendor..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        )}

        {activeTab === "contract" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contract Start Date</Label>
              <DatePicker
                date={watch("contractStartDate")?.trim() ? new Date(watch("contractStartDate")!) : undefined}
                onSelect={(d) => setValue("contractStartDate", d ? format(d, "yyyy-MM-dd") : "")}
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div className="space-y-2">
              <Label>Contract End Date</Label>
              <DatePicker
                date={watch("contractEndDate")?.trim() ? new Date(watch("contractEndDate")!) : undefined}
                onSelect={(d) => setValue("contractEndDate", d ? format(d, "yyyy-MM-dd") : "")}
                placeholder="dd/mm/yyyy"
              />
              {errors.contractEndDate && <p className="text-sm text-destructive">{errors.contractEndDate.message}</p>}
            </div>
            <div className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Vendor Summary</h4>
              <dl className="space-y-1.5 text-sm">
                <div><dt className="inline font-medium text-slate-500 dark:text-slate-400">Name: </dt><dd className="inline">{vendorSummary.name}</dd></div>
                <div><dt className="inline font-medium text-slate-500 dark:text-slate-400">Type: </dt><dd className="inline">{vendorSummary.type}</dd></div>
                <div><dt className="inline font-medium text-slate-500 dark:text-slate-400">Contact: </dt><dd className="inline">{vendorSummary.contact}</dd></div>
                <div><dt className="inline font-medium text-slate-500 dark:text-slate-400">Email: </dt><dd className="inline">{vendorSummary.email}</dd></div>
                <div><dt className="inline font-medium text-slate-500 dark:text-slate-400">Phone: </dt><dd className="inline">{vendorSummary.phone}</dd></div>
                <div><dt className="inline font-medium text-slate-500 dark:text-slate-400">Location: </dt><dd className="inline">{vendorSummary.location}</dd></div>
                <div><dt className="inline font-medium text-slate-500 dark:text-slate-400">Accreditations: </dt><dd className="inline">{vendorSummary.accreditations}</dd></div>
                <div><dt className="inline font-medium text-slate-500 dark:text-slate-400">Specialties: </dt><dd className="inline">{vendorSummary.specialties}</dd></div>
              </dl>
            </div>
          </div>
        )}
      </div>

      {error && <p className="px-6 text-sm text-destructive" role="alert">{error}</p>}

      <div className="flex gap-2 p-6 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("formCreating") : t("formCreateLabVendor")}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess} disabled={isSubmitting}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
