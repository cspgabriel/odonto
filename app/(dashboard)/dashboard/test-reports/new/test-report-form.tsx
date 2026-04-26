"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "@/lib/i18n";
import {
  createTestReport,
  updateTestReport,
  uploadTestReportAttachment,
} from "@/lib/actions/lab-test-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useState, useRef } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";

const getSchema = (msgs: {
  selectPatient: string;
  selectTest: string;
  selectVendor: string;
  testDateRequired: string;
  selectStaff: string;
}) =>
  z.object({
    patientId: z.string().uuid(msgs.selectPatient),
    testId: z.string().uuid(msgs.selectTest),
    labVendorId: z.string().uuid(msgs.selectVendor),
    reportDate: z.string().min(1, msgs.testDateRequired),
    doctorId: z.string().uuid(msgs.selectStaff),
    results: z.string().optional(),
    referenceValues: z.string().optional(),
    clinicalInterpretation: z.string().optional(),
    abnormalFindings: z.string().optional(),
    recommendations: z.string().optional(),
    notes: z.string().optional(),
  });

type FormData = z.infer<ReturnType<typeof getSchema>>;

export type TestReportFormOptions = {
  patients: { id: string; fullName: string }[];
  tests: { id: string; name: string }[];
  vendors: { id: string; name: string | null }[];
  staff: { id: string; fullName: string | null }[];
};

export type TestReportInitial = {
  id: string;
  patientId: string;
  testId: string | null;
  labVendorId: string | null;
  reportDate: string;
  doctorId: string;
  results: string | null;
  referenceValues: string | null;
  clinicalInterpretation: string | null;
  abnormalFindings: string | null;
  recommendations: string | null;
  notes: string | null;
  attachments?: string[] | null;
};

export function TestReportForm({
  options,
  onSuccess,
  onCancel,
  reportId,
  initial,
}: {
  options: TestReportFormOptions;
  onSuccess?: () => void;
  onCancel?: () => void;
  reportId?: string;
  initial?: TestReportInitial;
}) {
  const t = useTranslations("testReports");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const isEdit = !!reportId && !!initial;
  const schema = getSchema({
    selectPatient: t("selectPatientValidation"),
    selectTest: t("selectTestValidation"),
    selectVendor: t("selectVendorValidation"),
    testDateRequired: t("testDateRequiredValidation"),
    selectStaff: t("selectStaffValidation"),
  });
  const [attachments, setAttachments] = useState<string[]>(
    (initial?.attachments && Array.isArray(initial.attachments) ? initial.attachments : []) as string[]
  );
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit && initial
      ? {
          patientId: initial.patientId,
          testId: initial.testId ?? options.tests[0]?.id ?? "",
          labVendorId: initial.labVendorId ?? options.vendors[0]?.id ?? "",
          reportDate: initial.reportDate,
          doctorId: initial.doctorId,
          results: initial.results ?? "",
          referenceValues: initial.referenceValues ?? "",
          clinicalInterpretation: initial.clinicalInterpretation ?? "",
          abnormalFindings: initial.abnormalFindings ?? "",
          recommendations: initial.recommendations ?? "",
          notes: initial.notes ?? "",
        }
      : {
          patientId: "",
          testId: "",
          labVendorId: "",
          reportDate: "",
          doctorId: "",
          results: "",
          referenceValues: "",
          clinicalInterpretation: "",
          abnormalFindings: "",
          recommendations: "",
          notes: "",
        },
  });

  const reportDate = form.watch("reportDate");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploadingFile(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadTestReportAttachment(formData);
      if (result.success) {
        setAttachments((prev) => [...prev, result.url]);
      } else {
        toast.error(result.error);
      }
    }
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      patientId: data.patientId,
      testId: data.testId,
      testType: "laboratory" as const,
      labVendorId: data.labVendorId || null,
      reportDate: data.reportDate,
      doctorId: data.doctorId,
      results: data.results ?? "",
      referenceValues: data.referenceValues ?? null,
      clinicalInterpretation: data.clinicalInterpretation ?? null,
      abnormalFindings: data.abnormalFindings ?? null,
      recommendations: data.recommendations ?? null,
      notes: data.notes ?? null,
      attachments,
    };

    const result = isEdit && reportId
      ? await updateTestReport({ ...payload, id: reportId })
      : await createTestReport(payload);

    if (result.success) {
      toast.success(isEdit ? t("testReportUpdatedSuccess") : t("testReportCreatedSuccess"));
      onSuccess?.();
      router.push("/dashboard/test-reports");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Patient & Test Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("patientAndTestInfo")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="patientId">{t("patientRequired")}</Label>
            <Select
              value={form.watch("patientId")}
              onValueChange={(v) => form.setValue("patientId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectPatient")} />
              </SelectTrigger>
              <SelectContent>
                {options.patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.patientId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.patientId.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="testId">{t("testRequired")}</Label>
            <Select
              value={form.watch("testId")}
              onValueChange={(v) => form.setValue("testId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectTest")} />
              </SelectTrigger>
              <SelectContent>
                {options.tests.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.testId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.testId.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-medium text-muted-foreground">
            {t("testDetails")}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("externalVendor")}</Label>
              <Select
                value={form.watch("labVendorId")}
                onValueChange={(v) => form.setValue("labVendorId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectVendor")} />
                </SelectTrigger>
                <SelectContent>
                  {options.vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name ?? t("unnamedVendor")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.labVendorId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.labVendorId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("testDateRequired")}</Label>
              <DatePicker
                date={reportDate ? new Date(reportDate) : undefined}
                onSelect={(d) =>
                  form.setValue("reportDate", d ? format(d, "yyyy-MM-dd") : "")
                }
                placeholder="dd/mm/yyyy"
              />
              {form.formState.errors.reportDate && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.reportDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("recordedBy")}</Label>
              <Select
                value={form.watch("doctorId")}
                onValueChange={(v) => form.setValue("doctorId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectStaffMember")} />
                </SelectTrigger>
                <SelectContent>
                  {options.staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName ?? t("unnamed")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.doctorId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.doctorId.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("reportAttachments")}</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-6 transition-colors hover:bg-muted/50"
          >
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              {t("clickToUpload")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              {t("fileTypesHint")}
            </p>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            multiple
            onChange={handleFileSelect}
            disabled={uploadingFile}
            className="hidden"
          />
          {uploadingFile && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> {t("uploading")}
            </p>
          )}
          {attachments.length > 0 && (
            <ul className="mt-2 space-y-1">
              {attachments.map((url, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded border bg-muted/30 px-2 py-1.5 text-xs"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{url}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeAttachment(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Test Results & Interpretation */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">
          {t("testResultsAndInterpretation")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="results">{t("testResults")}</Label>
            <Textarea
              id="results"
              {...form.register("results")}
              placeholder={t("enterResultsPlaceholder")}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referenceValues">{t("normalValues")}</Label>
            <Textarea
              id="referenceValues"
              {...form.register("referenceValues")}
              placeholder={t("referenceRangesPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinicalInterpretation">
              {t("clinicalInterpretation")}
            </Label>
            <Textarea
              id="clinicalInterpretation"
              {...form.register("clinicalInterpretation")}
              placeholder={t("interpretationPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="abnormalFindings">{t("abnormalFindings")}</Label>
            <Textarea
              id="abnormalFindings"
              {...form.register("abnormalFindings")}
              placeholder={t("abnormalPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recommendations">{t("recommendations")}</Label>
            <Textarea
              id="recommendations"
              {...form.register("recommendations")}
              placeholder={t("recommendationsPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{t("additionalNotes")}</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder={t("additionalNotesPlaceholder")}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : isEdit ? (
            t("updateTestReport")
          ) : (
            t("createTestReport")
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : router.push("/dashboard/test-reports"))}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
