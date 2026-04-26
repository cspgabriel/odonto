/**
 * CareNova – Seed script (loads data/data.json into dashboard)
 * Run: npm run db:seed (after db:push)
 *
 * With SUPABASE_SERVICE_ROLE_KEY set: creates Supabase Auth users with the demo password
 * (DEMO_PASSWORD or "Demo123!"), then seeds all tables from data/data.json.
 *
 * Without service role: only seeds DB tables; create Auth users manually in Supabase Dashboard.
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { eq, sql, and, gte, lt, lte } from "drizzle-orm";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns";
import { db } from "./index";
import {
  clinics,
  departments,
  users,
  patients,
  services,
  appointments,
  invoices,
  invoiceItems,
  expenses,
  payments,
  prescriptions,
  labVendors,
  testReports,
  inventory,
  payroll,
  odontograms,
  testCategories,
  testMethodologies,
  turnaroundTimes,
  sampleTypes,
  laboratoryTests,
  medicalRecordVitals,
  clinicalNotes,
  diagnoses,
  medicalAttachments,
  blogPosts,
  blogCategories,
  rolePermissions,
} from "./schema";
import { DEFAULT_ROLE_PERMISSIONS } from "../constants/permissions";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo123!";

/** Users referenced in appointments/prescriptions/etc. but possibly missing from data.users. Ensure they exist before seeding child tables. */
const REQUIRED_EXTRA_USERS: Record<string, unknown>[] = [
  { id: "00000000-0000-0000-0000-000000000006", full_name: "Dr. Demo 4", email: "doctor4@carenova.demo", role: "doctor", department_id: null, phone: "+1 555 0106", specialization: "General Medicine", hire_date: "2023-08-01", created_at: "2024-01-15T08:00:00+00:00", updated_at: "2024-01-15T08:00:00+00:00", approved_at: "2024-01-15T08:00:00+00:00" },
  { id: "00000000-0000-0000-0000-000000000007", full_name: "Dr. Demo 5", email: "doctor5@carenova.demo", role: "doctor", department_id: null, phone: "+1 555 0107", specialization: "General Medicine", hire_date: "2023-08-01", created_at: "2024-01-15T08:00:00+00:00", updated_at: "2024-01-15T08:00:00+00:00", approved_at: "2024-01-15T08:00:00+00:00" },
  { id: "00000000-0000-0000-0000-000000000008", full_name: "Dr. Demo 6", email: "doctor6@carenova.demo", role: "doctor", department_id: null, phone: "+1 555 0108", specialization: "General Medicine", hire_date: "2023-08-01", created_at: "2024-01-15T08:00:00+00:00", updated_at: "2024-01-15T08:00:00+00:00", approved_at: "2024-01-15T08:00:00+00:00" },
  { id: "00000000-0000-0000-0000-000000000009", full_name: "Dr. Demo 7", email: "doctor7@carenova.demo", role: "doctor", department_id: null, phone: "+1 555 0109", specialization: "General Medicine", hire_date: "2023-08-01", created_at: "2024-01-15T08:00:00+00:00", updated_at: "2024-01-15T08:00:00+00:00", approved_at: "2024-01-15T08:00:00+00:00" },
  { id: "00000000-0000-0000-0000-00000000000a", full_name: "Dr. Demo 8", email: "doctor8@carenova.demo", role: "doctor", department_id: null, phone: "+1 555 0110", specialization: "General Medicine", hire_date: "2023-08-01", created_at: "2024-01-15T08:00:00+00:00", updated_at: "2024-01-15T08:00:00+00:00", approved_at: "2024-01-15T08:00:00+00:00" },
  { id: "00000000-0000-0000-0000-00000000000b", full_name: "Dr. Demo 9", email: "doctor9@carenova.demo", role: "doctor", department_id: null, phone: "+1 555 0111", specialization: "General Medicine", hire_date: "2023-08-01", created_at: "2024-01-15T08:00:00+00:00", updated_at: "2024-01-15T08:00:00+00:00", approved_at: "2024-01-15T08:00:00+00:00" },
  { id: "00000000-0000-0000-0000-00000000000c", full_name: "Dr. Demo 10", email: "doctor10@carenova.demo", role: "doctor", department_id: null, phone: "+1 555 0112", specialization: "General Medicine", hire_date: "2023-08-01", created_at: "2024-01-15T08:00:00+00:00", updated_at: "2024-01-15T08:00:00+00:00", approved_at: "2024-01-15T08:00:00+00:00" },
];

/** Postgres UUID only allows 0-9a-f. Map leading non-hex chars in seed IDs to hex so FKs stay consistent. */
const UUID_PREFIX_MAP: Record<string, string> = {
  p: "a",  // patients
  ex: "4", // expenses (used by seedRealisticExpenses)
  i: "b",  // invoices
  ii: "c", // invoice_items (handle before single-char)
  pr: "d", // prescriptions (handle before single-char)
  pm: "2", // payments (handle before single-char)
  l: "e",  // lab_vendors
  t: "f",  // test_reports
  v: "9",  // inventory
  py: "8", // payroll
  c: "7",  // clinics
  d: "6",  // departments
  s: "5",  // services
};

const UUID_PREFIX_ORDER = ["ii", "pr", "py", "pm", "ex", "p", "i", "l", "t", "v", "c", "d", "s"];

/** True if the value looks like a seed ID (e.g. ii1..., p1..., i1...) that must be converted */
function hasSeedPrefix(val: string): boolean {
  return UUID_PREFIX_ORDER.some((prefix) => val.startsWith(prefix));
}

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
  // Ensure UUID format 8-4-4-4-12: pad first segment to 8 chars if needed
  const parts = out.split("-");
  if (parts.length === 4) {
    if (parts[0].length < 8) parts[0] = parts[0].padStart(8, "0");
    out = parts.join("-");
  }
  return out;
}

/** Normalize id and *_id to valid Postgres UUIDs; convert timestamp strings to Date. */
function normalizeRow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("_")) {
      out[k] = v;
    } else if (typeof v === "string" && (k === "id" || k.endsWith("Id")) && /^[a-z0-9-]{30,40}$/i.test(v) && (hasSeedPrefix(v) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))) {
      let u = toValidUuid(v);
      if (u.length === 35 && u.includes("-")) {
        const p = u.split("-");
        if (p[0].length === 7) p[0] = "0" + p[0];
        u = p.join("-");
      }
      out[k] = u;
    } else if (typeof v === "string" && (k === "date" || k.endsWith("At") || k.endsWith("Time")) && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v);
      out[k] = isNaN(d.getTime()) ? v : d;
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Convert snake_case keys to camelCase for Drizzle schema */
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

const SKIP_SEED_KEYS = new Set(["role_permissions", "role_permission", "permissions"]);

/** Run insert; on failure log and continue (never throw). Returns true if success. */
async function safeInsert(
  tableName: string,
  row: unknown,
  insertFn: () => Promise<unknown>
): Promise<boolean> {
  try {
    await insertFn();
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const preview = typeof row === "object" && row !== null ? JSON.stringify(row).slice(0, 150) : String(row);
    console.warn(`[${tableName}] Insert failed (continuing):`, msg, "| Row:", preview);
    return false;
  }
}

/** Resolve FK: use value only if it exists in validIds, else fallback. Never use hardcoded UUID. */
function resolveFk(
  value: string | null | undefined,
  validIds: string[],
  fallback: string | null = null
): string | null {
  if (!value) return fallback ?? validIds[0] ?? null;
  const normalized = toValidUuid(String(value));
  return validIds.includes(normalized) ? normalized : (fallback ?? validIds[0] ?? null);
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

/** Parse JSON seed file from data/data.json (Supabase export format supported). Strips _comment and skips app-managed keys. */
function loadSeedData(): Record<string, unknown[]> {
  const dataJsonPath = join(process.cwd(), "data", "data.json");
  let raw: string;
  try {
    raw = readFileSync(dataJsonPath, "utf-8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ENOENT")) {
      throw new Error("data/data.json not found. Add your demo export there (Supabase export or flat JSON).");
    }
    throw err;
  }
  const parsed = JSON.parse(raw) as unknown;
  const data = unwrapSupabaseExport(parsed);
  const out: Record<string, unknown[]> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("_") || SKIP_SEED_KEYS.has(key) || !Array.isArray(value)) continue;
    out[key] = value;
  }
  console.log("Loaded data/data.json");
  return out;
}

/** Load medical records seed from data/medical-records-seed.json if present */
function loadMedicalRecordsSeed(): Record<string, unknown[]> {
  try {
    const path = join(process.cwd(), "data", "medical-records-seed.json");
    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, unknown[]> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith("_") || !Array.isArray(value)) continue;
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

/** Deterministic UUID for "big clinic" extra entities (no collision with JSON ids). */
function bigClinicUuid(prefix: string, index: number): string {
  const n = String(index + 1);
  return `${prefix}${n.padStart(7, "0")}-0000-4000-8000-${n.padStart(12, "0")}`;
}

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
  "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
  "Daniel", "Lisa", "Matthew", "Nancy", "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra",
  "Steven", "Ashley", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna", "Kenneth", "Michelle",
  "Kevin", "Carol", "Brian", "Amanda", "George", "Dorothy", "Timothy", "Melissa", "Ronald", "Deborah",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
const GENDERS = ["Male", "Female"] as const;
const HEIGHTS_M = [165, 168, 170, 172, 173, 175, 177, 178, 180, 182, 184, 185, 188] as const;
const HEIGHTS_F = [152, 155, 158, 160, 161, 163, 165, 167, 168, 170, 172] as const;
const ALLERGIES_LIST = [
  "Penicillin", "Aspirin", "Sulfa drugs", "Latex", "Shellfish", "Pollen", "Dust mites",
  "Cat dander", "Codeine", "NSAIDs", "Tree nuts", "Gluten", "Dairy", "Contrast dye", "None known",
  "Ibuprofen", "Morphine", "ACE Inhibitors (cough)", "Statins (myopathy)", "Benzodiazepines",
];
const MEDICAL_HISTORIES = [
  "Type 2 Diabetes managed with Metformin 1000mg twice daily. Last HbA1c: 7.1%. Annual retinal and renal screenings up to date.",
  "Hypertension on Lisinopril 10mg once daily. BP well controlled at 128/82 mmHg. Annual echocardiogram normal.",
  "Mild persistent asthma. Uses Salbutamol rescue inhaler PRN. Last spirometry FEV1 82% predicted. Non-smoker.",
  "Seasonal allergic rhinitis. On Loratadine 10mg daily during spring. No asthmatic component identified.",
  "GERD on Omeprazole 20mg once daily. Dietary modifications in place. Endoscopy: mild erosive esophagitis (Grade A).",
  "Hypothyroidism on Levothyroxine 75mcg daily. TSH 2.4 mIU/L (within normal range). Annual thyroid ultrasound normal.",
  "Iron-deficiency anemia on Ferrous Sulfate 200mg twice daily. Hemoglobin improving: 11.2 g/dL.",
  "History of kidney stones (calcium oxalate, last 2021). High fluid intake advised. Urology follow-up annual.",
  "Anxiety disorder (GAD) on Sertraline 100mg daily. CBT sessions ongoing. Sleep hygiene improvement noted.",
  "Hyperlipidemia on Rosuvastatin 10mg. LDL: 98 mg/dL (target achieved). Annual lipid panel monitored.",
  "Osteoarthritis of the right knee. Physiotherapy completed. PRN Naproxen for flares. Weight reduction advised.",
  "Migraine without aura. Prescribed Sumatriptan 50mg for acute attacks. Keeping headache diary.",
  "COPD (mild, GOLD Stage 1). Ex-smoker. On Salbutamol PRN. Annual spirometry within acceptable range.",
  "Polycystic Ovary Syndrome. On Metformin 500mg. Ultrasound: multiple follicular cysts. Menstrual cycle irregular.",
  "Psoriasis (plaque type). On topical Betamethasone and Calcipotriol. Dermatology follow-up every 4 months.",
  "Major Depressive Disorder on Fluoxetine 20mg. Monthly psychiatric check-ins. Sleep and appetite improved.",
  "Rheumatoid arthritis (early). Anti-CCP positive. On Hydroxychloroquine and low-dose Prednisolone.",
  "Pre-diabetic (IFG). Dietary modifications and exercise program started. HbA1c 5.9%. Annual glucose monitoring.",
  "Celiac disease confirmed by biopsy. Strict gluten-free diet. Vitamin D and B12 supplementation.",
  "No significant past medical history. Routine health maintenance. Vaccinations up to date. BMI within normal range.",
];
const STREET_NAMES = [
  "Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Elm St", "Pine Rd", "Birch Blvd", "Walnut Way",
  "Chestnut Ct", "Willow Plaza", "Rosewood Dr", "Highland Ave", "Lakeview Rd", "Forest Lane", "Harbor View",
  "Sunset Blvd", "Park Place", "River Road", "Valley View", "Summit Ave",
];
const CITIES = [
  { city: "Springfield", state: "IL", zip: "62701" },
  { city: "Austin", state: "TX", zip: "78701" },
  { city: "Seattle", state: "WA", zip: "98101" },
  { city: "Boston", state: "MA", zip: "02101" },
  { city: "Denver", state: "CO", zip: "80201" },
  { city: "Phoenix", state: "AZ", zip: "85001" },
  { city: "Chicago", state: "IL", zip: "60601" },
  { city: "Miami", state: "FL", zip: "33101" },
  { city: "Nashville", state: "TN", zip: "37201" },
  { city: "Portland", state: "OR", zip: "97201" },
  { city: "San Francisco", state: "CA", zip: "94101" },
  { city: "New York", state: "NY", zip: "10001" },
  { city: "Los Angeles", state: "CA", zip: "90028" },
  { city: "Milwaukee", state: "WI", zip: "53201" },
  { city: "Columbus", state: "OH", zip: "43201" },
];
const RELATIONS = ["Spouse", "Father", "Mother", "Sibling", "Son", "Daughter", "Partner", "Friend"];
const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "yahoo.com", "hotmail.com", "icloud.com", "email.com", "live.com"];

/** Generate realistic clinic expenses for ALL 12 months (backfills missing months). */
async function seedRealisticExpenses(departmentIds: string[], adminId: string) {
  const now = new Date();
  const twelveMonthsAgo = startOfMonth(subMonths(now, 11));
  const monthsWithExpenses = await db
    .select({
      year_num: sql<number>`extract(year from ${expenses.date})::int`,
      month_num: sql<number>`extract(month from ${expenses.date})::int`,
    })
    .from(expenses)
    .where(and(gte(expenses.date, twelveMonthsAgo), lte(expenses.date, endOfMonth(now))))
    .groupBy(sql`extract(year from ${expenses.date})`, sql`extract(month from ${expenses.date})`);
  const monthKeys = new Set(monthsWithExpenses.map((r) => `${r.year_num}-${r.month_num}`));
  const requiredMonths = 12;
  if (monthKeys.size >= requiredMonths) {
    console.log("Expenses already seeded for all 12 months, skipping.");
    return;
  }

  const deptId = departmentIds[0] ?? null;

  const EXPENSE_ITEMS = [
    { title: "Medical supplies restock", category: "supplies", amount: 1247.50, vendor: "MedSupply Corp" },
    { title: "Lab equipment maintenance", category: "equipment", amount: 890.00, vendor: "LabTech Services" },
    { title: "Staff uniforms (nursing)", category: "staff", amount: 456.80, vendor: "Uniforms Plus" },
    { title: "Cleaning services", category: "utilities", amount: 680.00, vendor: "CleanCare Janitorial" },
    { title: "Insurance premium - Q1", category: "insurance", amount: 2150.00, vendor: "MedInsure Inc" },
    { title: "Pharmaceutical inventory", category: "supplies", amount: 1890.25, vendor: "PharmaDist Co" },
    { title: "X-ray film and contrast", category: "equipment", amount: 534.00, vendor: "Imaging Supplies" },
    { title: "Electricity bill", category: "utilities", amount: 1120.00, vendor: "City Power" },
    { title: "Water and sewage", category: "utilities", amount: 340.00, vendor: "City Water" },
    { title: "Office supplies", category: "supplies", amount: 285.50, vendor: "Office Depot" },
  ];

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Per-month expense multipliers (oldest..current) – ensures expenses in ALL 12 months with variation
  const MONTH_EXPENSE_MULTIPLIERS = [0.6, 1.15, 0.7, 1.25, 0.85, 1.0, 0.75, 1.2, 0.65, 0.9, 1.1, 0.8];

  // All 12 months of expenses (month -11 through current)
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const pastMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthName = MONTH_NAMES[pastMonth.getMonth()];
    const mult = MONTH_EXPENSE_MULTIPLIERS[11 - monthOffset] ?? 1;
    const count = monthOffset === 0 ? EXPENSE_ITEMS.length : 5 + (monthOffset % 4); // 5–8 per past month
    for (let i = 0; i < count; i++) {
      const item = EXPENSE_ITEMS[i % EXPENSE_ITEMS.length];
      const day = Math.min((i * 5 % 25) + 1, 28);
      const date = new Date(pastMonth.getFullYear(), pastMonth.getMonth(), day, 10, 0, 0);
      const id = bigClinicUuid("4", 8000 + monthOffset * 100 + i);
      const title = item.title.includes("services") || item.title.includes("bill")
        ? `${item.title} - ${monthName}` : item.title;
      const baseAmt = item.amount * (0.9 + (i % 3) * 0.1);
      const amt = (Math.round(baseAmt * mult * 100) / 100).toFixed(2);
      await db.insert(expenses).values({
        id,
        title,
        description: `Monthly expense: ${item.title}`,
        amount: amt,
        category: item.category,
        paymentMethod: i % 3 === 0 ? "card" : i % 3 === 1 ? "bank transfer" : "check",
        status: "paid",
        date,
        vendor: item.vendor,
        departmentId: deptId,
        submittedBy: adminId,
        createdAt: date,
        updatedAt: date,
      }).onConflictDoNothing();
    }
  }

  console.log(`Realistic expenses seeded: all 12 months.`);
}

/** Add future appointments (next 4 months) – runs separately so it can seed even when main dashboard was already seeded. */
async function seedFutureAppointments(doctorIds: string[], serviceIds: string[]) {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const futureCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(gte(appointments.startTime, tomorrow));
  if ((futureCount[0]?.count ?? 0) >= 200) {
    console.log("Future appointments already seeded (200+), skipping.");
    return;
  }

  const patientRows = await db.select({ id: patients.id }).from(patients).limit(1500);
  if (patientRows.length === 0) return;

  const doctorId = doctorIds[0];
  const FUTURE_APT_BASE = 20000;
  const FUTURE_PER_MONTH = 50;
  const APT_NOTES = [
    "Routine follow-up. Vitals stable.",
    "Annual physical scheduled.",
    "Review of chronic condition.",
    "Post-procedure follow-up.",
    "Diabetes management review.",
  ];

  let futureAptIdx = 0;
  for (let m = 1; m <= 4; m++) {
    const futureMonth = new Date(now.getFullYear(), now.getMonth() + m, 1);
    for (let k = 0; k < FUTURE_PER_MONTH; k++) {
      const aptId = bigClinicUuid("c", FUTURE_APT_BASE + futureAptIdx);
      futureAptIdx++;
      const day = (k % 25) + 1;
      const hour = 8 + (k % 6);
      const min = (k % 4) * 15;
      const start = new Date(futureMonth.getFullYear(), futureMonth.getMonth(), day, hour, min, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      const status = k % 10 === 0 ? "pending" : "confirmed";
      const patient = patientRows[(futureAptIdx - 1) % patientRows.length];
      if (!patient) continue;

      await db.insert(appointments).values({
        id: aptId,
        patientId: patient.id,
        doctorId,
        serviceId: serviceIds[k % serviceIds.length] ?? null,
        startTime: start,
        endTime: end,
        status,
        notes: APT_NOTES[k % APT_NOTES.length],
        reminderSent: 0,
        reminderSentAt: null,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing();
    }
  }
  console.log(`Future appointments seeded: +${4 * FUTURE_PER_MONTH} (next 4 months).`);
}

/** Ensure today's appointments and current month revenue exist – runs last, always. Fixes dashboard "empty" state. */
async function seedTodayAndCurrentMonthData(doctorIds: string[], serviceIds: string[]) {
  const now = new Date();
  const today = startOfDay(now);
  const todayEnd = endOfDay(now);
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  // 1. Today's appointments – add if fewer than 3
  const todayCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(and(gte(appointments.startTime, today), lt(appointments.startTime, todayEnd)));
  if ((todayCount[0]?.count ?? 0) < 3) {
    const patientRows = await db.select({ id: patients.id }).from(patients).limit(800);
    if (patientRows.length > 0) {
      const doctorId = doctorIds[0];
      const TODAY_APT_BASE = 30000;
      for (let k = 0; k < 6; k++) {
        const aptId = bigClinicUuid("c", TODAY_APT_BASE + k);
        const hour = 8 + k;
        const min = k % 2 === 0 ? 0 : 30;
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, min, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        const status = k < 2 ? "completed" : k < 4 ? "pending" : "confirmed";
        const patient = patientRows[k % patientRows.length];
        await db.insert(appointments).values({
          id: aptId,
          patientId: patient.id,
          doctorId,
          serviceId: serviceIds[0] ?? null,
          startTime: start,
          endTime: end,
          status,
          notes: "Scheduled for today.",
          reminderSent: 1,
          reminderSentAt: new Date(start.getTime() - 24 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        }).onConflictDoNothing();
      }
      console.log("Today's appointments seeded: +6.");
    }
  }

  // 2. Current month revenue – add standalone paid invoices (no appointment_id) if this month has no revenue
  const monthRevenue = await db
    .select({ total: sql<string>`coalesce(sum(${invoices.totalAmount})::text, '0')` })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        gte(invoices.issuedAt, thisMonthStart),
        lte(invoices.issuedAt, thisMonthEnd)
      )
    );
  const rev = parseFloat(monthRevenue[0]?.total ?? "0");
  if (rev < 100) {
    const patientRows = await db.select({ id: patients.id }).from(patients).limit(800);
    if (patientRows.length > 0) {
      const REV_INV_BASE = 20000;
      for (let i = 0; i < 10; i++) {
        const invId = bigClinicUuid("d", REV_INV_BASE + i);
        const invNum = `INV-M${String(REV_INV_BASE + i + 1).padStart(6, "0")}`;
        const amount = (150 + (i % 250)).toFixed(2);
        const day = (i % 25) + 1;
        const issuedAt = new Date(now.getFullYear(), now.getMonth(), day, 10, 0, 0);
        const patient = patientRows[i % patientRows.length];
        await db.insert(invoices).values({
          id: invId,
          invoiceNumber: invNum,
          appointmentId: null,
          patientId: patient.id,
          totalAmount: amount,
          status: "paid",
          paymentMethod: "card",
          paidAt: issuedAt,
          issuedAt,
          dueAt: new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
          createdAt: issuedAt,
        }).onConflictDoNothing();
        await db.insert(invoiceItems).values({
          id: bigClinicUuid("e", REV_INV_BASE + i),
          invoiceId: invId,
          description: "Consultation / Medical Service",
          quantity: 1,
          unitPrice: amount,
          createdAt: issuedAt,
        }).onConflictDoNothing();
      }
      console.log("Current month revenue seeded: +10 paid invoices.");
    }
  }

  // 3. Ensure ALL 12 months have revenue (fills gaps) – amounts vary per month
  const patientRowsForRev = await db.select({ id: patients.id }).from(patients).limit(1500);
  const FILL_MONTH_MULTIPLIERS = [0.3, 1.5, 0.32, 1.55, 0.35, 1.0, 0.7, 0.45, 1.6, 0.4, 0.9, 1.35]; // oldest..current (~5k–20k spread)
  if (patientRowsForRev.length > 0) {
    const REV12_BASE = 25000;
    let rev12Idx = 0;
    for (let m = 0; m < 12; m++) {
      const monthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (11 - m), 1));
      const monthEnd = endOfMonth(monthStart);
      const monthRevenue = await db
        .select({ total: sql<string>`coalesce(sum(${invoices.totalAmount})::text, '0')` })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, "paid"),
            gte(invoices.issuedAt, monthStart),
            lte(invoices.issuedAt, monthEnd)
          )
        );
      const total = parseFloat(monthRevenue[0]?.total ?? "0");
      if (total >= 100) continue;
      const mult = FILL_MONTH_MULTIPLIERS[m] ?? 1;
      for (let k = 0; k < 3; k++) {
        const invId = bigClinicUuid("d", REV12_BASE + rev12Idx);
        const invNum = `INV-12${String(rev12Idx + 1).padStart(5, "0")}`;
        const base = 400 + (rev12Idx % 600);
        const amount = (Math.round(base * mult * 100) / 100).toFixed(2);
        const day = (k % 25) + 1;
        const issuedAt = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          day,
          10,
          0,
          0
        );
        const patient = patientRowsForRev[rev12Idx % patientRowsForRev.length];
        await db.insert(invoices).values({
          id: invId,
          invoiceNumber: invNum,
          appointmentId: null,
          patientId: patient.id,
          totalAmount: amount,
          status: "paid",
          paymentMethod: "card",
          paidAt: issuedAt,
          issuedAt,
          dueAt: new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
          createdAt: issuedAt,
        }).onConflictDoNothing();
        await db.insert(invoiceItems).values({
          id: bigClinicUuid("e", REV12_BASE + rev12Idx),
          invoiceId: invId,
          description: "Consultation / Medical Service",
          quantity: 1,
          unitPrice: amount,
          createdAt: issuedAt,
        }).onConflictDoNothing();
        rev12Idx++;
      }
    }
    if (rev12Idx > 0) console.log(`Revenue for missing months seeded: +${rev12Idx} paid invoices.`);
  }
}

/** Build realistic dashboard: 1200+ appointments over 12 months, ~150 unpaid invoices, today's appointments, revenue spread. */
async function seedRealisticDashboardData(
  doctorIds: string[],
  serviceIds: string[],
) {
  const aptCount = await db.select({ count: sql<number>`count(*)::int` }).from(appointments);
  if ((aptCount[0]?.count ?? 0) >= 2500) {
    console.log("Realistic dashboard data already seeded (2500+ appointments), skipping.");
    await backfillRevenueVariation();
    await seedFutureAppointments(doctorIds, serviceIds);
    return;
  }

  const patientRows = await db.select({ id: patients.id }).from(patients).limit(1500);
  if (patientRows.length === 0) return;

  const doctorId = doctorIds[0];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  // Status distribution: 41% completed, 20% pending, 20% confirmed, 19% cancelled
  function pickStatus(index: number): "completed" | "pending" | "confirmed" | "cancelled" {
    const r = index % 100;
    if (r < 41) return "completed";
    if (r < 61) return "pending";
    if (r < 81) return "confirmed";
    return "cancelled";
  }

  const APT_NOTES = [
    "Routine follow-up. Vitals stable. Medication adherence confirmed.",
    "Annual physical completed. All screening tests up to date.",
    "Review of chronic condition. Lab values improving.",
    "Post-procedure follow-up. Wound healing well.",
    "Diabetes management review. Metformin continued.",
  ];

  // Activity chart targets: ~100 per month for big clinic (1200+ appointments)
  const TARGET_PER_MONTH = [95, 105, 98, 102, 108, 96, 104, 110, 97, 103, 107, 95];
  const BASE_APT = 10000;
  let aptIdx = 0;
  const appointmentIds: string[] = [];
  const appointmentPatientIds: string[] = [];

  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - (11 - m), 1);
    const count = TARGET_PER_MONTH[m] ?? 20;
    for (let k = 0; k < count; k++) {
      const aptId = bigClinicUuid("c", BASE_APT + aptIdx);
      aptIdx++;
      const day = (k % 25) + 1;
      const hour = 8 + (k % 6);
      const min = (k % 4) * 15;
      const start = new Date(monthStart.getFullYear(), monthStart.getMonth(), day, hour, min, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      const status = pickStatus(aptIdx);
      const patient = patientRows[(aptIdx - 1) % patientRows.length];
      if (!patient) continue;
      const docId = doctorIds[(aptIdx - 1) % doctorIds.length] ?? doctorId;

      await db.insert(appointments).values({
        id: aptId,
        patientId: patient.id,
        doctorId: docId,
        serviceId: serviceIds[k % serviceIds.length] ?? null,
        startTime: start,
        endTime: end,
        status,
        notes: APT_NOTES[k % APT_NOTES.length],
        reminderSent: status === "completed" || status === "confirmed" ? 1 : 0,
        reminderSentAt: status === "completed" || status === "confirmed" ? new Date(start.getTime() - 24 * 60 * 60 * 1000) : null,
        createdAt: start,
        updatedAt: end,
      }).onConflictDoNothing();
      appointmentIds.push(aptId);
      appointmentPatientIds.push(patient.id);
    }
  }

  // Add 6 appointments for TODAY
  const todayCount = 6;
  for (let k = 0; k < todayCount; k++) {
    const aptId = bigClinicUuid("c", BASE_APT + aptIdx);
    aptIdx++;
    const hour = 8 + k;
    const min = k % 2 === 0 ? 0 : 30;
    const start = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate(), hour, min, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    const status = k < 2 ? "completed" : k < 4 ? "pending" : "confirmed";
    const patient = patientRows[(aptIdx - 1) % patientRows.length];
    if (!patient) continue;

    await db.insert(appointments).values({
      id: aptId,
      patientId: patient.id,
      doctorId,
      serviceId: serviceIds[0] ?? null,
      startTime: start,
      endTime: end,
      status,
      notes: "Scheduled for today.",
      reminderSent: 1,
      reminderSentAt: new Date(start.getTime() - 24 * 60 * 60 * 1000),
      createdAt: start,
      updatedAt: end,
    }).onConflictDoNothing();
    appointmentIds.push(aptId);
    appointmentPatientIds.push(patient.id);
  }

  // Invoices: ~150 unpaid, rest paid. Revenue varies by month (ups and downs, 1–2 low months).
  const TARGET_UNPAID = 150;
  const invBase = 10000;
  const MONTHLY_REVENUE_MULTIPLIERS = [1.5, 0.9, 0.3, 1.55, 0.35, 1.0, 0.85, 0.45, 1.6, 0.32, 0.7, 1.35]; // current..11mo ago (~5k–20k spread)
  for (let i = 0; i < appointmentIds.length; i++) {
    const aptId = appointmentIds[i];
    const patientId = appointmentPatientIds[i];
    const monthOffset = i % 12;
    const baseAmount = 80 + (i % 350);
    const multiplier = MONTHLY_REVENUE_MULTIPLIERS[monthOffset] ?? 1;
    const amount = Math.round(baseAmount * multiplier * 100) / 100;
    const amountStr = amount.toFixed(2);
    const isPaid = i >= TARGET_UNPAID;
    const day = (i % 25) + 1;
    const issuedAt = new Date(now.getFullYear(), now.getMonth() - monthOffset, day, 10, 0, 0);
    const invId = bigClinicUuid("d", invBase + i);
    const invNum = `INV-R${String(invBase + i + 1).padStart(6, "0")}`;

    await db.insert(invoices).values({
      id: invId,
      invoiceNumber: invNum,
      appointmentId: aptId,
      patientId,
      totalAmount: amountStr,
      status: isPaid ? "paid" : "unpaid",
      paymentMethod: isPaid ? "card" : null,
      paidAt: isPaid ? issuedAt : null,
      issuedAt,
      dueAt: new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
      createdAt: issuedAt,
    }).onConflictDoNothing();

    await db.insert(invoiceItems).values({
      id: bigClinicUuid("e", invBase + i),
      invoiceId: invId,
      description: "Consultation / Medical Service",
      quantity: 1,
      unitPrice: amountStr,
      createdAt: issuedAt,
    }).onConflictDoNothing();
  }

  console.log(`Realistic dashboard: +${appointmentIds.length} appointments, +${appointmentIds.length} invoices (~${TARGET_UNPAID} unpaid).`);
  await seedFutureAppointments(doctorIds, serviceIds);
}

/** Backfill revenue variation: apply monthly multipliers to existing paid invoices when revenue is uniform. */
async function backfillRevenueVariation() {
  const now = new Date();
  const twelveMonthsAgo = subMonths(startOfMonth(now), 11);
  const monthTotals: number[] = [];
  for (let m = 0; m < 12; m++) {
    const ms = subMonths(startOfMonth(now), 11 - m);
    const me = endOfMonth(ms);
    const r = await db
      .select({ total: sql<string>`coalesce(sum(${invoices.totalAmount})::text, '0')` })
      .from(invoices)
      .where(
        and(eq(invoices.status, "paid"), gte(invoices.issuedAt, ms), lte(invoices.issuedAt, me))
      );
    monthTotals.push(parseFloat(r[0]?.total ?? "0"));
  }
  const mean = monthTotals.reduce((a, b) => a + b, 0) / 12;
  if (mean < 100) return;
  const variance =
    monthTotals.reduce((a, b) => a + (b - mean) ** 2, 0) / 12;
  const cv = Math.sqrt(variance) / mean;
  if (cv > 0.25) return;
  const MONTHLY_REVENUE_MULTIPLIERS = [1.5, 0.9, 0.3, 1.55, 0.35, 1.0, 0.85, 0.45, 1.6, 0.32, 0.7, 1.35];
  const paidRows = await db
    .select({ id: invoices.id, totalAmount: invoices.totalAmount, issuedAt: invoices.issuedAt })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        gte(invoices.issuedAt, twelveMonthsAgo),
        lte(invoices.issuedAt, endOfMonth(now))
      )
    );
  if (paidRows.length === 0) return;
  let updated = 0;
  for (const row of paidRows) {
    const issuedAt = row.issuedAt;
    if (!issuedAt) continue;
    const monthOffset = (now.getFullYear() - issuedAt.getFullYear()) * 12 + (now.getMonth() - issuedAt.getMonth());
    const idx = Math.max(0, Math.min(monthOffset, 11));
    const multiplier = MONTHLY_REVENUE_MULTIPLIERS[idx] ?? 1;
    const oldAmount = parseFloat(String(row.totalAmount ?? "0"));
    if (oldAmount <= 0) continue;
    const newAmount = (Math.round(oldAmount * multiplier * 100) / 100).toFixed(2);
    if (newAmount === oldAmount.toFixed(2)) continue;
    await db.update(invoices).set({ totalAmount: newAmount }).where(eq(invoices.id, row.id));
    updated++;
  }
  if (updated > 0) console.log(`Revenue variation backfill: updated ${updated} invoices.`);
}

/** Revenue per month (Apr→Mar): random mix like a real clinic – each month different, some high some low. */
const REVENUE_TARGETS_12M = [
  5_650, 12_000, 2_000, 8_500, 4_200, 17_500, 3_100, 20_500, 6_800, 14_200, 19_000, 9_800,
]; // Apr 5.65k, May 12k, Jun 2k, ... Feb 19k, Mar 9.8k

/** Force 12-month revenue to target curve by scaling paid invoices per month. Run after all invoice seeding. */
async function shapeRevenueToTargets() {
  const now = new Date();
  let totalScaled = 0;
  const patientRows = await db.select({ id: patients.id }).from(patients).limit(1);
  const patientId = patientRows[0]?.id;
  for (let m = 0; m < 12; m++) {
    const monthStart = subMonths(startOfMonth(now), 11 - m);
    const monthEnd = endOfMonth(monthStart);
    const target = REVENUE_TARGETS_12M[m] ?? 15_000;
    const rows = await db
      .select({ id: invoices.id, totalAmount: invoices.totalAmount })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "paid"),
          gte(invoices.issuedAt, monthStart),
          lte(invoices.issuedAt, monthEnd)
        )
      );
    const current = rows.reduce((s, r) => s + parseFloat(String(r.totalAmount ?? "0")), 0);
    if (current >= 1 && target >= 1) {
      const scale = target / current;
      for (const inv of rows) {
        const oldAmount = parseFloat(String(inv.totalAmount ?? "0"));
        if (oldAmount <= 0) continue;
        const newAmount = (Math.round(oldAmount * scale * 100) / 100).toFixed(2);
        await db.update(invoices).set({ totalAmount: newAmount }).where(eq(invoices.id, inv.id));
        const items = await db
          .select({ id: invoiceItems.id, unitPrice: invoiceItems.unitPrice, quantity: invoiceItems.quantity })
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, inv.id));
        for (const item of items) {
          const oldPrice = parseFloat(String(item.unitPrice ?? "0"));
          const newPrice = (Math.round(oldPrice * scale * 100) / 100).toFixed(2);
          await db
            .update(invoiceItems)
            .set({ unitPrice: newPrice })
            .where(eq(invoiceItems.id, item.id));
        }
        totalScaled++;
      }
      continue;
    }
    if (current < 1 && target >= 1000 && patientId) {
      const NUM_FILL = 8;
      const amountEach = (Math.round((target / NUM_FILL) * 100) / 100).toFixed(2);
      for (let k = 0; k < NUM_FILL; k++) {
        const invId = bigClinicUuid("d", 40000 + m * 20 + k);
        const invNum = `INV-S${String(m * 20 + k + 1).padStart(5, "0")}`;
        const day = (k % 25) + 1;
        const issuedAt = new Date(monthStart.getFullYear(), monthStart.getMonth(), day, 10, 0, 0);
        await db.insert(invoices).values({
          id: invId,
          invoiceNumber: invNum,
          appointmentId: null,
          patientId,
          totalAmount: amountEach,
          status: "paid",
          paymentMethod: "card",
          paidAt: issuedAt,
          issuedAt,
          dueAt: new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
          createdAt: issuedAt,
        }).onConflictDoNothing();
        await db.insert(invoiceItems).values({
          id: bigClinicUuid("e", 40000 + m * 20 + k),
          invoiceId: invId,
          description: "Consultation / Medical Service",
          quantity: 1,
          unitPrice: amountEach,
          createdAt: issuedAt,
        }).onConflictDoNothing();
        totalScaled++;
      }
    }
  }
  if (totalScaled > 0) console.log(`Revenue shaping: scaled/created ${totalScaled} paid invoices to target curve (1k–24k spread).`);
}

/** Ensure Financial Management has demo data: at least 10 invoices, 10 payments, 10 expenses. Runs when counts are low. */
async function seedFinancialDemoDataIfEmpty(
  patientIds: string[],
  appointmentIds: string[],
  serviceIds: string[],
  doctorId: string,
  departmentIds: string[],
  adminId: string
) {
  const [invCount, pmtCount, expCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(invoices),
    db.select({ count: sql<number>`count(*)::int` }).from(payments),
    db.select({ count: sql<number>`count(*)::int` }).from(expenses),
  ]);
  const inv = invCount[0]?.count ?? 0;
  const pmt = pmtCount[0]?.count ?? 0;
  const exp = expCount[0]?.count ?? 0;
  if (inv >= 10 && pmt >= 10 && exp >= 10) return;
  if (patientIds.length === 0) return;

  const now = new Date();
  const deptId = departmentIds[0] ?? null;
  const serviceId = serviceIds[0] ?? null;

  if (inv < 10) {
    const statuses: Array<"paid" | "unpaid" | "cancelled"> = ["paid", "paid", "unpaid", "unpaid", "cancelled"];
    for (let i = 0; i < 10; i++) {
      const invId = bigClinicUuid("d", 90000 + i);
      const invNum = `INV-DEMO${String(i + 1).padStart(4, "0")}`;
      const patientId = patientIds[i % patientIds.length];
      const issuedAt = new Date(now);
      issuedAt.setDate(issuedAt.getDate() - (i % 30));
      const status = statuses[i % statuses.length];
      const amount = (80 + (i % 200)).toFixed(2);
      await db.insert(invoices).values({
        id: invId,
        invoiceNumber: invNum,
        patientId,
        appointmentId: appointmentIds[i % Math.max(1, appointmentIds.length)] ?? null,
        doctorId,
        serviceId,
        totalAmount: amount,
        status,
        paymentMethod: status === "paid" ? "card" : null,
        paidAt: status === "paid" ? issuedAt : null,
        issuedAt,
        dueAt: new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
      }).onConflictDoNothing();
      await db.insert(invoiceItems).values({
        id: bigClinicUuid("e", 90000 + i),
        invoiceId: invId,
        description: "Consultation / Medical Service",
        quantity: 1,
        unitPrice: amount,
      }).onConflictDoNothing();
    }
    console.log("Financial demo: +10 invoices, +10 invoice items.");
  }

  if (pmt < 10) {
    const paidInvoices = await db.select({ id: invoices.id, patientId: invoices.patientId, totalAmount: invoices.totalAmount }).from(invoices).where(eq(invoices.status, "paid")).limit(15);
    const methods = ["card", "bank transfer", "cash", "check"];
    const fallbackPatientId = patientIds[0];
    for (let i = 0; i < 10; i++) {
      const pmtId = bigClinicUuid("2", 90000 + i);
      const row = paidInvoices[i % Math.max(1, paidInvoices.length)] ?? { patientId: fallbackPatientId, id: null, totalAmount: "100" };
      const patientId = row.patientId ?? fallbackPatientId;
      if (!patientId) continue;
      await db.insert(payments).values({
        id: pmtId,
        patientId,
        invoiceId: row.id,
        amount: String(row.totalAmount ?? "100"),
        paymentMethod: methods[i % methods.length],
        description: `Payment for invoice`,
        status: "completed",
      }).onConflictDoNothing();
    }
    console.log("Financial demo: +10 payments.");
  }

  if (exp < 10) {
    const EXPENSE_ITEMS = [
      { title: "Medical supplies restock", category: "supplies", amount: 450 },
      { title: "Lab equipment maintenance", category: "equipment", amount: 890 },
      { title: "Staff uniforms", category: "staff", amount: 320 },
      { title: "Cleaning services", category: "utilities", amount: 520 },
      { title: "Insurance premium", category: "insurance", amount: 1200 },
      { title: "Pharmaceutical inventory", category: "supplies", amount: 680 },
      { title: "X-ray supplies", category: "equipment", amount: 340 },
      { title: "Electricity bill", category: "utilities", amount: 410 },
      { title: "Office supplies", category: "supplies", amount: 185 },
      { title: "Equipment calibration", category: "equipment", amount: 270 },
    ];
    for (let i = 0; i < 10; i++) {
      const item = EXPENSE_ITEMS[i];
      const expId = bigClinicUuid("4", 90000 + i);
      const date = new Date(now);
      date.setDate(date.getDate() - (i % 20));
      await db.insert(expenses).values({
        id: expId,
        title: item.title,
        description: `Monthly expense: ${item.title}`,
        amount: String(item.amount),
        category: item.category,
        paymentMethod: i % 2 === 0 ? "card" : "bank transfer",
        status: "paid",
        date,
        vendor: `Vendor ${i + 1}`,
        departmentId: deptId,
        submittedBy: adminId,
      }).onConflictDoNothing();
    }
    console.log("Financial demo: +10 expenses.");
  }
}

/** Generate 100+ patients and related appointments/invoices for a "big clinic" demo. */
async function seedBigClinic(
  doctorId: string,
  serviceIds: string[],
  existingPatientCount: number
) {
  const TARGET_PATIENTS = 1200;
  const extra = Math.max(0, TARGET_PATIENTS - existingPatientCount);
  if (extra === 0) return;

  console.log(`Seeding big clinic: adding ${extra} patients (target ${TARGET_PATIENTS})...`);

  const now = new Date();
  const patientIds: string[] = [];

  for (let i = 0; i < extra; i++) {
    const id = bigClinicUuid("b", i);
    patientIds.push(id);
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const year = 1950 + (i % 65);
    const month = String((i % 12) + 1).padStart(2, "0");
    const day = String((i % 28) + 1).padStart(2, "0");
    const createdAt = new Date(now);
    createdAt.setMonth(createdAt.getMonth() - (11 - (i % 12)));

    const gender = GENDERS[i % 2];
    const bloodGroup = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
    const heightVal = gender === "Male"
      ? HEIGHTS_M[i % HEIGHTS_M.length]
      : HEIGHTS_F[i % HEIGHTS_F.length];
    const weightVal = gender === "Male"
      ? 65 + (i % 40)
      : 50 + (i % 30);
    const location = CITIES[i % CITIES.length];
    const streetNum = 100 + (i % 900);
    const street = STREET_NAMES[i % STREET_NAMES.length];
    const emailDomain = EMAIL_DOMAINS[i % EMAIL_DOMAINS.length];
    const emailLocal = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${year % 100}`;

    // Emergency contact – use the opposite of firstName rotation
    const ecFirst = FIRST_NAMES[(i + 3) % FIRST_NAMES.length];
    const ecLast = lastName;
    const ecPhone = `+1 555 ${String(4000 + i).padStart(4, "0")}`;
    const ecRelation = RELATIONS[i % RELATIONS.length];

    await db.insert(patients).values({
      id,
      fullName: `${firstName} ${lastName}`,
      dateOfBirth: `${year}-${month}-${day}`,
      gender,
      bloodGroup,
      phone: `+1 555 ${String(2000 + i).padStart(4, "0")}`,
      email: `${emailLocal}@${emailDomain}`,
      address: `${streetNum} ${street}, ${location.city}, ${location.state} ${location.zip}`,
      height: `${heightVal}cm`,
      weight: `${weightVal}kg`,
      medicalHistory: MEDICAL_HISTORIES[i % MEDICAL_HISTORIES.length],
      allergies: ALLERGIES_LIST[i % ALLERGIES_LIST.length],
      emergencyContactName: `${ecFirst} ${ecLast}`,
      emergencyContactPhone: ecPhone,
      emergencyContactRelation: ecRelation,
      createdAt,
      updatedAt: createdAt,
    }).onConflictDoNothing();
  }

  // Appointments: ~80 for primary doctor (big clinic Visit Timeline)
  const MAX_APPOINTMENTS_PER_DOCTOR = 80;
  const appointmentIds: string[] = [];
  let aptIndex = 0;
  const statuses = ["completed", "completed", "confirmed", "pending", "cancelled"] as const;
  const APT_NOTES = [
    "Routine follow-up. Vitals stable. Medication adherence confirmed. Next appointment in 3 months.",
    "Patient reports improvement. Lab results reviewed. Dosage adjustment made. Referral to specialist not required at this stage.",
    "Annual physical examination completed. BMI within healthy range. Blood pressure: 122/78 mmHg. All screening tests up to date.",
    "Complaint of fatigue and mild headaches. BP checked: 138/88 mmHg. Blood work ordered. Lifestyle modifications advised.",
    "Post-procedure follow-up. Wound healing well. No signs of infection. Sutures removed. Patient discharged with home-care instructions.",
    "Review of chronic condition management. Lab values improving. Patient educated on dietary changes and medication compliance.",
    "Dental cleaning completed. No cavities found. Mild tartar buildup. Flossing technique corrected. 6-month recall scheduled.",
    "Acute visit: sore throat and low-grade fever. Rapid strep test negative. Viral etiology suspected. Symptomatic treatment prescribed.",
    "Diabetes management review. HbA1c: 7.0%. Blood glucose diary reviewed. Metformin continued. Dietitian referral placed.",
    "Cardiology follow-up. ECG normal sinus rhythm. Echocardiogram: EF 58%. Statin and antihypertensive therapy continued.",
  ];

  let aptCount = 0;
  for (let i = 0; i < patientIds.length && aptCount < MAX_APPOINTMENTS_PER_DOCTOR; i++) {
    const numApts = Math.min(2 + (i % 2), MAX_APPOINTMENTS_PER_DOCTOR - aptCount);
    for (let j = 0; j < numApts; j++) {
      const aptId = bigClinicUuid("c", aptIndex);
      aptIndex++;
      const monthOffset = (i * 3 + j) % 12;
      const day = (i + j * 7) % 25 + 1;
      const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, day, 8 + (j % 6), (j % 4) * 15, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      const status = statuses[(i + j) % statuses.length];
      const reminderSent = status === "completed" || status === "confirmed" ? 1 : 0;
      const reminderSentAt = reminderSent
        ? new Date(start.getTime() - 24 * 60 * 60 * 1000)
        : null;

      await db.insert(appointments).values({
        id: aptId,
        patientId: patientIds[i],
        doctorId,
        serviceId: serviceIds[j % serviceIds.length],
        startTime: start,
        endTime: end,
        status,
        notes: APT_NOTES[(i + j) % APT_NOTES.length],
        reminderSent,
        reminderSentAt,
        createdAt: start,
        updatedAt: end,
      }).onConflictDoNothing();
      appointmentIds.push(aptId);
      aptCount++;
    }
  }

  // Invoices for ~50% of new appointments (paid or unpaid)
  for (let i = 0; i < appointmentIds.length; i++) {
    if (i % 2 !== 0) continue;
    const invId = bigClinicUuid("d", i);
    const aptId = appointmentIds[i];
    const amount = (40 + (i % 80)).toFixed(2);
    const paid = i % 3 === 0;
    const issuedAt = new Date(now.getFullYear(), now.getMonth() - (i % 12), (i % 20) + 1, 10, 0, 0);

    await db.insert(invoices).values({
      id: invId,
      appointmentId: aptId,
      totalAmount: amount,
      status: paid ? "paid" : "unpaid",
      insuranceProvider: null,
      insurancePolicyNumber: null,
      paymentMethod: paid ? "card" : null,
      paidAt: paid ? issuedAt : null,
      issuedAt,
      createdAt: issuedAt,
    }).onConflictDoNothing();

    await db.insert(invoiceItems).values({
      id: bigClinicUuid("e", i),
      invoiceId: invId,
      description: "Consultation / Service",
      quantity: 1,
      unitPrice: amount,
      createdAt: issuedAt,
    }).onConflictDoNothing();
  }

  console.log(`Big clinic: +${extra} patients, +${appointmentIds.length} appointments, +${Math.floor(appointmentIds.length / 2)} invoices.`);
}

/** Add appointments for an additional doctor using existing patients (for Visit Timeline multi-doctor view). */
async function seedDoctorAppointments(doctorId: string, serviceIds: string[], doctorIndex: number) {
  const MAX_APPOINTMENTS = 60;
  const existingApts = await db.select({ id: appointments.id }).from(appointments).where(eq(appointments.doctorId, doctorId)).limit(MAX_APPOINTMENTS);
  if (existingApts.length >= MAX_APPOINTMENTS) return;

  const patientRows = await db.select({ id: patients.id }).from(patients).limit(800);
  if (patientRows.length === 0) return;

  const statuses = ["completed", "completed", "confirmed", "pending", "cancelled"] as const;
  const APT_NOTES = [
    "Routine follow-up. Vitals stable.",
    "Annual physical completed. All screening tests up to date.",
    "Review of chronic condition. Lab values improving.",
    "Post-procedure follow-up. Wound healing well.",
    "Diabetes management review. Metformin continued.",
    "Acute visit: symptomatic treatment prescribed.",
    "Cardiology follow-up. ECG normal sinus rhythm.",
    "Dental cleaning completed. 6-month recall scheduled.",
  ];
  const now = new Date();
  const baseAptIndex = 5000 + doctorIndex * 100;

  for (let i = 0; i < Math.min(patientRows.length, MAX_APPOINTMENTS); i++) {
    const aptId = bigClinicUuid("c", baseAptIndex + i);
    const monthOffset = i % 6;
    const day = (i % 20) + 5;
    const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 8 + (i % 5), (i % 4) * 15, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    const status = statuses[i % statuses.length];
    const reminderSent = status === "completed" || status === "confirmed" ? 1 : 0;

    await db.insert(appointments).values({
      id: aptId,
      patientId: patientRows[i % patientRows.length].id,
      doctorId,
      serviceId: serviceIds[i % serviceIds.length] ?? null,
      startTime: start,
      endTime: end,
      status,
      notes: APT_NOTES[i % APT_NOTES.length],
      reminderSent,
      reminderSentAt: reminderSent ? new Date(start.getTime() - 24 * 60 * 60 * 1000) : null,
      createdAt: start,
      updatedAt: end,
    }).onConflictDoNothing();
  }
  console.log(`Doctor appointments: +${MAX_APPOINTMENTS} for doctor ${doctorId.slice(0, 8)}...`);
}

/** Seed realistic prescriptions for all patients */
async function seedPrescriptions(doctorId: string) {
  // Skip only if already bulk-seeded (data.json may insert a few; ignore those)
  const existing = await db.select({ id: prescriptions.id }).from(prescriptions).limit(50);
  if (existing.length >= 50) {
    console.log("Prescriptions already seeded, skipping.");
    return;
  }

  const allPatients = await db.select({ id: patients.id }).from(patients).limit(1500);
  if (allPatients.length === 0) return;

  const MEDICATIONS = [
    { name: "Amoxicillin", dosage: "500mg", freq: "Every 8 hours", dur: "7 days", instructions: "Take with or without food. Complete the full course." },
    { name: "Metformin", dosage: "1000mg", freq: "Twice daily", dur: "Ongoing", instructions: "Take with meals to reduce GI side effects." },
    { name: "Lisinopril", dosage: "10mg", freq: "Once daily", dur: "Ongoing", instructions: "Take at the same time each day. Monitor blood pressure regularly." },
    { name: "Atorvastatin", dosage: "20mg", freq: "Once nightly", dur: "Ongoing", instructions: "Take at bedtime. Avoid grapefruit juice." },
    { name: "Omeprazole", dosage: "20mg", freq: "Once daily", dur: "8 weeks", instructions: "Take 30 minutes before eating." },
    { name: "Salbutamol", dosage: "100mcg", freq: "As needed", dur: "PRN", instructions: "2 puffs via inhaler when experiencing breathlessness." },
    { name: "Sertraline", dosage: "100mg", freq: "Once daily", dur: "Ongoing", instructions: "May take 4–6 weeks for full effect. Do not stop abruptly." },
    { name: "Levothyroxine", dosage: "75mcg", freq: "Once daily", dur: "Ongoing", instructions: "Take on an empty stomach 30–60 minutes before breakfast." },
    { name: "Ibuprofen", dosage: "400mg", freq: "Every 8 hours", dur: "5 days", instructions: "Take with food. Avoid if peptic ulcer history." },
    { name: "Cetirizine", dosage: "10mg", freq: "Once daily", dur: "Seasonal", instructions: "Take at bedtime; may cause drowsiness." },
    { name: "Losartan", dosage: "50mg", freq: "Once daily", dur: "Ongoing", instructions: "Check kidney function and potassium levels regularly." },
    { name: "Metoprolol", dosage: "25mg", freq: "Twice daily", dur: "Ongoing", instructions: "Do not stop abruptly. Monitor heart rate." },
    { name: "Azithromycin", dosage: "500mg", freq: "Once daily", dur: "3 days", instructions: "Take on an empty stomach for better absorption." },
    { name: "Ciprofloxacin", dosage: "500mg", freq: "Twice daily", dur: "7 days", instructions: "Avoid dairy products and antacids within 2 hours of dose." },
    { name: "Hydroxychloroquine", dosage: "200mg", freq: "Twice daily", dur: "Ongoing", instructions: "Take with food or milk. Regular ophthalmologic monitoring needed." },
    { name: "Prednisolone", dosage: "5mg", freq: "Once daily", dur: "14 days", instructions: "Do not stop abruptly. Take with food." },
    { name: "Amlodipine", dosage: "5mg", freq: "Once daily", dur: "Ongoing", instructions: "May cause ankle swelling. Report chest pain immediately." },
    { name: "Fluoxetine", dosage: "20mg", freq: "Once daily", dur: "Ongoing", instructions: "Take in the morning to avoid sleep disturbance." },
    { name: "Doxycycline", dosage: "100mg", freq: "Twice daily", dur: "10 days", instructions: "Take with plenty of water. Avoid sun exposure." },
    { name: "Pantoprazole", dosage: "40mg", freq: "Once daily", dur: "4 weeks", instructions: "Take 30 minutes before the first meal of the day." },
  ];

  const PHARMACIES = [
    { name: "MedPlus Pharmacy", address: "123 Health Ave, Suite 200" },
    { name: "CityMed Dispensary", address: "456 Wellness Blvd" },
    { name: "QuickCare Pharmacy", address: "789 Oak Street, Mall Level 1" },
    { name: "HealthFirst Pharmacy", address: "22 Central Park Road" },
    { name: "CarePlus Drugs", address: "8 Hospital Road, Ground Floor" },
  ];

  const DRUG_INTERACTIONS = [
    null, null, null, null, // mostly null — interactions are rare
    "May interact with MAO inhibitors. Keep 14-day washout period.",
    "Caution with NSAIDs — increased risk of GI bleeding.",
    "Avoid concurrent use with warfarin. Monitor INR closely.",
    null, null,
    "Grapefruit juice may increase drug levels significantly.",
  ];

  const now = new Date();
  console.log(`Seeding prescriptions for ${allPatients.length} patients...`);

  for (let i = 0; i < allPatients.length; i++) {
    const numRx = 1 + (i % 3); // 1–3 prescriptions per patient
    for (let j = 0; j < numRx; j++) {
      const med = MEDICATIONS[(i * 3 + j) % MEDICATIONS.length];
      const pharmacy = PHARMACIES[(i + j) % PHARMACIES.length];
      const interaction = DRUG_INTERACTIONS[(i + j) % DRUG_INTERACTIONS.length];
      const daysAgo = (i % 60) + (j * 7);
      const issuedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(issuedAt.getTime() + (j + 1) * 24 * 60 * 60 * 1000 * 3);

      await db.insert(prescriptions).values({
        patientId: allPatients[i].id,
        doctorId,
        medication: med.name,
        dosage: med.dosage,
        frequency: med.freq,
        duration: med.dur,
        instructions: med.instructions,
        drugInteractions: interaction,
        pharmacyName: pharmacy.name,
        pharmacyAddress: pharmacy.address,
        issuedAt,
        createdAt: issuedAt,
        updatedAt,
      }).onConflictDoNothing();
    }
  }

  console.log(`Prescriptions seeded: ~${allPatients.length * 2} records.`);
}

/** Seed lab test catalog: categories, methodologies, turnaround times, sample types, laboratory tests */
async function seedLabTests(departmentIds: string[]) {
  const catCount = await db.select().from(testCategories).limit(1);
  if (catCount.length > 0) {
    console.log("Lab test catalog already seeded, skipping.");
    return;
  }

  const deptId = departmentIds[0] ?? null;

  const CATEGORIES = [
    { name: "Hematology", icon: "blood" },
    { name: "Biochemistry", icon: "flask" },
    { name: "Microbiology", icon: "microscope" },
    { name: "Immunology", icon: "shield" },
    { name: "Urinalysis", icon: "droplet" },
    { name: "Serology", icon: "vial" },
    { name: "Molecular", icon: "dna" },
    { name: "Tumor Markers", icon: "chart" },
    { name: "Coagulation", icon: "activity" },
    { name: "Endocrinology", icon: "zap" },
  ];

  const categoryIds: string[] = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    const [row] = await db.insert(testCategories).values({
      name: CATEGORIES[i].name,
      departmentId: deptId,
      icon: CATEGORIES[i].icon,
      isActive: 1,
    }).returning();
    if (row) categoryIds.push(row.id);
  }

  const METHODOLOGIES = [
    { name: "Spectrophotometry", equipment: "Spectrophotometer", sampleVolume: "2-5 mL" },
    { name: "Immunoassay", equipment: "Immunoassay analyzer", sampleVolume: "0.5-2 mL" },
    { name: "PCR", equipment: "Thermocycler", sampleVolume: "1-3 mL" },
    { name: "Microscopy", equipment: "Microscope", sampleVolume: "1-5 mL" },
    { name: "Flow Cytometry", equipment: "Flow cytometer", sampleVolume: "2-5 mL" },
    { name: "ELISA", equipment: "ELISA reader", sampleVolume: "0.5-1 mL" },
    { name: "Chromatography", equipment: "HPLC/GC", sampleVolume: "1-2 mL" },
    { name: "Coulter", equipment: "Coulter counter", sampleVolume: "1-2 mL" },
    { name: "Rapid Test", equipment: "Point-of-care device", sampleVolume: "0.1-0.5 mL" },
    { name: "Culture", equipment: "Incubator", sampleVolume: "1-10 mL" },
  ];

  const methodologyIds: string[] = [];
  for (let i = 0; i < METHODOLOGIES.length; i++) {
    const [row] = await db.insert(testMethodologies).values({
      name: METHODOLOGIES[i].name,
      categoryId: categoryIds[i % categoryIds.length],
      equipment: METHODOLOGIES[i].equipment,
      sampleVolume: METHODOLOGIES[i].sampleVolume,
      isActive: 1,
    }).returning();
    if (row) methodologyIds.push(row.id);
  }

  const TURNAROUNDS = [
    { name: "STAT", priority: "stat", duration: "1-2 hours" },
    { name: "Urgent", priority: "urgent", duration: "4-6 hours" },
    { name: "Routine", priority: "routine", duration: "24 hours" },
    { name: "Extended", priority: "routine", duration: "48-72 hours" },
    { name: "Send-out", priority: "routine", duration: "5-7 days" },
  ];

  const turnaroundIds: string[] = [];
  for (let i = 0; i < TURNAROUNDS.length; i++) {
    const [row] = await db.insert(turnaroundTimes).values({
      name: TURNAROUNDS[i].name,
      priority: TURNAROUNDS[i].priority,
      duration: TURNAROUNDS[i].duration,
      categoryId: categoryIds[i % categoryIds.length],
      isActive: 1,
    }).returning();
    if (row) turnaroundIds.push(row.id);
  }

  const SAMPLE_TYPES = [
    { name: "Whole Blood", category: "blood", collection: "Venipuncture", storage: "EDTA tube, room temp" },
    { name: "Serum", category: "blood", collection: "Venipuncture", storage: "SST tube, refrigerate" },
    { name: "Plasma", category: "blood", collection: "Venipuncture", storage: "Heparin tube, refrigerate" },
    { name: "Urine", category: "other", collection: "Clean catch", storage: "Sterile container, refrigerate" },
    { name: "Stool", category: "other", collection: "Random/culture", storage: "Culture media, refrigerate" },
    { name: "CSF", category: "other", collection: "Lumbar puncture", storage: "Sterile tube, room temp" },
    { name: "Saliva", category: "other", collection: "Passive drool", storage: "Sterile tube, freeze" },
    { name: "Swab", category: "other", collection: "Sterile swab", storage: "Transport media, refrigerate" },
  ];

  const sampleTypeIds: string[] = [];
  for (const s of SAMPLE_TYPES) {
    const [row] = await db.insert(sampleTypes).values({
      name: s.name,
      category: s.category,
      collection: s.collection,
      storage: s.storage,
      isActive: 1,
    }).returning();
    if (row) sampleTypeIds.push(row.id);
  }

  const LAB_TESTS = [
    { name: "CBC", desc: "Complete Blood Count", price: "25.00" },
    { name: "HbA1c", desc: "Glycated Hemoglobin", price: "35.00" },
    { name: "Lipid Panel", desc: "Total cholesterol, LDL, HDL, Triglycerides", price: "45.00" },
    { name: "Liver Function", desc: "ALT, AST, ALP, Bilirubin", price: "40.00" },
    { name: "Kidney Function", desc: "Creatinine, BUN, eGFR", price: "35.00" },
    { name: "TSH", desc: "Thyroid Stimulating Hormone", price: "38.00" },
    { name: "CRP", desc: "C-Reactive Protein", price: "30.00" },
    { name: "Vitamin D", desc: "25-OH Vitamin D", price: "55.00" },
    { name: "Urinalysis", desc: "Complete urinalysis", price: "20.00" },
    { name: "Hb Electrophoresis", desc: "Hemoglobin variant analysis", price: "65.00" },
    { name: "Coagulation Panel", desc: "PT, INR, PTT", price: "42.00" },
    { name: "Blood Culture", desc: "Aerobic & anaerobic culture", price: "75.00" },
    { name: "HIV Screening", desc: "HIV 1/2 antibody", price: "45.00" },
    { name: "Hepatitis Panel", desc: "HBsAg, anti-HCV", price: "85.00" },
  ];

  for (let i = 0; i < LAB_TESTS.length; i++) {
    await db.insert(laboratoryTests).values({
      name: LAB_TESTS[i].name,
      description: LAB_TESTS[i].desc,
      categoryId: categoryIds[i % categoryIds.length],
      sampleTypeId: sampleTypeIds[i % sampleTypeIds.length],
      methodologyId: methodologyIds[i % methodologyIds.length],
      turnaroundTimeId: turnaroundIds[i % turnaroundIds.length],
      price: LAB_TESTS[i].price,
      isActive: 1,
    }).onConflictDoNothing();
  }

  console.log(`Lab test catalog seeded: ${categoryIds.length} categories, ${methodologyIds.length} methodologies, ${turnaroundIds.length} turnaround times, ${sampleTypeIds.length} sample types, ${LAB_TESTS.length} tests.`);
}

/** Seed test reports linking patients to lab tests */
async function seedTestReports(doctorId: string) {
  const existing = await db.select({ id: testReports.id }).from(testReports).limit(20);
  if (existing.length >= 15) {
    console.log("Test reports already seeded, skipping.");
    return;
  }

  const [patientRows, testRows, vendorRows] = await Promise.all([
    db.select({ id: patients.id }).from(patients).limit(30),
    db.select({ id: laboratoryTests.id, name: laboratoryTests.name }).from(laboratoryTests).limit(14),
    db.select({ id: labVendors.id }).from(labVendors).limit(5),
  ]);

  if (patientRows.length === 0 || testRows.length === 0) return;

  const statuses = ["pending", "pending", "recorded", "recorded", "delivered"] as const;
  const SAMPLE_RESULTS: Record<string, { result: string; ref: string }> = {
    CBC: { result: "WBC: 7.2, RBC: 4.8, Hb: 14.2, Hct: 42%, Plt: 245", ref: "WBC 4.5-11, RBC 4.5-5.5, Hb 13-17, Plt 150-400" },
    HbA1c: { result: "6.8%", ref: "<5.7% normal, 5.7-6.4 prediabetic, ≥6.5 diabetic" },
    "Lipid Panel": { result: "TC: 195, LDL: 118, HDL: 52, TG: 145", ref: "TC <200, LDL <100, HDL >40, TG <150" },
    "Liver Function": { result: "ALT: 28, AST: 24, ALP: 72, Bilirubin: 0.9", ref: "ALT 7-56, AST 10-40, ALP 44-147" },
    "Kidney Function": { result: "Creat: 1.1, BUN: 18, eGFR: 88", ref: "Creat 0.7-1.3, BUN 7-20, eGFR >90" },
    TSH: { result: "2.4 mIU/L", ref: "0.4-4.0 mIU/L" },
    CRP: { result: "3.2 mg/L", ref: "<10 mg/L" },
    "Vitamin D": { result: "32 ng/mL", ref: "30-100 ng/mL" },
    Urinalysis: { result: "Color: yellow, SpG: 1.015, Protein: neg, Glucose: neg", ref: "See reference ranges" },
    "Blood Culture": { result: "No growth at 5 days", ref: "Negative" },
    "HIV Screening": { result: "Non-reactive", ref: "Non-reactive" },
  };

  const now = new Date();
  for (let i = 0; i < Math.min(patientRows.length * 2, 50); i++) {
    const patient = patientRows[i % patientRows.length];
    const test = testRows[i % testRows.length];
    const vendor = vendorRows.length > 0 ? vendorRows[i % vendorRows.length] : null;
    const status = statuses[i % statuses.length];
    const sample = SAMPLE_RESULTS[test.name] ?? { result: "See report", ref: "N/A" };
    const daysAgo = (i % 30) + 1;
    const reportDate = new Date(now);
    reportDate.setDate(reportDate.getDate() - daysAgo);

    await db.insert(testReports).values({
      patientId: patient.id,
      doctorId,
      labVendorId: vendor?.id ?? null,
      testId: test.id,
      testType: test.name,
      results: sample.result,
      referenceValues: sample.ref,
      notes: i % 4 === 0 ? "Routine monitoring" : null,
      reportDate: reportDate.toISOString().slice(0, 10),
      status,
      attachments: status === "delivered" && i % 3 === 0 ? ["report.pdf"] : [],
    }).onConflictDoNothing();
  }

  console.log(`Test reports seeded: ~${Math.min(patientRows.length * 2, 50)} records.`);
}

async function ensureAuthUsers(seedUsers: Record<string, unknown>[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log(
      "Skipping Auth user creation (set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to create Auth users)."
    );
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const u of seedUsers) {
    const id = u.id as string;
    const email = u.email as string;
    const fullName = u.full_name as string;
    const { data, error } = await supabase.auth.admin.createUser({
      id,
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      const alreadyExists =
        /already been registered|already exists|duplicate key/i.test(error.message ?? "");
      if (alreadyExists) {
        console.log(`Auth user already exists: ${email} (skipping)`);
      } else {
        console.warn(`Could not create Auth user ${email}:`, error.message);
      }
    } else if (data?.user) {
      console.log(`Created Auth user: ${email}`);
    }
  }
}

/** Seed role_permissions from DEFAULT_ROLE_PERMISSIONS (upsert; safe to run multiple times). */
async function seedRolePermissions() {
  console.log("Seeding role_permissions...");
  for (const [role, permissionKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const permissionKey of permissionKeys) {
      await db
        .insert(rolePermissions)
        .values({
          role,
          permissionKey,
          granted: true,
        })
        .onConflictDoUpdate({
          target: [rolePermissions.role, rolePermissions.permissionKey],
          set: {
            granted: true,
            updatedAt: new Date(),
          },
        });
    }
  }
  console.log("Role permissions seeded.");
}

async function seed() {
  const data = loadSeedData();

  // If DB already has users, skip slow steps (auth, big generators) and only run idempotent inserts
  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  const alreadySeeded = existingUsers.length > 0;
  if (alreadySeeded) {
    console.log("Database already has data — skipping auth and heavy generators (only running idempotent inserts).");
  }

  const seedUsers = (data.users ?? []) as Record<string, unknown>[];
  const existingUserIds = new Set(seedUsers.map((u) => String(u.id ?? "")));
  const extraUsers = REQUIRED_EXTRA_USERS.filter((u) => !existingUserIds.has(String(u.id)));
  const usersToSeed = [...seedUsers, ...extraUsers];

  if (!alreadySeeded) {
    await ensureAuthUsers(usersToSeed);
  }

  // Lookup maps: only use IDs from successful inserts (no hardcoded UUIDs as FKs)
  let deptIds: string[] = [];
  const deptByName: Record<string, string> = {};
  let userIds: string[] = [];
  let patientIds: string[] = [];
  let serviceIds: string[] = [];
  const DEFAULT_SERVICE_ID = "51000000-0000-0000-0000-000000000001";
  let labVendorIds: string[] = [];
  let inventoryIds: string[] = [];
  let appointmentIds: string[] = [];
  let invoiceIds: string[] = [];

  const existingPatientCount = (data.patients ?? []).length;

  // 1. clinics (no FKs)
  if (!alreadySeeded && data.clinics?.length) {
    console.log("Seeding clinics...");
    let count = 0;
    for (const row of data.clinics as Record<string, unknown>[]) {
      const v = snakeToCamel(row);
      const ok = await safeInsert("clinics", row, () => db.insert(clinics).values(v as any).onConflictDoNothing());
      if (ok) count++;
    }
    console.log(`✓ clinics: ${count} records`);
  }

  // 2. departments (insert with head_id=null; head_id set after users)
  if (!alreadySeeded && data.departments?.length) {
    console.log("Seeding departments...");
    const deptRows = data.departments as Record<string, unknown>[];
    for (const row of deptRows) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const { headId, ...rest } = v;
        const [inserted] = await db
          .insert(departments)
          .values({ ...rest, headId: null } as any)
          .onConflictDoNothing()
          .returning({ id: departments.id, name: departments.name });
        if (inserted) {
          deptIds.push(inserted.id);
          deptByName[inserted.name] = inserted.id;
        }
      } catch (err) {
        console.warn("[departments] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ departments: ${deptIds.length} records`);
  }

  // 3. users (demo users keep fixed IDs for Supabase Auth; resolve department_id from deptIds)
  if (!alreadySeeded && usersToSeed.length) {
    console.log("Seeding users...");
    for (const row of usersToSeed) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const departmentId = resolveFk(v.departmentId as string, deptIds);
        const values = { ...v, departmentId } as any;
        const [inserted] = await db
          .insert(users)
          .values(values)
          .onConflictDoUpdate({
            target: users.id,
            set: {
              fullName: values.fullName,
              email: values.email,
              role: values.role,
              departmentId: values.departmentId,
              phone: values.phone,
              specialization: values.specialization,
              hireDate: values.hireDate,
              updatedAt: new Date(),
            },
          })
          .returning({ id: users.id });
        if (inserted) userIds.push(inserted.id);
      } catch (err) {
        console.warn("[users] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ users: ${userIds.length} records`);
  }

  const doctorIds = userIds.length > 0
    ? usersToSeed.filter((u) => u.role === "doctor").map((u) => toValidUuid(String(u.id ?? ""))).filter((id) => userIds.includes(id))
    : [];
  const primaryDoctorId = doctorIds[0] ?? userIds[0] ?? null;
  const adminId = usersToSeed.find((u) => u.role === "admin")?.id
    ? (userIds.includes(toValidUuid(String(usersToSeed.find((u) => u.role === "admin")?.id ?? "")))
        ? toValidUuid(String(usersToSeed.find((u) => u.role === "admin")?.id ?? ""))
        : userIds[0])
    : userIds[0] ?? null;

  // 3b. departments: set head_id (resolve from userIds)
  if (!alreadySeeded && data.departments?.length && userIds.length > 0) {
    const deptRows = data.departments as Record<string, unknown>[];
    for (const row of deptRows) {
      const headIdRaw = row.head_id as string | null | undefined;
      const headId = resolveFk(headIdRaw, userIds);
      const rawDeptId = row.id;
      if (headId && rawDeptId != null) {
        const deptId = deptByName[(row as Record<string, unknown>).name as string] ?? toValidUuid(String(rawDeptId));
        if (deptIds.includes(deptId)) {
          try {
            await db.update(departments).set({ headId }).where(eq(departments.id, deptId));
          } catch (err) {
            console.warn("[departments head_id] Update failed (continuing):", err instanceof Error ? err.message : err);
          }
        }
      }
    }
  }

  // 4. patients (resolve primary_doctor_id, department_id)
  if (!alreadySeeded && data.patients?.length && userIds.length > 0) {
    console.log("Seeding patients...");
    for (const row of data.patients as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const primaryDoctorIdResolved = resolveFk(v.primaryDoctorId as string, userIds, primaryDoctorId);
        const departmentIdResolved = resolveFk(v.departmentId as string, deptIds);
        const values = { ...v, primaryDoctorId: primaryDoctorIdResolved, departmentId: departmentIdResolved } as any;
        const [inserted] = await db.insert(patients).values(values).onConflictDoNothing().returning({ id: patients.id });
        if (inserted) patientIds.push(inserted.id);
      } catch (err) {
        console.warn("[patients] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ patients: ${patientIds.length} records`);
  }

  // 5. services (resolve department_id)
  if (!alreadySeeded && data.services?.length) {
    console.log("Seeding services...");
    for (const row of data.services as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const departmentIdResolved = resolveFk(v.departmentId as string, deptIds);
        const values = { ...v, departmentId: departmentIdResolved } as any;
        const [inserted] = await db.insert(services).values(values).onConflictDoNothing().returning({ id: services.id });
        if (inserted) serviceIds.push(inserted.id);
      } catch (err) {
        console.warn("[services] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ services: ${serviceIds.length} records`);
  }
  if (!alreadySeeded && serviceIds.length === 0) {
    try {
      const deptFallback = deptIds[0] ?? null;
      const [inserted] = await db
        .insert(services)
        .values({
          id: DEFAULT_SERVICE_ID,
          name: "General Consultation",
          description: "Standard consultation",
          price: "75.00",
          duration: 30,
          departmentId: deptFallback,
        })
        .onConflictDoNothing()
        .returning({ id: services.id });
      if (inserted) serviceIds.push(inserted.id);
    } catch (err) {
      console.warn("[services default] Insert failed (continuing):", err instanceof Error ? err.message : err);
    }
    if (serviceIds.length === 0) serviceIds.push(DEFAULT_SERVICE_ID);
  }
  const serviceIdList = serviceIds.length ? serviceIds : [DEFAULT_SERVICE_ID];

  // 6. lab_vendors (no FKs)
  if (data.lab_vendors?.length && !alreadySeeded) {
    const existingVendors = await db.select({ id: labVendors.id }).from(labVendors).limit(1);
    if (existingVendors.length > 0) {
      const all = await db.select({ id: labVendors.id }).from(labVendors);
      labVendorIds = all.map((r) => r.id);
      console.log("Lab vendors already seeded, skipping.");
    } else {
      console.log("Seeding lab_vendors...");
      for (const row of data.lab_vendors as Record<string, unknown>[]) {
        try {
          const v = snakeToCamel(row) as Record<string, unknown>;
          const [inserted] = await db.insert(labVendors).values(v as any).onConflictDoNothing().returning({ id: labVendors.id });
          if (inserted) labVendorIds.push(inserted.id);
        } catch (err) {
          console.warn("[lab_vendors] Insert failed (continuing):", err instanceof Error ? err.message : err);
        }
      }
      console.log(`✓ lab_vendors: ${labVendorIds.length} records`);
    }
  }

  // 7. inventory (resolve supplier_id)
  if (!alreadySeeded && data.inventory?.length) {
    console.log("Seeding inventory...");
    for (const row of data.inventory as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const supplierIdResolved = resolveFk(v.supplierId as string, labVendorIds);
        const values = { ...v, supplierId: supplierIdResolved } as any;
        const [inserted] = await db.insert(inventory).values(values).onConflictDoNothing().returning({ id: inventory.id });
        if (inserted) inventoryIds.push(inserted.id);
      } catch (err) {
        console.warn("[inventory] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ inventory: ${inventoryIds.length} records`);
  }

  // 8. appointments (resolve patient_id, doctor_id, service_id)
  if (!alreadySeeded && data.appointments?.length && patientIds.length > 0 && userIds.length > 0) {
    console.log("Seeding appointments...");
    for (const row of data.appointments as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const patientIdResolved = resolveFk(v.patientId as string, patientIds);
        const doctorIdResolved = resolveFk(v.doctorId as string, userIds, primaryDoctorId);
        const serviceIdResolved = resolveFk(v.serviceId as string, serviceIdList);
        const values = {
          ...v,
          patientId: patientIdResolved,
          doctorId: doctorIdResolved,
          serviceId: serviceIdResolved,
        } as any;
        if (!patientIdResolved || !doctorIdResolved) continue;
        const [inserted] = await db.insert(appointments).values(values).onConflictDoNothing().returning({ id: appointments.id });
        if (inserted) appointmentIds.push(inserted.id);
      } catch (err) {
        console.warn("[appointments] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ appointments: ${appointmentIds.length} records`);
  }

  // 9. test_categories, test_methodologies, sample_types, turnaround_times, laboratory_tests
  if (!alreadySeeded && deptIds.length > 0) {
    try {
      await seedLabTests(deptIds);
    } catch (err) {
      console.warn("[seedLabTests] failed (continuing):", err instanceof Error ? err.message : err);
    }
  }

  // 15. medical_record_vitals, 16. clinical_notes, 17. diagnoses, 18. medical_attachments
  if (!alreadySeeded && patientIds.length > 0 && userIds.length > 0) {
    const medicalData = loadMedicalRecordsSeed();
    if (medicalData.medical_record_vitals?.length) {
      console.log("Seeding medical record vitals...");
      let count = 0;
      for (const row of medicalData.medical_record_vitals as Record<string, unknown>[]) {
        try {
          const v = snakeToCamel(row) as Record<string, unknown>;
          const patientIdResolved = resolveFk(v.patientId as string, patientIds);
          const appointmentIdResolved = resolveFk(v.appointmentId as string, appointmentIds);
          const recordedByIdResolved = resolveFk(v.recordedById as string, userIds);
          const values = { ...v, patientId: patientIdResolved, appointmentId: appointmentIdResolved, recordedById: recordedByIdResolved } as any;
          if (!patientIdResolved) continue;
          const [inserted] = await db.insert(medicalRecordVitals).values(values).onConflictDoNothing().returning({ id: medicalRecordVitals.id });
          if (inserted) count++;
        } catch (err) {
          console.warn("[medical_record_vitals] Insert failed (continuing):", err instanceof Error ? err.message : err);
        }
      }
      console.log(`✓ medical_record_vitals: ${count} records`);
    }
    if (medicalData.clinical_notes?.length) {
      console.log("Seeding clinical notes...");
      let count = 0;
      for (const row of medicalData.clinical_notes as Record<string, unknown>[]) {
        try {
          const v = snakeToCamel(row) as Record<string, unknown>;
          const patientIdResolved = resolveFk(v.patientId as string, patientIds);
          const authorIdResolved = resolveFk(v.authorId as string, userIds);
          const appointmentIdResolved = resolveFk(v.appointmentId as string, appointmentIds);
          const values = { ...v, patientId: patientIdResolved, authorId: authorIdResolved, appointmentId: appointmentIdResolved } as any;
          if (!patientIdResolved || !authorIdResolved) continue;
          const [inserted] = await db.insert(clinicalNotes).values(values).onConflictDoNothing().returning({ id: clinicalNotes.id });
          if (inserted) count++;
        } catch (err) {
          console.warn("[clinical_notes] Insert failed (continuing):", err instanceof Error ? err.message : err);
        }
      }
      console.log(`✓ clinical_notes: ${count} records`);
    }
    if (medicalData.diagnoses?.length) {
      console.log("Seeding diagnoses...");
      let count = 0;
      for (const row of medicalData.diagnoses as Record<string, unknown>[]) {
        try {
          const v = snakeToCamel(row) as Record<string, unknown>;
          const patientIdResolved = resolveFk(v.patientId as string, patientIds);
          const doctorIdResolved = resolveFk(v.doctorId as string, userIds);
          const values = { ...v, patientId: patientIdResolved, doctorId: doctorIdResolved } as any;
          if (!patientIdResolved) continue;
          const [inserted] = await db.insert(diagnoses).values(values).onConflictDoNothing().returning({ id: diagnoses.id });
          if (inserted) count++;
        } catch (err) {
          console.warn("[diagnoses] Insert failed (continuing):", err instanceof Error ? err.message : err);
        }
      }
      console.log(`✓ diagnoses: ${count} records`);
    }
    if (medicalData.medical_attachments?.length) {
      console.log("Seeding medical attachments...");
      let count = 0;
      for (const row of medicalData.medical_attachments as Record<string, unknown>[]) {
        try {
          const v = snakeToCamel(row) as Record<string, unknown>;
          const patientIdResolved = resolveFk(v.patientId as string, patientIds);
          const appointmentIdResolved = resolveFk(v.appointmentId as string, appointmentIds);
          const values = { ...v, patientId: patientIdResolved, appointmentId: appointmentIdResolved } as any;
          if (!patientIdResolved) continue;
          const [inserted] = await db.insert(medicalAttachments).values(values).onConflictDoNothing().returning({ id: medicalAttachments.id });
          if (inserted) count++;
        } catch (err) {
          console.warn("[medical_attachments] Insert failed (continuing):", err instanceof Error ? err.message : err);
        }
      }
      console.log(`✓ medical_attachments: ${count} records`);
    }
  }

  // 19. prescriptions (from data)
  if (!alreadySeeded && data.prescriptions?.length && patientIds.length > 0 && userIds.length > 0) {
    console.log("Seeding prescriptions...");
    let count = 0;
    for (const row of data.prescriptions as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const patientIdResolved = resolveFk(v.patientId as string, patientIds);
        const doctorIdResolved = resolveFk(v.doctorId as string, userIds, primaryDoctorId);
        const appointmentIdResolved = resolveFk(v.appointmentId as string, appointmentIds);
        const inventoryItemIdResolved = resolveFk(v.inventoryItemId as string, inventoryIds);
        const values = { ...v, patientId: patientIdResolved, doctorId: doctorIdResolved, appointmentId: appointmentIdResolved, inventoryItemId: inventoryItemIdResolved } as any;
        if (!patientIdResolved || !doctorIdResolved) continue;
        const [inserted] = await db.insert(prescriptions).values(values).onConflictDoNothing().returning({ id: prescriptions.id });
        if (inserted) count++;
      } catch (err) {
        console.warn("[prescriptions] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ prescriptions: ${count} records`);
  }

  // 19. prescriptions (generated)
  if (!alreadySeeded && primaryDoctorId) {
    try {
      await seedPrescriptions(primaryDoctorId);
    } catch (err) {
      console.warn("[seedPrescriptions] failed (continuing):", err instanceof Error ? err.message : err);
    }
  }

  // 20. test_reports (from data) - needs lab tests; seedTestReports generates its own
  if (!alreadySeeded && data.test_reports?.length && patientIds.length > 0 && userIds.length > 0) {
    const labTestRows = await db.select({ id: laboratoryTests.id }).from(laboratoryTests).limit(50);
    const labTestIds = labTestRows.map((r) => r.id);
    if (labTestIds.length > 0) {
      console.log("Seeding test_reports...");
      let count = 0;
      for (const row of data.test_reports as Record<string, unknown>[]) {
        try {
          const v = snakeToCamel(row) as Record<string, unknown>;
          const patientIdResolved = resolveFk(v.patientId as string, patientIds);
          const doctorIdResolved = resolveFk(v.doctorId as string, userIds, primaryDoctorId);
          const labVendorIdResolved = resolveFk(v.labVendorId as string, labVendorIds);
          const testIdResolved = resolveFk(v.testId as string, labTestIds);
          const appointmentIdResolved = resolveFk(v.appointmentId as string, appointmentIds);
          const values = { ...v, patientId: patientIdResolved, doctorId: doctorIdResolved, labVendorId: labVendorIdResolved, testId: testIdResolved, appointmentId: appointmentIdResolved } as any;
          if (!patientIdResolved || !doctorIdResolved) continue;
          const [inserted] = await db.insert(testReports).values(values).onConflictDoNothing().returning({ id: testReports.id });
          if (inserted) count++;
        } catch (err) {
          console.warn("[test_reports] Insert failed (continuing):", err instanceof Error ? err.message : err);
        }
      }
      console.log(`✓ test_reports: ${count} records`);
    }
  }

  // 20. test_reports (generated)
  if (!alreadySeeded && primaryDoctorId) {
    try {
      await seedTestReports(primaryDoctorId);
    } catch (err) {
      console.warn("[seedTestReports] failed (continuing):", err instanceof Error ? err.message : err);
    }
  }

  // 21. odontograms
  if (!alreadySeeded && data.odontograms?.length && patientIds.length > 0 && userIds.length > 0) {
    console.log("Seeding odontograms...");
    let count = 0;
    for (const row of data.odontograms as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const patientIdResolved = resolveFk(v.patientId as string, patientIds);
        const doctorIdResolved = resolveFk(v.doctorId as string, userIds, primaryDoctorId);
        const values = { ...v, patientId: patientIdResolved, doctorId: doctorIdResolved } as any;
        if (!patientIdResolved || !doctorIdResolved) continue;
        const [inserted] = await db.insert(odontograms).values(values).onConflictDoNothing().returning({ id: odontograms.id });
        if (inserted) count++;
      } catch (err) {
        console.warn("[odontograms] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ odontograms: ${count} records`);
  }

  // 22. invoices (resolve patient_id, appointment_id, doctor_id, service_id)
  if (!alreadySeeded && data.invoices?.length && patientIds.length > 0) {
    console.log("Seeding invoices...");
    for (const row of data.invoices as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const patientIdResolved = resolveFk(v.patientId as string, patientIds);
        const appointmentIdResolved = resolveFk(v.appointmentId as string, appointmentIds);
        const doctorIdResolved = resolveFk(v.doctorId as string, userIds, primaryDoctorId);
        const serviceIdResolved = resolveFk(v.serviceId as string, serviceIdList);
        const values = { ...v, patientId: patientIdResolved, appointmentId: appointmentIdResolved, doctorId: doctorIdResolved, serviceId: serviceIdResolved } as any;
        if (!patientIdResolved) continue;
        const [inserted] = await db.insert(invoices).values(values).onConflictDoNothing().returning({ id: invoices.id });
        if (inserted) invoiceIds.push(inserted.id);
      } catch (err) {
        console.warn("[invoices] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ invoices: ${invoiceIds.length} records`);
  }
  // Ensure invoiceIds available for invoice_items (from DB)
  if (data.invoice_items?.length && invoiceIds.length === 0) {
    const invRows = await db.select({ id: invoices.id }).from(invoices).limit(5000);
    invoiceIds = invRows.map((r) => r.id);
  }

  // 23. invoice_items (resolve invoice_id)
  if (!alreadySeeded && data.invoice_items?.length && invoiceIds.length > 0) {
    console.log("Seeding invoice_items...");
    let count = 0;
    for (const row of data.invoice_items as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const invoiceIdResolved = resolveFk(v.invoiceId as string, invoiceIds);
        const values = { ...v, invoiceId: invoiceIdResolved } as any;
        if (!invoiceIdResolved) continue;
        const [inserted] = await db.insert(invoiceItems).values(values).onConflictDoNothing().returning({ id: invoiceItems.id });
        if (inserted) count++;
      } catch (err) {
        console.warn("[invoice_items] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ invoice_items: ${count} records`);
  }

  // 24. payments (resolve patient_id, invoice_id)
  if (!alreadySeeded && data.payments?.length && patientIds.length > 0) {
    console.log("Seeding payments...");
    let count = 0;
    for (const row of data.payments as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const patientIdResolved = resolveFk(v.patientId as string, patientIds);
        const invoiceIdResolved = resolveFk(v.invoiceId as string, invoiceIds);
        const values = { ...v, patientId: patientIdResolved, invoiceId: invoiceIdResolved } as any;
        if (!patientIdResolved) continue;
        const [inserted] = await db.insert(payments).values(values).onConflictDoNothing().returning({ id: payments.id });
        if (inserted) count++;
      } catch (err) {
        console.warn("[payments] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ payments: ${count} records`);
  }

  // 25. expenses (resolve department_id, submitted_by, vendor_id, inventory_item_id)
  if (!alreadySeeded && data.expenses?.length && userIds.length > 0) {
    console.log("Seeding expenses...");
    let count = 0;
    for (const row of data.expenses as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const departmentIdResolved = resolveFk(v.departmentId as string, deptIds);
        const submittedByResolved = resolveFk(v.submittedBy as string, userIds, adminId);
        const vendorIdResolved = resolveFk(v.vendorId as string, labVendorIds);
        const inventoryItemIdResolved = resolveFk(v.inventoryItemId as string, inventoryIds);
        const values = { ...v, departmentId: departmentIdResolved, submittedBy: submittedByResolved, vendorId: vendorIdResolved, inventoryItemId: inventoryItemIdResolved } as any;
        const [inserted] = await db.insert(expenses).values(values).onConflictDoNothing().returning({ id: expenses.id });
        if (inserted) count++;
      } catch (err) {
        console.warn("[expenses] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ expenses: ${count} records`);
  }

  // 27. payroll (resolve staff_id)
  if (!alreadySeeded && data.payroll?.length && userIds.length > 0) {
    console.log("Seeding payroll...");
    let count = 0;
    for (const row of data.payroll as Record<string, unknown>[]) {
      try {
        const v = snakeToCamel(row) as Record<string, unknown>;
        const staffIdResolved = resolveFk(v.staffId as string, userIds);
        const values = { ...v, staffId: staffIdResolved } as any;
        if (!staffIdResolved) continue;
        const [inserted] = await db.insert(payroll).values(values).onConflictDoNothing().returning({ id: payroll.id });
        if (inserted) count++;
      } catch (err) {
        console.warn("[payroll] Insert failed (continuing):", err instanceof Error ? err.message : err);
      }
    }
    console.log(`✓ payroll: ${count} records`);
  }

  // 29. blog_categories
  const existingCategories = await db.select({ id: blogCategories.id }).from(blogCategories).limit(1);
  if (existingCategories.length === 0) {
    const blogSeedCategories = [
      { name: "News", description: "Clinic news, announcements, and updates.", color: "#1E88E5" },
      { name: "Tips & Advice", description: "Health tips and practical advice for patients.", color: "#43A047" },
      { name: "Treatments", description: "Information about treatments and procedures.", color: "#EC407A" },
      { name: "Updates", description: "General updates and seasonal information.", color: "#FF7043" },
    ];
    console.log("Seeding blog categories...");
    for (const row of blogSeedCategories) {
      await safeInsert("blog_categories", row, () =>
        db.insert(blogCategories).values({
          name: row.name,
          description: row.description,
          color: row.color,
        })
      );
    }
  }

  // 30. blog_posts
  const categoryRows = await db.select({ id: blogCategories.id }).from(blogCategories).orderBy(blogCategories.name);
  const categoryIds = categoryRows.map((c) => c.id);
  const defaultCategoryId = categoryIds[0] ?? null;
  const blogSeedPosts = [
    { title: "Welcome to Our Clinic", slug: "welcome-to-our-clinic", excerpt: "Learn about our services and how we care for you.", content: "We are committed to providing quality care.", published: true, authorId: adminId, commentsEnabled: true, categoryIndex: 0 },
    { title: "Healthy Habits for Better Oral Health", slug: "healthy-habits-oral-health", excerpt: "Tips to maintain your smile and prevent common issues.", content: "Brush twice daily, floss, and visit your dentist regularly.", published: true, authorId: adminId, commentsEnabled: true, categoryIndex: 1 },
    { title: "Understanding Your Treatment Options", slug: "understanding-treatment-options", excerpt: "A guide to the treatments we offer and when they help.", content: "From check-ups to specialized care, we are here to help.", published: true, authorId: adminId, commentsEnabled: true, categoryIndex: 2 },
    { title: "What to Expect on Your First Visit", slug: "what-to-expect-first-visit", excerpt: "Prepare for your first appointment with confidence.", content: "Bring your ID, insurance card if applicable, and any previous records.", published: true, authorId: adminId, commentsEnabled: true, categoryIndex: 0 },
  ];
  console.log("Seeding blog posts...");
  const authorIdResolved = userIds.length > 0 ? resolveFk(adminId, userIds) ?? userIds[0] : adminId;
  for (const row of blogSeedPosts) {
    const categoryId = row.categoryIndex != null && categoryIds[row.categoryIndex] ? categoryIds[row.categoryIndex] : defaultCategoryId;
    const authorId = authorIdResolved ?? (userIds[0] ?? null);
    if (!authorId) continue;
    await safeInsert("blog_posts", row, () =>
      db.insert(blogPosts).values({
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        content: row.content,
        published: row.published,
        publishedAt: new Date(),
        authorId,
        commentsEnabled: row.commentsEnabled,
        categoryId: categoryId ?? undefined,
      }).onConflictDoNothing({ target: blogPosts.slug })
    );
  }

  // Generators (run after base data; add more appointments, invoices, expenses, etc.)
  if (!alreadySeeded) {
    try {
      await shapeRevenueToTargets();
    } catch (err) {
      console.warn("[shapeRevenueToTargets] failed (continuing):", err instanceof Error ? err.message : err);
    }
    if (doctorIds.length > 0) {
      try {
        await seedBigClinic(doctorIds[0], serviceIdList, existingPatientCount);
      } catch (err) {
        console.warn("[seedBigClinic] failed (continuing):", err instanceof Error ? err.message : err);
      }
      try {
        await seedRealisticDashboardData(doctorIds, serviceIdList);
      } catch (err) {
        console.warn("[seedRealisticDashboardData] failed (continuing):", err instanceof Error ? err.message : err);
      }
      try {
        await seedRealisticExpenses(deptIds, adminId);
      } catch (err) {
        console.warn("[seedRealisticExpenses] failed (continuing):", err instanceof Error ? err.message : err);
      }
      try {
        await seedTodayAndCurrentMonthData(doctorIds, serviceIdList);
      } catch (err) {
        console.warn("[seedTodayAndCurrentMonthData] failed (continuing):", err instanceof Error ? err.message : err);
      }
      for (let i = 1; i < doctorIds.length; i++) {
        try {
          await seedDoctorAppointments(doctorIds[i], serviceIdList, i);
        } catch (err) {
          console.warn(`[seedDoctorAppointments ${i}] failed (continuing):`, err instanceof Error ? err.message : err);
        }
      }
    }
    try {
      const patientRows = await db.select({ id: patients.id }).from(patients).limit(100);
      const patientIdsForFinancial = patientRows.map((r) => r.id);
      const appointmentRows = await db.select({ id: appointments.id }).from(appointments).limit(100);
      const appointmentIdsForFinancial = appointmentRows.map((r) => r.id);
      await seedFinancialDemoDataIfEmpty(
        patientIdsForFinancial,
        appointmentIdsForFinancial,
        serviceIdList,
        primaryDoctorId,
        deptIds,
        adminId
      );
    } catch (err) {
      console.warn("[seedFinancialDemoDataIfEmpty] failed (continuing):", err instanceof Error ? err.message : err);
    }
  }

  // Last step: permissions (from DEFAULT_ROLE_PERMISSIONS; upsert so safe to run multiple times)
  try {
    await seedRolePermissions();
  } catch (err) {
    console.warn("[seedRolePermissions] failed (continuing):", err instanceof Error ? err.message : err);
  }

  console.log("Seed complete.");
  console.log(
    `Demo logins: use password "${DEMO_PASSWORD}" for admin@carenova.demo, doctor@carenova.demo, receptionist@carenova.demo, nurse@carenova.demo`
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
