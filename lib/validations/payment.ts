import { z } from "zod";

export const recordPaymentFormSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  invoiceId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional().transform((v) => (v === "" || v == null ? null : v)),
  amount: z.number().min(0, "Amount must be at least 0"),
  paymentMethod: z.string().min(1, "Select a payment method"),
  transactionId: z.string().optional().nullable(),
  description: z.string().min(1, "Provide a description of the payment (e.g., \"Consultation fee\", \"Lab test payment\")"),
  status: z.enum(["completed", "pending", "failed"]).optional(),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentFormSchema>;
