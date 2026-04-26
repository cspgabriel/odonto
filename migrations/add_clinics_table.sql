-- Migration: Add clinics table for clinic type (GENERAL, DENTAL, SPECIALTY)
-- Run in Supabase SQL Editor. Safe to run multiple times (IF NOT EXISTS).
-- Date: 2025-02-12

DO $$ BEGIN
    CREATE TYPE clinic_type AS ENUM ('general', 'dental', 'specialty');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Main Clinic',
    type clinic_type NOT NULL DEFAULT 'general',
    hero_tagline TEXT,
    hero_subtitle TEXT,
    key_benefits_line TEXT,
    logo_url TEXT,
    site_name TEXT,
    primary_color TEXT,
    footer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed single clinic for existing deployments (only if table is empty)
INSERT INTO clinics (name, type)
SELECT 'Main Clinic', 'general'
WHERE NOT EXISTS (SELECT 1 FROM clinics LIMIT 1);
