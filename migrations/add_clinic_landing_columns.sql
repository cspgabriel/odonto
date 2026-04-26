-- Migration: Add landing page override columns to clinics (admin-editable hero)
-- Run in Supabase SQL Editor after add_clinics_table.sql.
-- Date: 2025-02-12

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS hero_tagline TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS key_benefits_line TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS site_name TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT,
  ADD COLUMN IF NOT EXISTS footer_text TEXT;
