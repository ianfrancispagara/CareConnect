-- Check RLS Policies on Profiles Table
-- This verifies that profiles can be read by authenticated users

-- 1. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. View all policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Test direct SELECT on profiles (should work if RLS allows)
SELECT 
  id,
  full_name,
  email,
  role,
  avatar_url
FROM profiles
WHERE role = 'psg_member';

-- 4. Test the exact query the server action uses
SELECT id, full_name, avatar_url 
FROM profiles 
WHERE id = 'ce4e2ce0-e2a7-4465-a751-49beb14071f';

-- 5. If RLS is blocking, temporarily check without RLS (as admin)
-- Run this only if you're logged in as superuser
-- SET ROLE postgres;
-- SELECT id, full_name, avatar_url FROM profiles WHERE id = 'ce4e2ce0-e2a7-4465-a751-49beb14071f';
