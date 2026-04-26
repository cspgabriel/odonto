-- Migration: Create all tables and add new columns
-- Run this in Supabase SQL Editor
-- Date: 2025-02-12

-- ============================================
-- 1. Create Enums
-- ============================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'nurse');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('paid', 'unpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. Create DEPARTMENTS table (without head_id FK first due to circular dependency)
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    head_id UUID, -- Will add FK constraint later
    location TEXT,
    budget NUMERIC(12, 2),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS departments_name_idx ON departments(name);

-- ============================================
-- 3. Create USERS table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL,
    department_id UUID REFERENCES departments(id),
    phone TEXT,
    specialization TEXT,
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_department_id_idx ON users(department_id);

-- ============================================
-- 3b. Add head_id foreign key constraint to departments (after users exists)
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'departments_head_id_fkey'
    ) THEN
        ALTER TABLE departments 
        ADD CONSTRAINT departments_head_id_fkey 
        FOREIGN KEY (head_id) REFERENCES users(id);
    END IF;
END $$;

-- ============================================
-- 4. Create PATIENTS table
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    medical_history TEXT,
    allergies TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS patients_phone_idx ON patients(phone);
CREATE INDEX IF NOT EXISTS patients_full_name_idx ON patients(full_name);

-- ============================================
-- 5. Create SERVICES table
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    duration INTEGER,
    department_id UUID REFERENCES departments(id),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS services_name_idx ON services(name);
CREATE INDEX IF NOT EXISTS services_department_id_idx ON services(department_id);

-- ============================================
-- 6. Create APPOINTMENTS table
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    service_id UUID REFERENCES services(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    reminder_sent INTEGER DEFAULT 0,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appointments_doctor_id_idx ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON appointments(start_time);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
CREATE INDEX IF NOT EXISTS appointments_service_id_idx ON appointments(service_id);

-- ============================================
-- 7. Create INVOICES table
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) UNIQUE,
    total_amount NUMERIC(12, 2) NOT NULL,
    status invoice_status NOT NULL DEFAULT 'unpaid',
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    payment_method TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoices_appointment_id_idx ON invoices(appointment_id);

-- ============================================
-- 8. Create INVOICE_ITEMS table
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON invoice_items(invoice_id);

-- ============================================
-- 9. Create PRESCRIPTIONS table
-- ============================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    medication TEXT NOT NULL,
    dosage TEXT NOT NULL,
    instructions TEXT,
    frequency TEXT,
    duration TEXT,
    drug_interactions TEXT,
    pharmacy_name TEXT,
    pharmacy_address TEXT,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prescriptions_patient_id_idx ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS prescriptions_doctor_id_idx ON prescriptions(doctor_id);

-- ============================================
-- 10. Create LAB_VENDORS table
-- ============================================
CREATE TABLE IF NOT EXISTS lab_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    contract_terms TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lab_vendors_name_idx ON lab_vendors(name);

-- ============================================
-- 11. Create TEST_REPORTS table
-- ============================================
CREATE TABLE IF NOT EXISTS test_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    lab_vendor_id UUID REFERENCES lab_vendors(id),
    test_type TEXT NOT NULL,
    results TEXT NOT NULL,
    reference_values TEXT,
    notes TEXT,
    report_date DATE NOT NULL,
    quality_control TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS test_reports_patient_id_idx ON test_reports(patient_id);
CREATE INDEX IF NOT EXISTS test_reports_doctor_id_idx ON test_reports(doctor_id);
CREATE INDEX IF NOT EXISTS test_reports_lab_vendor_id_idx ON test_reports(lab_vendor_id);

-- ============================================
-- 12. Create INVENTORY table
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'unit',
    min_stock INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(12, 2),
    supplier TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_name_idx ON inventory(name);

-- ============================================
-- 13. Create PAYROLL table
-- ============================================
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES users(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary NUMERIC(12, 2) NOT NULL,
    bonuses NUMERIC(12, 2) DEFAULT '0',
    deductions NUMERIC(12, 2) DEFAULT '0',
    net_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payroll_staff_id_idx ON payroll(staff_id);

-- ============================================
-- Migration complete!
-- ============================================
