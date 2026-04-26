/**
 * CareNova – Database Schema (MVP)
 * Source of truth: DB_SCHEMA.md
 * ORM: Drizzle | Database: Supabase (PostgreSQL)
 * Auth: Supabase Auth – users.id = auth.users.id (set on insert, no default)
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  numeric,
  boolean,
  index,
  jsonb,
  varchar,
  unique,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums (from DB_SCHEMA.md only) ─────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "doctor",
  "receptionist",
  "nurse",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", ["paid", "unpaid", "cancelled"]);

export const clinicTypeEnum = pgEnum("clinic_type", [
  "general",
  "dental",
  "ophthalmology",
]);

// ─── Clinics (single-clinic mode: one row; type drives landing/dashboard UI) ─

export const clinics = pgTable("clinics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default("Dental Clinic"),
  type: clinicTypeEnum("type").notNull().default("general"),
  heroTagline: text("hero_tagline"),
  heroSubtitle: text("hero_subtitle"),
  keyBenefitsLine: text("key_benefits_line"),
  logoUrl: text("logo_url"),
  logoDarkUrl: text("logo_dark_url"), // Dark mode logo
  faviconUrl: text("favicon_url"), // Favicon
  siteName: text("site_name"),
  primaryColor: text("primary_color"),
  accentColor: text("accent_color"),
  heroBgColor: text("hero_bg_color"),
  footerText: text("footer_text"),
  // Dynamic landing page options
  heroLayout: text("hero_layout"), // centered, left-aligned, split
  heroAnimation: text("hero_animation"), // fade, slide, none
  sectionSpacing: text("section_spacing"), // compact, normal, spacious
  enableAnimations: boolean("enable_animations"),
  heroHeight: text("hero_height"), // full, medium, compact
  ctaButtonStyle: text("cta_button_style"), // primary, outline, ghost
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ctaText: text("cta_text"),
  ctaLink: text("cta_link"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),
  socialFacebook: text("social_facebook"),
  socialTwitter: text("social_twitter"),
  socialInstagram: text("social_instagram"),
  socialLinkedin: text("social_linkedin"),
  socialYoutube: text("social_youtube"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Users (Supabase Auth: id = auth.users.id, synced to public.users) ──────

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull(),
  departmentId: uuid("department_id"), // FK to departments.id (avoid circular ref in schema)
  phone: text("phone"),
  specialization: text("specialization"), // For doctors
  hireDate: date("hire_date", { mode: "string" }),
  /** When set, user can access dashboard. Null = pending admin approval (self-signup). After adding this column, run: UPDATE users SET approved_at = created_at WHERE approved_at IS NULL; */
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  /** When set, admin declined this user; they no longer appear in pending list. */
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Patients ───────────────────────────────────────────────────────────────

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    dateOfBirth: date("date_of_birth", { mode: "string" }).notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    gender: text("gender"),
    bloodGroup: text("blood_group"),
    height: text("height"),
    weight: text("weight"),
    address: text("address"),
    medicalHistory: text("medical_history"),
    allergies: text("allergies"), // Comma-separated or JSON
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    emergencyContactRelation: text("emergency_contact_relation"),
    primaryDoctorId: uuid("primary_doctor_id").references(() => users.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("patients_phone_idx").on(table.phone),
    index("patients_full_name_idx").on(table.fullName),
  ],
);

// ─── Appointments ───────────────────────────────────────────────────────────

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id),
    serviceId: uuid("service_id").references(() => services.id),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    reminderSent: integer("reminder_sent").default(0), // 0 = not sent, 1 = sent
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("appointments_doctor_id_idx").on(table.doctorId),
    index("appointments_patient_id_idx").on(table.patientId),
    index("appointments_start_time_idx").on(table.startTime),
    index("appointments_status_idx").on(table.status),
  ],
);

// ─── Medical Records (visit per appointment; auto-created on check-in) ────────

export const medicalRecords = pgTable(
  "medical_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id").references(() => users.id, { onDelete: "set null" }),
    appointmentId: uuid("appointment_id")
      .references(() => appointments.id, { onDelete: "set null" }),
    visitDate: timestamp("visit_date", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("open"), // open, completed, closed
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("medical_records_patient_id_idx").on(table.patientId),
    index("medical_records_appointment_id_idx").on(table.appointmentId),
  ]
);

// ─── Invoices ───────────────────────────────────────────────────────────────

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
    appointmentId: uuid("appointment_id")
      .references(() => appointments.id)
      .unique(),
    doctorId: uuid("doctor_id").references(() => users.id, { onDelete: "set null" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    invoiceNumber: text("invoice_number").unique(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    status: invoiceStatusEnum("status").notNull().default("unpaid"),
    discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
    taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    insuranceProvider: text("insurance_provider"),
    insurancePolicyNumber: text("insurance_policy_number"),
    paymentMethod: text("payment_method"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("invoices_appointment_id_idx").on(table.appointmentId),
    index("invoices_invoice_number_idx").on(table.invoiceNumber),
    index("invoices_patient_id_idx").on(table.patientId),
    index("invoices_doctor_id_idx").on(table.doctorId),
    index("invoices_service_id_idx").on(table.serviceId),
  ],
);

// ─── Invoice Items ──────────────────────────────────────────────────────────

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    itemType: text("item_type"),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("invoice_items_invoice_id_idx").on(table.invoiceId)],
);

// ─── Payments (standalone payment records or linked to invoice) ─────────────────

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: text("payment_method").notNull(),
    transactionId: text("transaction_id"),
    description: text("description").notNull(),
    status: text("status").notNull().default("completed"), // completed, pending, failed
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_patient_id_idx").on(table.patientId),
    index("payments_invoice_id_idx").on(table.invoiceId),
    index("payments_created_at_idx").on(table.createdAt),
    index("payments_status_idx").on(table.status),
  ]
);

// ─── Expenses (clinic expenses) ───────────────────────────────────────────────

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    category: text("category").notNull(),
    paymentMethod: text("payment_method").notNull(),
    status: text("status").notNull().default("pending"),
    date: timestamp("date", { withTimezone: true }).notNull(),
    vendor: text("vendor"),
    receiptUrl: text("receipt_url"),
    notes: text("notes"),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    submittedBy: uuid("submitted_by").references(() => users.id, { onDelete: "set null" }),
    vendorId: uuid("vendor_id").references(() => labVendors.id, { onDelete: "set null" }),
    inventoryItemId: uuid("inventory_item_id").references(() => inventory.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("expenses_date_idx").on(table.date),
    index("expenses_status_idx").on(table.status),
    index("expenses_category_idx").on(table.category),
    index("expenses_department_id_idx").on(table.departmentId),
    index("expenses_submitted_by_idx").on(table.submittedBy),
    index("expenses_vendor_id_idx").on(table.vendorId),
    index("expenses_inventory_item_id_idx").on(table.inventoryItemId),
  ]
);

// ─── Relations (DB_SCHEMA: Patient → Many Appointments, Doctor → Many, etc.) ─


export const paymentsRelations = relations(payments, ({ one }) => ({
  patient: one(patients, {
    fields: [payments.patientId],
    references: [patients.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  appointments: many(appointments),
  payments: many(payments),
  primaryDoctor: one(users, {
    fields: [patients.primaryDoctorId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [patients.departmentId],
    references: [departments.id],
  }),
  medicalRecords: many(medicalRecords),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  invoice: one(invoices),
  prescriptions: many(prescriptions),
  testReports: many(testReports),
  medicalRecords: many(medicalRecords),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  patient: one(patients, { fields: [medicalRecords.patientId], references: [patients.id] }),
  doctor: one(users, { fields: [medicalRecords.doctorId], references: [users.id] }),
  appointment: one(appointments, { fields: [medicalRecords.appointmentId], references: [appointments.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  appointment: one(appointments, {
    fields: [invoices.appointmentId],
    references: [appointments.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

// ─── Prescriptions ──────────────────────────────────────────────────────────────

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id),
    appointmentId: uuid("appointment_id").references(() => appointments.id),
    medication: text("medication").notNull(),
    dosage: text("dosage").notNull(),
    inventoryItemId: uuid("inventory_item_id").references(() => inventory.id, { onDelete: "set null" }),
    instructions: text("instructions"),
    frequency: text("frequency"), // e.g., "twice daily", "as needed"
    duration: text("duration"), // e.g., "7 days", "until finished"
    drugInteractions: text("drug_interactions"), // JSON array of interaction warnings
    pharmacyName: text("pharmacy_name"),
    pharmacyAddress: text("pharmacy_address"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("prescriptions_patient_id_idx").on(table.patientId),
    index("prescriptions_doctor_id_idx").on(table.doctorId),
  ]
);

// ─── Services ────────────────────────────────────────────────────────────────

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    duration: integer("duration").notNull().default(30), // in minutes
    departmentId: uuid("department_id").references(() => departments.id),
    isActive: integer("is_active").notNull().default(1),
    status: text("status").notNull().default("active"),
    category: varchar("category", { length: 100 }),
    maxBookingsPerDay: integer("max_bookings_per_day").default(20),
    followUpRequired: boolean("follow_up_required").default(false),
    prerequisites: text("prerequisites"),
    specialInstructions: text("special_instructions"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("services_name_idx").on(table.name)]
);

// ─── Departments ──────────────────────────────────────────────────────────────

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    headId: uuid("head_id").references(() => users.id),
    headOfDepartment: text("head_of_department"),
    code: varchar("code", { length: 20 }),
    location: text("location"),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    budget: numeric("budget", { precision: 12, scale: 2 }),
    annualBudget: numeric("annual_budget", { precision: 12, scale: 2 }).default("0"),
    isActive: integer("is_active").notNull().default(1),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("departments_name_idx").on(table.name)]
);

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category"),
    description: text("description"),
    manufacturer: varchar("manufacturer", { length: 255 }),
    batchNumber: varchar("batch_number", { length: 100 }),
    quantity: integer("quantity").notNull().default(0),
    unit: text("unit").notNull().default("unit"),
    minStock: integer("min_stock").notNull().default(0),
    price: numeric("price", { precision: 12, scale: 2 }),
    supplier: text("supplier"),
    supplierId: uuid("supplier_id").references(() => labVendors.id, { onDelete: "set null" }),
    expiryDate: date("expiry_date", { mode: "string" }),
    status: text("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("inventory_name_idx").on(table.name)]
);

// ─── Lab Vendors ──────────────────────────────────────────────────────────────

export const labVendors = pgTable(
  "lab_vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    code: text("code"), // e.g. LAB001
    labType: text("lab_type"), // Reference Lab, Specialty Lab, Diagnostic Lab, Imaging Center
    contactPerson: text("contact_person"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zipCode: text("zip_code"),
    website: text("website"),
    licenseNumber: text("license_number"),
    accreditations: text("accreditations"), // comma-separated: CLIA, CAP, AABB, etc.
    rating: numeric("rating", { precision: 2, scale: 1 }), // e.g. 3.1, 4.6
    specialties: text("specialties"), // comma-separated: Molecular, Chemistry, Pathology
    turnaroundHours: integer("turnaround_hours"), // 24, 48, 72
    tier: text("tier"), // budget, moderate, premium
    contractStartDate: date("contract_start_date", { mode: "string" }),
    contractEndDate: date("contract_end_date", { mode: "string" }),
    contractTerms: text("contract_terms"),
    isActive: integer("is_active").notNull().default(1),
    status: text("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("lab_vendors_name_idx").on(table.name)]
);

// ─── Staff (Operations roster; separate from auth users) ──────────────────────

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    role: text("role").notNull(), // admin, doctor, nurse, receptionist
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    salary: numeric("salary", { precision: 10, scale: 2 }).default("0"),
    qualifications: text("qualifications"),
    workSchedule: jsonb("work_schedule"),
    status: text("status").notNull().default("active"), // active, inactive, on_leave
    joinedDate: date("joined_date", { mode: "string" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("staff_department_id_idx").on(table.departmentId)]
);

// ─── Role Permissions ────────────────────────────────────────────────────────

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    role: varchar("role", { length: 50 }).notNull(),
    permissionKey: varchar("permission_key", { length: 100 }).notNull(),
    granted: boolean("granted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("role_permission_unique").on(table.role, table.permissionKey)]
);

// ─── Test Categories (Lab test catalog categories) ─────────────────────────────

export const testCategories = pgTable(
  "test_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    departmentId: uuid("department_id").references(() => departments.id),
    icon: text("icon"),
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("test_categories_name_idx").on(table.name)]
);

// ─── Test Methodologies ───────────────────────────────────────────────────────

export const testMethodologies = pgTable(
  "test_methodologies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    code: text("code"),
    categoryId: uuid("category_id").references(() => testCategories.id),
    description: text("description"),
    principles: text("principles"),
    equipment: text("equipment"),
    applications: text("applications"),
    advantages: text("advantages"),
    limitations: text("limitations"),
    sampleVolume: text("sample_volume"),
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("test_methodologies_name_idx").on(table.name)]
);

// ─── Turnaround Times ─────────────────────────────────────────────────────────

export const turnaroundTimes = pgTable(
  "turnaround_times",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    code: text("code"),
    priority: text("priority").notNull(),
    categoryId: uuid("category_id").references(() => testCategories.id),
    description: text("description"),
    duration: text("duration").notNull(),
    durationDisplay: text("duration_display"),
    durationMinutes: integer("duration_minutes"),
    slaCommitment: text("sla_commitment"),
    reportingHours: text("reporting_hours"),
    testExamples: text("test_examples"),
    businessRules: text("business_rules"),
    criticalNotes: text("critical_notes"),
    escalationProcedure: text("escalation_procedure"),
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("turnaround_times_priority_idx").on(table.priority)]
);

// ─── Sample Types ─────────────────────────────────────────────────────────────

export const sampleTypes = pgTable(
  "sample_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    code: text("code"),
    categoryId: uuid("category_id").references(() => testCategories.id),
    category: text("category"), // legacy: blood, other
    description: text("description"),
    collectionMethod: text("collection_method"),
    volumeRequired: text("volume_required"),
    containerType: text("container_type"),
    preservativeAnticoagulant: text("preservative_anticoagulant"),
    specialCollectionInstructions: text("special_collection_instructions"),
    storageTemperature: text("storage_temperature"),
    storageTimeStability: text("storage_time_stability"),
    processingTime: text("processing_time"),
    transportConditions: text("transport_conditions"),
    handlingRequirements: text("handling_requirements"),
    rejectionCriteria: text("rejection_criteria"),
    safetyPrecautions: text("safety_precautions"),
    commonTests: text("common_tests"),
    collection: text("collection"), // legacy
    storage: text("storage"), // legacy
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("sample_types_name_idx").on(table.name)]
);

// ─── Laboratory Tests (Test catalog) ──────────────────────────────────────────

export const laboratoryTests = pgTable(
  "laboratory_tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    testCode: text("test_code"),
    description: text("description"),
    categoryId: uuid("category_id").references(() => testCategories.id),
    sampleTypeId: uuid("sample_type_id").references(() => sampleTypes.id),
    methodologyId: uuid("methodology_id").references(() => testMethodologies.id),
    turnaroundTimeId: uuid("turnaround_time_id").references(() => turnaroundTimes.id),
    normalRange: text("normal_range"),
    units: text("units"),
    price: numeric("price", { precision: 12, scale: 2 }),
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("laboratory_tests_name_idx").on(table.name)]
);

// ─── Test Reports ──────────────────────────────────────────────────────────────

export const testReportStatusEnum = pgEnum("test_report_status", [
  "verified",
  "pending",
  "recorded",
  "delivered",
]);

export const testReports = pgTable(
  "test_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id),
    appointmentId: uuid("appointment_id").references(() => appointments.id),
    labVendorId: uuid("lab_vendor_id").references(() => labVendors.id),
    testId: uuid("test_id").references(() => laboratoryTests.id, { onDelete: "set null" }),
    testType: text("test_type").notNull(),
    results: text("results").notNull(),
    referenceValues: text("reference_values"), // JSON or text
    clinicalInterpretation: text("clinical_interpretation"),
    abnormalFindings: text("abnormal_findings"),
    recommendations: text("recommendations"),
    notes: text("notes"),
    reportDate: date("report_date", { mode: "string" }).notNull(),
    qualityControl: text("quality_control"), // JSON or text
    status: text("status").notNull().default("pending"), // verified, pending, recorded, delivered
    attachments: jsonb("attachments").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("test_reports_patient_id_idx").on(table.patientId),
    index("test_reports_doctor_id_idx").on(table.doctorId),
    index("test_reports_status_idx").on(table.status),
  ]
);

// ─── Payroll ──────────────────────────────────────────────────────────────────

export const payroll = pgTable(
  "payroll",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => users.id),
    periodStart: date("period_start", { mode: "string" }).notNull(),
    periodEnd: date("period_end", { mode: "string" }).notNull(),
    baseSalary: numeric("base_salary", { precision: 12, scale: 2 }).notNull(),
    bonuses: numeric("bonuses", { precision: 12, scale: 2 }).default("0"),
    deductions: numeric("deductions", { precision: 12, scale: 2 }).default("0"),
    netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
    status: text("status").notNull().default("pending"), // pending, paid
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("payroll_staff_id_idx").on(table.staffId)]
);

// ─── Additional Relations ─────────────────────────────────────────────────────

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [prescriptions.doctorId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [prescriptions.appointmentId],
    references: [appointments.id],
  }),
}));

export const testReportsRelations = relations(testReports, ({ one }) => ({
  patient: one(patients, {
    fields: [testReports.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [testReports.doctorId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [testReports.appointmentId],
    references: [appointments.id],
  }),
  labVendor: one(labVendors, {
    fields: [testReports.labVendorId],
    references: [labVendors.id],
  }),
  laboratoryTest: one(laboratoryTests, {
    fields: [testReports.testId],
    references: [laboratoryTests.id],
  }),
}));

export const testCategoriesRelations = relations(testCategories, ({ one, many }) => ({
  department: one(departments, {
    fields: [testCategories.departmentId],
    references: [departments.id],
  }),
  methodologies: many(testMethodologies),
  turnaroundTimes: many(turnaroundTimes),
  sampleTypes: many(sampleTypes),
  laboratoryTests: many(laboratoryTests),
}));

export const testMethodologiesRelations = relations(testMethodologies, ({ one, many }) => ({
  category: one(testCategories, {
    fields: [testMethodologies.categoryId],
    references: [testCategories.id],
  }),
  laboratoryTests: many(laboratoryTests),
}));

export const turnaroundTimesRelations = relations(turnaroundTimes, ({ one, many }) => ({
  category: one(testCategories, {
    fields: [turnaroundTimes.categoryId],
    references: [testCategories.id],
  }),
  laboratoryTests: many(laboratoryTests),
}));

export const sampleTypesRelations = relations(sampleTypes, ({ one, many }) => ({
  category: one(testCategories, {
    fields: [sampleTypes.categoryId],
    references: [testCategories.id],
  }),
  laboratoryTests: many(laboratoryTests),
}));

export const laboratoryTestsRelations = relations(laboratoryTests, ({ one, many }) => ({
  category: one(testCategories, {
    fields: [laboratoryTests.categoryId],
    references: [testCategories.id],
  }),
  sampleType: one(sampleTypes, {
    fields: [laboratoryTests.sampleTypeId],
    references: [sampleTypes.id],
  }),
  methodology: one(testMethodologies, {
    fields: [laboratoryTests.methodologyId],
    references: [testMethodologies.id],
  }),
  turnaroundTime: one(turnaroundTimes, {
    fields: [laboratoryTests.turnaroundTimeId],
    references: [turnaroundTimes.id],
  }),
  testReports: many(testReports),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  head: one(users, {
    fields: [departments.headId],
    references: [users.id],
  }),
  staff: many(users),
  operationsStaff: many(staff),
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  department: one(departments, {
    fields: [services.departmentId],
    references: [departments.id],
  }),
  appointments: many(appointments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  appointmentsAsDoctor: many(appointments),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  payrollRecords: many(payroll),
}));

// ─── Auth Audit Log (tracks every auth event) ─────────────────────────────────

export const authAuditLog = pgTable(
  "auth_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    email: varchar("email", { length: 255 }),
    event: varchar("event", { length: 50 }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("auth_audit_log_user_id_idx").on(table.userId),
    index("auth_audit_log_created_at_idx").on(table.createdAt),
  ]
);

// ─── License (Envato purchase code verification) ─────────────────────────────

export const license = pgTable("license", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseCode: text("purchase_code").notNull().unique(),
  buyerUsername: text("buyer_username"),
  domain: text("domain").notNull(),
  activatedAt: timestamp("activated_at", { withTimezone: true }).notNull().defaultNow(),
  isValid: boolean("is_valid").notNull().default(true),
  envatoData: jsonb("envato_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Login Attempts (rate limiting) ──────────────────────────────────────────

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
    success: boolean("success").notNull().default(false),
  },
  (table) => [
    index("login_attempts_email_idx").on(table.email),
    index("login_attempts_attempted_at_idx").on(table.attemptedAt),
    index("login_attempts_ip_address_idx").on(table.ipAddress),
  ]
);

// ─── Active Sessions (session management) ────────────────────────────────────

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceInfo: varchar("device_info", { length: 255 }),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isRevoked: boolean("is_revoked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations (lab vendors) ─────────────────────────────────────────────────

export const labVendorsRelations = relations(labVendors, ({ many }) => ({
  testReports: many(testReports),
  inventory: many(inventory),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  supplier: one(labVendors, {
    fields: [inventory.supplierId],
    references: [labVendors.id],
  }),
}));

export const staffRelations = relations(staff, ({ one }) => ({
  department: one(departments, {
    fields: [staff.departmentId],
    references: [departments.id],
  }),
}));

export const payrollRelations = relations(payroll, ({ one }) => ({
  staff: one(users, {
    fields: [payroll.staffId],
    references: [users.id],
  }),
}));

// ─── Blog Categories (for badge name + color on landing) ───────────────────────

export const blogCategories = pgTable("blog_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"), // Hex e.g. #0F766E; null = use random from palette
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content"), // Markdown content
    coverImage: text("cover_image"),
    authorId: uuid("author_id").references(() => users.id),
    customAuthorName: text("custom_author_name"), // Display name override
    categoryId: uuid("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
    published: boolean("published").default(false).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    tags: text("tags"), // Comma-separated tags
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    readingTime: integer("reading_time"), // Estimated minutes
    commentsEnabled: boolean("comments_enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("blog_posts_slug_idx").on(table.slug),
    index("blog_posts_published_idx").on(table.published),
    index("blog_posts_author_id_idx").on(table.authorId),
    index("blog_posts_category_id_idx").on(table.categoryId),
  ]
);

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  comments: many(blogComments),
}));

// ─── Blog Comments ────────────────────────────────────────────────────────────

export const blogComments = pgTable(
  "blog_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    content: text("content").notNull(),
    approved: boolean("approved").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("blog_comments_post_id_idx").on(table.postId),
  ]
);

export const blogCommentsRelations = relations(blogComments, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogComments.postId],
    references: [blogPosts.id],
  }),
}));

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // Can be null for general admin notifications
    type: text("type").notNull(), // 'appointment', 'comment', etc.
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    link: text("link"), // URL to redirect
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
  ]
);

// ─── Landing Page Settings ────────────────────────────────────────────────────

export const landingPageSettings = pgTable(
  "landing_page_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" })
      .unique(),
    clinicType: clinicTypeEnum("clinic_type").notNull().default("general"),
    branding: jsonb("branding").$type<{
      primaryLogoUrl?: string | null;
      darkLogoUrl?: string | null;
      faviconUrl?: string | null;
      brandName?: string | null;
    }>(),
    colors: jsonb("colors").$type<{
      primary?: string | null;
      secondary?: string | null;
      accent?: string | null;
      background?: string | null;
      textPrimary?: string | null;
      textSecondary?: string | null;
      buttonHover?: string | null;
      success?: string | null;
      error?: string | null;
    }>(),
    content: jsonb("content").$type<{
      hero?: {
        headline?: string | null;
        subtitle?: string | null;
        ctaPrimary?: string | null;
        ctaSecondary?: string | null;
        imageUrl?: string | null;
        rating?: number | null;
        reviewCount?: number | null;
        patientCount?: number | null;
      } | null;
      cookieNotice?: {
        enabled?: boolean | null;
        message?: string | null;
        linkUrl?: string | null;
        linkText?: string | null;
      } | null;
      features?: {
        enableDarkModeToggle?: boolean | null;
        enableLanguageSwitcher?: boolean | null;
        enableStickyNavbar?: boolean | null;
        supportedLanguages?: string[] | null;
        enableTopBar?: boolean | null;
        topBarType?: "info" | "custom" | null;
        topBarCustomText?: string | null;
        topBarCustomBgColor?: string | null;
      } | null;
      services?: Array<{
        title?: string | null;
        description?: string | null;
        iconUrl?: string | null;
      }> | null;
      aboutDoctor?: {
        sectionTitle?: string | null;
        doctorName?: string | null;
        doctorTitle?: string | null;
        doctorImageUrl?: string | null;
        paragraph1?: string | null;
        paragraph2?: string | null;
        checkmark1?: string | null;
        checkmark2?: string | null;
        checkmark3?: string | null;
        checkmark4?: string | null;
        yearsOfExperience?: number | null;
        totalPatients?: number | null;
      } | null;
      dentalHealth?: {
        sectionTitle?: string | null;
        mainParagraph?: string | null;
        stat1Number?: number | null;
        stat1Label?: string | null;
        stat2Number?: number | null;
        stat2Label?: string | null;
        stat3Number?: number | null;
        stat3Label?: string | null;
        imageUrl?: string | null;
      } | null;
      smileComparison?: {
        sectionTitle?: string | null;
        beforeImageUrl?: string | null;
        afterImageUrl?: string | null;
      } | null;
      pricing?: {
        sectionTitle?: string | null;
        plans?: Array<{
          name?: string | null;
          price?: number | null;
          currency?: string | null;
          features?: string[] | null;
          ctaText?: string | null;
          featured?: boolean | null;
        }> | null;
      } | null;
      testimonials?: {
        sectionTitle?: string | null;
        reviews?: Array<{
          name?: string | null;
          role?: string | null;
          text?: string | null;
          avatarUrl?: string | null;
          rating?: number | null;
        }> | null;
      } | null;
      whyChooseUs?: {
        sectionTitle?: string | null;
        reasons?: Array<{
          title?: string | null;
          description?: string | null;
          iconUrl?: string | null;
        }> | null;
      } | null;
    }>(),
    seo: jsonb("seo").$type<{
      metaTitle?: string | null;
      metaDescription?: string | null;
      metaKeywords?: string | null;
      ogImageUrl?: string | null;
      ogTitle?: string | null;
      ogDescription?: string | null;
      twitterCardType?: string | null;
      canonicalUrl?: string | null;
      robots?: string | null;
    }>(),
    typography: jsonb("typography").$type<{
      headingFont?: string | null;
      bodyFont?: string | null;
      fontSize?: string | null;
      lineHeight?: string | null;
    }>(),
    cta: jsonb("cta").$type<{
      sectionTitle?: string | null;
      description?: string | null;
      formFields?: {
        name?: boolean | null;
        email?: boolean | null;
        phone?: boolean | null;
        service?: boolean | null;
        message?: boolean | null;
      } | null;
      submitButtonText?: string | null;
      successMessage?: string | null;
      errorMessage?: string | null;
      emailNotifications?: boolean | null;
    }>(),
    contact: jsonb("contact").$type<{
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      mapsUrl?: string | null;
      openingHours?: Array<{
        day?: string | null;
        time?: string | null;
      }> | null;
      whatsappNumber?: string | null;
      emergencyContact?: string | null;
    }>(),
    social: jsonb("social").$type<{
      facebook?: string | null;
      instagram?: string | null;
      twitter?: string | null;
      linkedin?: string | null;
      youtube?: string | null;
      tiktok?: string | null;
      enabled?: {
        facebook?: boolean | null;
        instagram?: boolean | null;
        twitter?: boolean | null;
        linkedin?: boolean | null;
        youtube?: boolean | null;
        tiktok?: boolean | null;
      } | null;
    }>(),
    footer: jsonb("footer").$type<{
      logoUrl?: string | null;
      companyDescription?: string | null;
      quickLinks?: Array<{
        label?: string | null;
        url?: string | null;
      }> | null;
      serviceLinks?: Array<{
        label?: string | null;
        url?: string | null;
      }> | null;
      copyrightText?: string | null;
      privacyPolicyLink?: string | null;
      termsLink?: string | null;
      backgroundColor?: string | null;
    }>(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("landing_page_settings_clinic_id_idx").on(table.clinicId),
  ]
);

export const landingPageSettingsRelations = relations(
  landingPageSettings,
  ({ one }) => ({
    clinic: one(clinics, {
      fields: [landingPageSettings.clinicId],
      references: [clinics.id],
    }),
  })
);

// ─── Odontograms ──────────────────────────────────────────────────────────────

export const odontograms = pgTable(
  "odontograms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id").references(() => users.id),
    status: text("status").notNull().default("active"), // active, completed, archived
    version: integer("version").notNull().default(1),
    examinedAt: timestamp("examined_at", { withTimezone: true }).defaultNow().notNull(),
    toothData: jsonb("tooth_data").default([]), // Array of tooth conditions/treatments
    diagnosis: text("diagnosis"),
    notes: text("notes"),
    treatments: jsonb("treatments").default([]), // Optional treatment plans
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("odontograms_patient_id_idx").on(table.patientId),
  ]
);

export const odontogramsRelations = relations(odontograms, ({ one }) => ({
  patient: one(patients, {
    fields: [odontograms.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [odontograms.doctorId],
    references: [users.id],
  }),
}));

// ─── Medical Records (non-dental clinics) ──────────────────────────────────────

export const diagnosisStatusEnum = pgEnum("diagnosis_status", ["active", "resolved"]);

export const medicalRecordVitals = pgTable(
  "medical_record_vitals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    recordedById: uuid("recorded_by_id").references(() => users.id),
    bloodPressureSystolic: integer("blood_pressure_systolic"),
    bloodPressureDiastolic: integer("blood_pressure_diastolic"),
    heartRate: integer("heart_rate"),
    temperature: numeric("temperature", { precision: 4, scale: 1 }),
    weight: numeric("weight", { precision: 5, scale: 2 }),
    height: numeric("height", { precision: 5, scale: 2 }),
    bmi: numeric("bmi", { precision: 4, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("medical_record_vitals_patient_id_idx").on(table.patientId),
    index("medical_record_vitals_recorded_at_idx").on(table.recordedAt),
  ]
);

export const clinicalNotes = pgTable(
  "clinical_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    appointmentId: uuid("appointment_id").references(() => appointments.id),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("clinical_notes_patient_id_idx").on(table.patientId),
    index("clinical_notes_created_at_idx").on(table.createdAt),
  ]
);

export const diagnoses = pgTable(
  "diagnoses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    icdCode: text("icd_code"),
    status: diagnosisStatusEnum("status").notNull().default("active"),
    diagnosedAt: timestamp("diagnosed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("diagnoses_patient_id_idx").on(table.patientId),
    index("diagnoses_status_idx").on(table.status),
  ]
);

export const medicalAttachments = pgTable(
  "medical_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("medical_attachments_patient_id_idx").on(table.patientId),
  ]
);

export const medicalRecordVitalsRelations = relations(medicalRecordVitals, ({ one }) => ({
  patient: one(patients, { fields: [medicalRecordVitals.patientId], references: [patients.id] }),
  recordedBy: one(users, { fields: [medicalRecordVitals.recordedById], references: [users.id] }),
}));

export const clinicalNotesRelations = relations(clinicalNotes, ({ one }) => ({
  patient: one(patients, { fields: [clinicalNotes.patientId], references: [patients.id] }),
  author: one(users, { fields: [clinicalNotes.authorId], references: [users.id] }),
  appointment: one(appointments, { fields: [clinicalNotes.appointmentId], references: [appointments.id] }),
}));

export const diagnosesRelations = relations(diagnoses, ({ one }) => ({
  patient: one(patients, { fields: [diagnoses.patientId], references: [patients.id] }),
  doctor: one(users, { fields: [diagnoses.doctorId], references: [users.id] }),
}));

export const medicalAttachmentsRelations = relations(medicalAttachments, ({ one }) => ({
  patient: one(patients, { fields: [medicalAttachments.patientId], references: [patients.id] }),
  appointment: one(appointments, { fields: [medicalAttachments.appointmentId], references: [appointments.id] }),
}));
