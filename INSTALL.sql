-- ============================================
-- CareNova — Master Installation SQL
-- Version: 1.0.0
--
-- Instructions:
-- 1. Open your Supabase project
-- 2. Go to SQL Editor
-- 3. Paste this entire file
-- 4. Click Run
-- 5. All tables and policies will be created
--
-- Safe to run multiple times (idempotent)
-- ============================================

-- ============================================
-- SECTION: Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SECTION: Enum Types
-- ============================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'nurse');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('paid', 'unpaid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE invoice_status ADD VALUE 'cancelled';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE clinic_type AS ENUM ('general', 'dental', 'ophthalmology');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE test_report_status AS ENUM ('verified', 'pending', 'recorded', 'delivered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE diagnosis_status AS ENUM ('active', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- SECTION: Core Tables (no FKs or FKs to same batch)
-- ============================================

-- clinics
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Dental Clinic',
  type clinic_type NOT NULL DEFAULT 'general',
  hero_tagline text,
  hero_subtitle text,
  key_benefits_line text,
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  site_name text,
  primary_color text,
  accent_color text,
  hero_bg_color text,
  footer_text text,
  hero_layout text,
  hero_animation text,
  section_spacing text,
  enable_animations boolean,
  hero_height text,
  cta_button_style text,
  meta_title text,
  meta_description text,
  cta_text text,
  cta_link text,
  contact_email text,
  contact_phone text,
  contact_address text,
  social_facebook text,
  social_twitter text,
  social_instagram text,
  social_linkedin text,
  social_youtube text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- departments (head_id FK added after users)
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  head_id uuid,
  head_of_department text,
  code varchar(20),
  location text,
  phone varchar(50),
  email varchar(255),
  budget numeric(12, 2),
  annual_budget numeric(12, 2) DEFAULT 0,
  is_active integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role user_role NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  phone text,
  specialization text,
  hire_date date,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_department_id_idx ON users(department_id);

-- head_id FK (after users exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'departments_head_id_fkey') THEN
    ALTER TABLE departments ADD CONSTRAINT departments_head_id_fkey FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- patients
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  phone text NOT NULL,
  email text,
  gender text,
  blood_group text,
  height text,
  weight text,
  address text,
  medical_history text,
  allergies text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  primary_doctor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patients_phone_idx ON patients(phone);
CREATE INDEX IF NOT EXISTS patients_full_name_idx ON patients(full_name);

-- services
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(12, 2) NOT NULL,
  duration integer NOT NULL DEFAULT 30,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  is_active integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  category varchar(100),
  max_bookings_per_day integer DEFAULT 20,
  follow_up_required boolean DEFAULT false,
  prerequisites text,
  special_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS services_name_idx ON services(name);

-- lab_vendors
CREATE TABLE IF NOT EXISTS lab_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  lab_type text,
  contact_person text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  website text,
  license_number text,
  accreditations text,
  rating numeric(2, 1),
  specialties text,
  turnaround_hours integer,
  tier text,
  contract_start_date date,
  contract_end_date date,
  contract_terms text,
  is_active integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_vendors_name_idx ON lab_vendors(name);

-- inventory
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  description text,
  manufacturer varchar(255),
  batch_number varchar(100),
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'unit',
  min_stock integer NOT NULL DEFAULT 0,
  price numeric(12, 2),
  supplier text,
  supplier_id uuid REFERENCES lab_vendors(id) ON DELETE SET NULL,
  expiry_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_name_idx ON inventory(name);

-- appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES users(id),
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes text,
  reminder_sent integer DEFAULT 0,
  reminder_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_doctor_id_idx ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON appointments(start_time);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);

-- medical_records
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  visit_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medical_records_patient_id_idx ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS medical_records_appointment_id_idx ON medical_records(appointment_id);

-- invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL UNIQUE,
  doctor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  invoice_number text UNIQUE,
  total_amount numeric(12, 2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'unpaid',
  discount numeric(12, 2) NOT NULL DEFAULT 0,
  tax_percent numeric(5, 2) NOT NULL DEFAULT 0,
  notes text,
  insurance_provider text,
  insurance_policy_number text,
  payment_method text,
  paid_at timestamptz,
  issued_at timestamptz NOT NULL,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_appointment_id_idx ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS invoices_invoice_number_idx ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS invoices_patient_id_idx ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS invoices_doctor_id_idx ON invoices(doctor_id);
CREATE INDEX IF NOT EXISTS invoices_service_id_idx ON invoices(service_id);

-- invoice_items
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  item_type text,
  quantity integer NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON invoice_items(invoice_id);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount numeric(12, 2) NOT NULL,
  payment_method text NOT NULL,
  transaction_id text,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_patient_id_idx ON payments(patient_id);
CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  amount numeric(12, 2) NOT NULL,
  category text NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  date timestamptz NOT NULL,
  vendor text,
  receipt_url text,
  notes text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  submitted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES lab_vendors(id) ON DELETE SET NULL,
  inventory_item_id uuid REFERENCES inventory(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);
CREATE INDEX IF NOT EXISTS expenses_status_idx ON expenses(status);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);
CREATE INDEX IF NOT EXISTS expenses_department_id_idx ON expenses(department_id);
CREATE INDEX IF NOT EXISTS expenses_submitted_by_idx ON expenses(submitted_by);
CREATE INDEX IF NOT EXISTS expenses_vendor_id_idx ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS expenses_inventory_item_id_idx ON expenses(inventory_item_id);

-- prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES users(id),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  medication text NOT NULL,
  dosage text NOT NULL,
  inventory_item_id uuid REFERENCES inventory(id) ON DELETE SET NULL,
  instructions text,
  frequency text,
  duration text,
  drug_interactions text,
  pharmacy_name text,
  pharmacy_address text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prescriptions_patient_id_idx ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS prescriptions_doctor_id_idx ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS prescriptions_inventory_item_id_idx ON prescriptions(inventory_item_id);

-- staff
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  first_name varchar(100),
  last_name varchar(100),
  role text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  phone text,
  email text,
  address text,
  salary numeric(10, 2) DEFAULT 0,
  qualifications text,
  work_schedule jsonb,
  status text NOT NULL DEFAULT 'active',
  joined_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_department_id_idx ON staff(department_id);

-- role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role varchar(50) NOT NULL,
  permission_key varchar(100) NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_permission_unique UNIQUE (role, permission_key)
);

-- test_categories
CREATE TABLE IF NOT EXISTS test_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  icon text,
  is_active integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS test_categories_name_idx ON test_categories(name);

-- test_methodologies
CREATE TABLE IF NOT EXISTS test_methodologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  category_id uuid REFERENCES test_categories(id) ON DELETE SET NULL,
  description text,
  principles text,
  equipment text,
  applications text,
  advantages text,
  limitations text,
  sample_volume text,
  is_active integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS test_methodologies_name_idx ON test_methodologies(name);

-- turnaround_times
CREATE TABLE IF NOT EXISTS turnaround_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  priority text NOT NULL,
  category_id uuid REFERENCES test_categories(id) ON DELETE SET NULL,
  description text,
  duration text NOT NULL,
  duration_display text,
  duration_minutes integer,
  sla_commitment text,
  reporting_hours text,
  test_examples text,
  business_rules text,
  critical_notes text,
  escalation_procedure text,
  is_active integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS turnaround_times_priority_idx ON turnaround_times(priority);

-- sample_types
CREATE TABLE IF NOT EXISTS sample_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  category_id uuid REFERENCES test_categories(id) ON DELETE SET NULL,
  category text,
  description text,
  collection_method text,
  volume_required text,
  container_type text,
  preservative_anticoagulant text,
  special_collection_instructions text,
  storage_temperature text,
  storage_time_stability text,
  processing_time text,
  transport_conditions text,
  handling_requirements text,
  rejection_criteria text,
  safety_precautions text,
  common_tests text,
  collection text,
  storage text,
  is_active integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sample_types_name_idx ON sample_types(name);

-- laboratory_tests
CREATE TABLE IF NOT EXISTS laboratory_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  test_code text,
  description text,
  category_id uuid REFERENCES test_categories(id) ON DELETE SET NULL,
  sample_type_id uuid REFERENCES sample_types(id) ON DELETE SET NULL,
  methodology_id uuid REFERENCES test_methodologies(id) ON DELETE SET NULL,
  turnaround_time_id uuid REFERENCES turnaround_times(id) ON DELETE SET NULL,
  normal_range text,
  units text,
  price numeric(12, 2),
  is_active integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS laboratory_tests_name_idx ON laboratory_tests(name);

-- test_reports
CREATE TABLE IF NOT EXISTS test_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES users(id),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  lab_vendor_id uuid REFERENCES lab_vendors(id) ON DELETE SET NULL,
  test_id uuid REFERENCES laboratory_tests(id) ON DELETE SET NULL,
  test_type text NOT NULL,
  results text NOT NULL,
  reference_values text,
  clinical_interpretation text,
  abnormal_findings text,
  recommendations text,
  notes text,
  report_date date NOT NULL,
  quality_control text,
  status text NOT NULL DEFAULT 'pending',
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS test_reports_patient_id_idx ON test_reports(patient_id);
CREATE INDEX IF NOT EXISTS test_reports_doctor_id_idx ON test_reports(doctor_id);
CREATE INDEX IF NOT EXISTS test_reports_status_idx ON test_reports(status);
CREATE INDEX IF NOT EXISTS test_reports_lab_vendor_id_idx ON test_reports(lab_vendor_id);

-- payroll
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES users(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_salary numeric(12, 2) NOT NULL,
  bonuses numeric(12, 2) DEFAULT 0,
  deductions numeric(12, 2) DEFAULT 0,
  net_amount numeric(12, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payroll_staff_id_idx ON payroll(staff_id);

CREATE TABLE IF NOT EXISTS license (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_code text NOT NULL UNIQUE,
  buyer_username text,
  domain text NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  is_valid boolean NOT NULL DEFAULT true,
  envato_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- SECTION: Auth / Audit Tables
-- ============================================
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email varchar(255),
  event varchar(50) NOT NULL,
  ip_address varchar(45),
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_audit_log_user_id_idx ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS auth_audit_log_created_at_idx ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created ON auth_audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  ip_address varchar(45),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts(email);
CREATE INDEX IF NOT EXISTS login_attempts_attempted_at_idx ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS login_attempts_ip_address_idx ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup ON login_attempts(email, success, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, success, attempted_at DESC);

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token varchar(255) NOT NULL UNIQUE,
  ip_address varchar(45),
  user_agent text,
  device_info varchar(255),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, is_revoked);

-- ============================================
-- SECTION: Blog
-- ============================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image text,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  custom_author_name text,
  category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  tags text,
  seo_title text,
  seo_description text,
  reading_time integer,
  comments_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts(published);
CREATE INDEX IF NOT EXISTS blog_posts_author_id_idx ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS blog_posts_category_id_idx ON blog_posts(category_id);

CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  content text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_comments_post_id_idx ON blog_comments(post_id);

-- ============================================
-- SECTION: Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- ============================================
-- SECTION: Landing Page Settings
-- ============================================
CREATE TABLE IF NOT EXISTS landing_page_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
  clinic_type clinic_type NOT NULL DEFAULT 'general',
  branding jsonb,
  colors jsonb,
  content jsonb,
  seo jsonb,
  typography jsonb,
  cta jsonb,
  contact jsonb,
  social jsonb,
  footer jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS landing_page_settings_clinic_id_idx ON landing_page_settings(clinic_id);

-- ============================================
-- SECTION: Odontograms
-- ============================================
CREATE TABLE IF NOT EXISTS odontograms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  examined_at timestamptz NOT NULL DEFAULT now(),
  tooth_data jsonb DEFAULT '[]'::jsonb,
  diagnosis text,
  notes text,
  treatments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS odontograms_patient_id_idx ON odontograms(patient_id);

-- ============================================
-- SECTION: Medical Records (Vitals, Notes, Diagnoses, Attachments)
-- ============================================
CREATE TABLE IF NOT EXISTS medical_record_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  heart_rate integer,
  temperature numeric(4, 1),
  weight numeric(5, 2),
  height numeric(5, 2),
  bmi numeric(4, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medical_record_vitals_patient_id_idx ON medical_record_vitals(patient_id);
CREATE INDEX IF NOT EXISTS medical_record_vitals_recorded_at_idx ON medical_record_vitals(recorded_at);

CREATE TABLE IF NOT EXISTS clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clinical_notes_patient_id_idx ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS clinical_notes_created_at_idx ON clinical_notes(created_at);

CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  icd_code text,
  status diagnosis_status NOT NULL DEFAULT 'active',
  diagnosed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diagnoses_patient_id_idx ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS diagnoses_status_idx ON diagnoses(status);

CREATE TABLE IF NOT EXISTS medical_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medical_attachments_patient_id_idx ON medical_attachments(patient_id);

-- ============================================
-- SECTION: Supabase Storage — avatars bucket
-- ============================================
-- Creates the avatars bucket if it does not exist (Supabase Storage).
-- Other buckets (landing-assets, medical-attachments, logos) can be created via app script.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- storage schema may not exist in all environments; skip
END $$;

-- ============================================
-- SECTION: Default Seed Data (minimal)
-- ============================================
-- Single default clinic row so the app has a clinic to use.
INSERT INTO clinics (id, name, type)
SELECT gen_random_uuid(), 'Main Clinic', 'general'::clinic_type
WHERE NOT EXISTS (SELECT 1 FROM clinics LIMIT 1);

-- ============================================
-- VERIFY INSTALLATION
-- ============================================
-- Run this to confirm all tables were created:
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
