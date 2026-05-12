-- Rollback script for referrals migration
-- Run this if you need to clean up and start fresh

DROP TABLE IF EXISTS referral_updates CASCADE;
DROP TABLE IF EXISTS referral_assessments CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP FUNCTION IF EXISTS update_referral_timestamp() CASCADE;
