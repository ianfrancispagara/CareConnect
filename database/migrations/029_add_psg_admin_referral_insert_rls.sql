-- Migration: Allow PSG members and admins to create referrals
-- Description: Permit referral creation from screening reviews without violating RLS

CREATE POLICY "PSG members and admins can create referrals" ON referrals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('psg_member', 'admin')
    )
  );