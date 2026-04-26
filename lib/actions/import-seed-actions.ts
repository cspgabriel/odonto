"use server";

import { sql } from "drizzle-orm";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  clinics,
  departments,
  users,
  patients,
  services,
  appointments,
  invoices,
  invoiceItems,
  prescriptions,
  labVendors,
  testReports,
  inventory,
  payroll,
  odontograms,
  medicalRecordVitals,
  clinicalNotes,
  diagnoses,
  medicalAttachments,
} from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

const UUID_PREFIX_MAP: Record<string, string> = {
  p: "a",
  i: "b",
  ii: "c",
  pr: "d",
  l: "e",
  t: "f",
  v: "9",
  py: "8",
  c: "7",
  d: "6",
  s: "5",
};
const UUID_PREFIX_ORDER = ["ii", "pr", "py", "p", "i", "l", "t", "v", "c", "d", "s"];

function toValidUuid(id: string): string {
  if (typeof id !== "string") return id;
  let out = id;
  for (const prefix of UUID_PREFIX_ORDER) {
    const hex = UUID_PREFIX_MAP[prefix];
    if (hex != null && id.startsWith(prefix)) {
      out = hex + id.slice(prefix.length);
      break;
    }
  }
  const parts = out.split("-");
  if (parts.length === 4 && parts[0].length < 8) {
    parts[0] = parts[0].padStart(8, "0");
    out = parts.join("-");
  }
  return out;
}

function normalizeRow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("_")) {
      out[k] = v;
    } else if (
      typeof v === "string" &&
      (k === "id" || k.endsWith("Id")) &&
      /^[a-z0-9-]{30,36}$/i.test(v) &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
    ) {
      let u = toValidUuid(v);
      if (u.length === 35 && u.includes("-")) {
        const p = u.split("-");
        if (p[0].length === 7) p[0] = "0" + p[0];
        u = p.join("-");
      }
      out[k] = u;
    } else if (typeof v === "string" && (k.endsWith("At") || k.endsWith("Time")) && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v);
      out[k] = isNaN(d.getTime()) ? v : d;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const converted = Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (k.startsWith("_")) return [k, v];
      const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      return [camel, v];
    })
  ) as Record<string, unknown>;
  return normalizeRow(converted);
}

/** Unwrap Supabase export format: [{ "json_build_object": { clinics: [...], ... } }] */
function unwrapSupabaseExport(parsed: unknown): Record<string, unknown> {
  if (Array.isArray(parsed) && parsed.length > 0) {
    const first = parsed[0] as Record<string, unknown>;
    const inner = first?.json_build_object;
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return parsed as Record<string, unknown>;
}

const SKIP_IMPORT_KEYS = new Set(["role_permissions", "role_permission", "permissions"]);

function parseSeedJson(jsonContent: string): Record<string, unknown[]> {
  const parsed = JSON.parse(jsonContent) as unknown;
  const data = unwrapSupabaseExport(parsed);
  const out: Record<string, unknown[]> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("_") || SKIP_IMPORT_KEYS.has(key) || !Array.isArray(value)) continue;
    out[key] = value;
  }
  return out;
}

export type ImportSeedResult =
  | { success: true; inserted: Record<string, number> }
  | { success: false; error: string };

export async function importSeedDataFromJson(jsonContent: string): Promise<ImportSeedResult> {
  try {
    const user = await getCurrentUser();
    requireRole(user?.role ?? null, ["admin"]);

    const data = parseSeedJson(jsonContent);
    const inserted: Record<string, number> = {};

    const tables: {
      key: string;
      insert: (rows: Record<string, unknown>[]) => Promise<number>;
    }[] = [
      {
        key: "clinics",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(clinics).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "departments",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(departments).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "users",
        insert: async (rows) => {
          for (const row of rows) {
            const v = snakeToCamel(row);
            try {
              await db.insert(users).values(v as never).onConflictDoNothing();
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              if (!/enum.*user_role|invalid input value for enum/i.test(msg)) throw err;
            }
          }
          return rows.length;
        },
      },
      {
        key: "patients",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(patients).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "odontograms",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(odontograms).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "services",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(services).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "appointments",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(appointments).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "medical_record_vitals",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(medicalRecordVitals).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "clinical_notes",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(clinicalNotes).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "diagnoses",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(diagnoses).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "medical_attachments",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(medicalAttachments).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "invoices",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(invoices).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "invoice_items",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(invoiceItems).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "prescriptions",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(prescriptions).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "lab_vendors",
        insert: async (rows) => {
          const existing = await db.select({ id: labVendors.id }).from(labVendors).limit(1);
          if (existing.length > 0) return 0;
          for (const row of rows) {
            await db.insert(labVendors).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "test_reports",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(testReports).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "inventory",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(inventory).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
      {
        key: "payroll",
        insert: async (rows) => {
          for (const row of rows) {
            await db.insert(payroll).values(snakeToCamel(row) as never).onConflictDoNothing();
          }
          return rows.length;
        },
      },
    ];

    for (const { key, insert } of tables) {
      const rows = (data[key] ?? []) as Record<string, unknown>[];
      if (rows.length > 0) {
        const count = await insert(rows);
        inserted[key] = count;
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/patients");
    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/lab-vendors");
    revalidatePath("/settings");

    return { success: true, inserted };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return { success: false, error: message };
  }
}

export type ClearSeedResult =
  | { success: true }
  | { success: false; error: string };

/** Clear seed-populated tables (admin only). Does NOT touch users or auth. */
export async function clearSeedData(): Promise<ClearSeedResult> {
  try {
    const user = await getCurrentUser();
    requireRole(user?.role ?? null, ["admin"]);

    await db.execute(sql`TRUNCATE TABLE "payroll" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "inventory" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "test_reports" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "lab_vendors" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "prescriptions" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "invoice_items" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "invoices" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "medical_attachments" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "diagnoses" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "clinical_notes" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "medical_record_vitals" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "appointments" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "services" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "odontograms" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "patients" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "departments" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "clinics" CASCADE`);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/patients");
    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/lab-vendors");
    revalidatePath("/settings");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Clear failed";
    return { success: false, error: message };
  }
}
