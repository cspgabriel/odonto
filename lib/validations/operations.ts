import { z } from "zod";

// ─── Departments ───────────────────────────────────────────
export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
  headOfDepartment: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  code: z.string().max(20).optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  annualBudget: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema
  .omit({ status: true })
  .extend({
    departmentId: z.string().uuid(),
    status: z.enum(["active", "inactive"]).optional(),
    location: z.string().optional().nullable(),
    budget: z.string().optional().nullable(),
  });

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

// ─── Services ──────────────────────────────────────────────
const serviceCategoryEnum = z.enum([
  "consultation",
  "specialist_consultation",
  "diagnostic",
  "treatment",
  "imaging",
  "preventive",
  "emergency",
  "surgery",
  "therapy",
]);

export const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  price: z.string().min(1, "Price is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  status: z.enum(["active", "inactive"]).default("active"),
  category: serviceCategoryEnum.optional(),
  maxBookingsPerDay: z.coerce.number().min(1).default(20),
  followUpRequired: z.boolean().default(false),
  prerequisites: z.string().optional(),
  specialInstructions: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema
  .omit({ status: true, duration: true })
  .extend({
    serviceId: z.string().uuid(),
    status: z.enum(["active", "inactive"]).optional(),
    duration: z.coerce.number().min(1).optional(),
  });

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// ─── Lab Vendors ───────────────────────────────────────────
const VENDOR_TYPES = ["Reference Lab", "Specialty Lab", "Diagnostic Lab", "Imaging Center"] as const;
const PRICING_TIERS = ["budget", "moderate", "premium"] as const;

export const createLabVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  code: z.string().optional().nullable(),
  labType: z.enum(VENDOR_TYPES).optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  accreditations: z.string().optional().nullable(), // comma-separated
  specialties: z.string().optional().nullable(), // comma-separated
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  tier: z.enum(PRICING_TIERS).optional().nullable(),
  contractStart: z.string().optional().nullable(),
  contractEnd: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "pending"]).default("active"),
});

export const updateLabVendorSchema = createLabVendorSchema.extend({
  vendorId: z.string().uuid(),
});

export type CreateLabVendorInput = z.infer<typeof createLabVendorSchema>;
export type UpdateLabVendorInput = z.infer<typeof updateLabVendorSchema>;

// ─── Inventory ─────────────────────────────────────────────
export const createInventorySchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().optional(),
  stockQuantity: z.coerce.number().min(0, "Stock cannot be negative"),
  reorderLevel: z.coerce.number().min(0, "Reorder level cannot be negative"),
  unit: z.string().optional(),
  costPerUnit: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  status: z.enum(["active", "inactive", "discontinued"]).default("active"),
  notes: z.string().optional(),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  batchNumber: z.string().optional(),
});

export const updateInventorySchema = createInventorySchema.extend({
  itemId: z.string().uuid(),
  recordAsExpense: z.boolean().optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

// ─── Staff ─────────────────────────────────────────────────
const workScheduleDaySchema = z.object({
  enabled: z.boolean(),
  from: z.string(),
  to: z.string(),
});

export const createStaffSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["admin", "doctor", "nurse", "receptionist"]),
  departmentId: z.string().uuid().optional().nullable(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  status: z.enum(["approved", "pending", "rejected"]).default("pending"),
  joinedDate: z.string().optional().nullable(),
  notes: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address: z.string().optional(),
  salary: z.string().optional(),
  qualifications: z.string().optional(),
  workSchedule: z
    .object({
      monday: workScheduleDaySchema,
      tuesday: workScheduleDaySchema,
      wednesday: workScheduleDaySchema,
      thursday: workScheduleDaySchema,
      friday: workScheduleDaySchema,
      saturday: workScheduleDaySchema,
      sunday: workScheduleDaySchema,
    })
    .optional(),
});

export const updateStaffSchema = createStaffSchema.extend({
  staffId: z.string().uuid(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ─── Permissions ───────────────────────────────────────────
export const permissionKeys = [
  "analytics.dashboard",
  "analytics.export",
  "analytics.reports",
  "appointments.view",
  "appointments.create",
  "appointments.edit",
  "appointments.delete",
  "appointments.assign",
  "appointments.reschedule",
  "appointments.cancel",
  "appointments.export",
  "patients.view",
  "patients.create",
  "patients.edit",
  "patients.delete",
  "patients.export",
  "billing.view",
  "billing.create",
  "billing.edit",
  "billing.delete",
  "billing.export",
  "medical_records.view",
  "medical_records.create",
  "medical_records.edit",
  "medical_records.delete",
  "prescriptions.view",
  "prescriptions.create",
  "prescriptions.edit",
  "prescriptions.delete",
  "test_reports.view",
  "test_reports.create",
  "test_reports.edit",
  "test_reports.delete",
  "inventory.view",
  "inventory.create",
  "inventory.edit",
  "inventory.delete",
  "staff.view",
  "staff.create",
  "staff.edit",
  "staff.delete",
  "services.view",
  "services.create",
  "services.edit",
  "services.delete",
  "departments.view",
  "departments.create",
  "departments.edit",
  "departments.delete",
  "settings.view",
  "settings.edit",
  "odontogram.view",
  "odontogram.create",
  "odontogram.edit",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];

export const updateRolePermissionsSchema = z.object({
  role: z.enum(["admin", "doctor", "nurse", "receptionist"]),
  permissions: z.array(
    z.object({
      key: z.enum(permissionKeys),
      granted: z.boolean(),
    })
  ),
});
