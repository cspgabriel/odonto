"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { createInvoice } from "@/lib/actions/invoice-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getSchema(descReq: string, minQty: string, minPrice: string, addOne: string) {
  return z.object({
    items: z.array(
      z.object({
        description: z.string().min(1, descReq),
        quantity: z.coerce.number().int().min(1, minQty),
        unitPrice: z.coerce.number().min(0, minPrice),
      })
    ).min(1, addOne),
  });
}
type FormData = z.infer<ReturnType<typeof getSchema>>;

export function CreateInvoiceForm({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const t = useTranslations("billing");
  const schema = useMemo(
    () =>
      getSchema(
        t("formDescriptionRequired"),
        t("formMinQuantity"),
        t("formMinPrice"),
        t("formAddAtLeastOneItem")
      ),
    [t]
  );
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await createInvoice({
      appointmentId,
      items: data.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
    if (!result.success) {
      toast.error(result.error || t("formFailed"));
      setError(result.error);
      return;
    }
    toast.success(t("formCreateSuccess"));
    router.push("/dashboard/invoices");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[180px] space-y-2">
            <Label>{t("formDescription")}</Label>
            <Input
              {...register(`items.${index}.description`)}
              placeholder={t("formDescriptionPlaceholder")}
            />
          </div>
          <div className="w-20 space-y-2">
            <Label>{t("formQty")}</Label>
            <Input
              type="number"
              min={1}
              {...register(`items.${index}.quantity`)}
            />
          </div>
          <div className="w-28 space-y-2">
            <Label>{t("formUnitPrice")}</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              {...register(`items.${index}.unitPrice`)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
          >
            −
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
      >
        {t("addLine")}
      </Button>
      {errors.items?.root?.message && (
        <p className="text-sm text-destructive">{errors.items.root.message}</p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={isSubmitting}>
        {t("formCreateInvoice")}
      </Button>
    </form>
  );
}
