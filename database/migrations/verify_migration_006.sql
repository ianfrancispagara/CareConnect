-- Quick verification query
-- Run this in Supabase SQL Editor to check if migration is needed

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('referrals', 'referral_assessments', 'referral_updates') 
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('referrals', 'referral_assessments', 'referral_updates')
ORDER BY table_name;

-- If you see 0 rows returned, the tables don't exist yet
-- Run migration 006_create_referrals.sql
