-- Fix RLS policy to allow admins to update all profiles
-- This resolves the "Failed to update user" error in admin user management

-- Add policy for admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'admin'
  );

-- Add policy for admins to delete any profile
CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  USING (
    get_user_role(auth.uid()) = 'admin'
  );

-- Verify the policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND cmd IN ('UPDATE', 'DELETE');
