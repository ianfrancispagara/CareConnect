-- Fix for foreign key relationship naming issue
-- Run this to fix the "Could not find a relationship" error

-- Step 1: Drop existing tables
DROP TABLE IF EXISTS referral_updates CASCADE;
DROP TABLE IF EXISTS referral_assessments CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP FUNCTION IF EXISTS update_referral_timestamp() CASCADE;

-- Step 2: Now run the complete migration from 006_create_referrals.sql
-- The migration has been updated with explicit constraint names:
--   - referrals_student_id_fkey
--   - referrals_assigned_psg_member_id_fkey
--   - referrals_reviewed_by_fkey
--   - referrals_screening_result_id_fkey

-- These names match what the Supabase query is looking for.
