-- Ensure profiles can be read by authenticated users
-- This is needed for the appointment booking to work

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

-- Allow all authenticated users to view basic profile information
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Verify the policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT';
