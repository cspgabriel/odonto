-- Migration: Add new columns for enhanced features
-- Run this in Supabase SQL Editor
-- Date: 2025-02-12

-- ============================================
-- 1. USERS TABLE - Add department and staff fields
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS hire_date DATE;

-- ============================================
-- 2. PATIENTS TABLE - Add allergies and emergency contacts
-- ============================================
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;

-- ============================================
-- 3. APPOINTMENTS TABLE - Add service and reminders
-- ============================================
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS reminder_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 4. DEPARTMENTS TABLE - Add location and budget
-- ============================================
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2);

-- ============================================
-- 5. SERVICES TABLE - Add department reference
-- ============================================
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- ============================================
-- 6. PRESCRIPTIONS TABLE - Add pharmacy and interaction fields
-- ============================================
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS frequency TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS drug_interactions TEXT,
ADD COLUMN IF NOT EXISTS pharmacy_name TEXT,
ADD COLUMN IF NOT EXISTS pharmacy_address TEXT;

-- ============================================
-- 7. TEST_REPORTS TABLE - Add lab vendor and quality control
-- ============================================
ALTER TABLE test_reports 
ADD COLUMN IF NOT EXISTS lab_vendor_id UUID REFERENCES lab_vendors(id),
ADD COLUMN IF NOT EXISTS reference_values TEXT,
ADD COLUMN IF NOT EXISTS quality_control TEXT;

-- ============================================
-- 8. LAB_VENDORS TABLE - Add contract fields
-- ============================================
ALTER TABLE lab_vendors 
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE,
ADD COLUMN IF NOT EXISTS contract_terms TEXT;

-- ============================================
-- 9. INVOICES TABLE - Add insurance and payment fields
-- ============================================
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- Create indexes for new foreign keys (optional but recommended)
-- ============================================
CREATE INDEX IF NOT EXISTS users_department_id_idx ON users(department_id);
CREATE INDEX IF NOT EXISTS appointments_service_id_idx ON appointments(service_id);
CREATE INDEX IF NOT EXISTS services_department_id_idx ON services(department_id);
CREATE INDEX IF NOT EXISTS test_reports_lab_vendor_id_idx ON test_reports(lab_vendor_id);

-- ============================================
-- Migration complete!
-- ============================================
