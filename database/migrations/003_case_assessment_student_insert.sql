-- Allow students to create their own case assessments
-- This enables students to initiate case assessments from screening results

CREATE POLICY "Students can create own case assessments"
  ON case_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );
