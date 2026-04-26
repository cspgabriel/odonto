-- Migration: Add missing tables and columns to existing database
-- Run this in Supabase SQL Editor
-- Date: 2025-02-12
-- This script works with your existing database schema

-- ============================================
-- 1. Create Enums (if they don't exist)
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
-- 2. Create DEPARTMENTS table (needed first)
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    head_id UUID, -- FK will be added later after users table is updated
    location TEXT,
    budget NUMERIC(12, 2),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS departments_name_idx ON departments(name);

-- ============================================
-- 3. Add missing columns to USERS table
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department_id UUID,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add foreign key constraint for department_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_department_id_fkey'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_department_id_fkey 
        FOREIGN KEY (department_id) REFERENCES departments(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS users_department_id_idx ON users(department_id);

-- ============================================
-- 4. Add missing columns to PATIENTS table
-- ============================================
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;

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
-- 6. Add missing columns to APPOINTMENTS table
-- ============================================
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS reminder_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS appointments_service_id_idx ON appointments(service_id);

-- ============================================
-- 7. Add missing columns to INVOICES table
-- ============================================
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 8. Create PRESCRIPTIONS table
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
-- 9. Create LAB_VENDORS table
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
-- 10. Create TEST_REPORTS table
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
-- 11. Create INVENTORY table
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
-- 12. Create PAYROLL table
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
-- 13. Add head_id foreign key constraint to departments (after users is updated)
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
-- Migration complete!
-- ============================================
