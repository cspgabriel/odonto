-- Migration: Add accent and hero background color to clinics (landing page control)
-- Run in Supabase SQL Editor after add_clinic_landing_columns.sql.

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS accent_color TEXT,
  ADD COLUMN IF NOT EXISTS hero_bg_color TEXT;
