-- Migration: Add RLS policies for admin to view and manage referrals
-- Description: Allow admin users to read, update, and manage all referrals and related tables

-- Drop existing PSG member policies and recreate them to include admin
DROP POLICY IF EXISTS "PSG members can view all referrals" ON referrals;
DROP POLICY IF EXISTS "PSG members can update referrals" ON referrals;
DROP POLICY IF EXISTS "PSG members can view referral assessments" ON referral_assessments;
DROP POLICY IF EXISTS "PSG members can create referral assessments" ON referral_assessments;
DROP POLICY IF EXISTS "PSG members can view updates" ON referral_updates;
DROP POLICY IF EXISTS "PSG members can create updates" ON referral_updates;

-- Referrals table: PSG members and admins can view and update
CREATE POLICY "PSG members and admins can view all referrals" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

CREATE POLICY "PSG members and admins can update referrals" ON referrals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

-- Referral assessments: PSG members and admins
CREATE POLICY "PSG members and admins can view referral assessments" ON referral_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

CREATE POLICY "PSG members and admins can create referral assessments" ON referral_assessments
  FOR INSERT WITH CHECK (
    assessed_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

-- Referral updates: PSG members and admins
CREATE POLICY "PSG members and admins can view updates" ON referral_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

CREATE POLICY "PSG members and admins can create updates" ON referral_updates
  FOR INSERT WITH CHECK (
    updated_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('referrals', 'referral_assessments', 'referral_updates')
ORDER BY tablename, policyname;
