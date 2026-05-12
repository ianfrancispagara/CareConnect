-- Allow admins to schedule appointments on behalf of students
-- Fixes admin referral approval flow that creates appointment records

DROP POLICY IF EXISTS "Admins can create appointments" ON appointments;

CREATE POLICY "Admins can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
