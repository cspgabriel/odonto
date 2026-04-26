"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "@/lib/i18n";
import { createLabVendor } from "@/lib/actions/lab-vendor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

function makeSchema(invalidEmail: string) {
  return z
    .object({
      name: z.string().min(1, "Vendor name is required"),
      contactPerson: z.string().optional(),
      email: z.string().email(invalidEmail).optional().or(z.literal("")),
      phone: z.string().optional(),
      address: z.string().optional(),
      contractStartDate: z.string().optional(),
      contractEndDate: z.string().optional(),
      contractTerms: z.string().optional(),
    })
    .refine(
      (data) => {
        const start = data.contractStartDate?.trim();
        const end = data.contractEndDate?.trim();
        if (!start || !end) return true;
        return new Date(end) >= new Date(start);
      },
      { message: "Contract end date must be on or after start date", path: ["contractEndDate"] }
    );
}

type FormData = z.infer<ReturnType<typeof makeSchema>>;

export function CreateLabVendorForm() {
  const router = useRouter();
  const t = useTranslations("labVendors");
  const tValidation = useTranslations("validation");
  const schema = useMemo(() => makeSchema(tValidation("invalidEmail")), [tValidation]);
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
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      contractStartDate: "",
      contractEndDate: "",
      contractTerms: "",
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await createLabVendor({
      name: data.name,
      contactPerson: data.contactPerson || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      contractStart: data.contractStartDate || undefined,
      contractEnd: data.contractEndDate || undefined,
      notes: data.contractTerms || undefined,
      status: "active",
    });
    if (!result.success) {
      toast.error(result.error ?? "Failed to create lab vendor");
      setError(result.error);
      return;
    }
    toast.success(t("vendorCreatedSuccess"));
    router.push("/dashboard/lab-vendors");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Vendor Name *</Label>
        <Input id="name" {...register("name")} placeholder="e.g., LabCorp" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input
            id="contactPerson"
            {...register("contactPerson")}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="vendor@example.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+1 234 567 8900" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} placeholder="Street, City" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Contract Start Date</Label>
          <DatePicker
            date={watch("contractStartDate")?.trim() ? new Date(watch("contractStartDate")!) : undefined}
            onSelect={(d) => setValue("contractStartDate", d ? format(d, "yyyy-MM-dd") : "")}
            placeholder="Pick start date"
          />
        </div>
        <div className="space-y-2">
          <Label>Contract End Date</Label>
          <DatePicker
            date={watch("contractEndDate")?.trim() ? new Date(watch("contractEndDate")!) : undefined}
            onSelect={(d) => setValue("contractEndDate", d ? format(d, "yyyy-MM-dd") : "")}
            placeholder="Pick end date"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractTerms">Contract Terms</Label>
        <textarea
          id="contractTerms"
          {...register("contractTerms")}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Notes or terms..."
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create Lab Vendor"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/lab-vendors")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
