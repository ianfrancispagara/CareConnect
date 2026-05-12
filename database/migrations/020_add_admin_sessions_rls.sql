-- Migration: Add RLS policies for admin to view and manage sessions
-- Description: Allow admin users to read, create, update sessions and related tables

-- Check current sessions policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'sessions'
ORDER BY policyname;

-- Drop existing PSG member policies and recreate them to include admin
DROP POLICY IF EXISTS "PSG members can view their sessions" ON sessions;
DROP POLICY IF EXISTS "PSG members can create sessions" ON sessions;
DROP POLICY IF EXISTS "PSG members can update their sessions" ON sessions;

-- Sessions table: PSG members and admins can view all sessions
CREATE POLICY "PSG members and admins can view sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

-- Sessions table: PSG members and admins can create sessions
CREATE POLICY "PSG members and admins can create sessions" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

-- Sessions table: PSG members and admins can update sessions
CREATE POLICY "PSG members and admins can update sessions" ON sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

-- Sessions table: PSG members and admins can delete sessions (if needed)
CREATE POLICY "PSG members and admins can delete sessions" ON sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('psg_member', 'admin')
    )
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'sessions'
ORDER BY policyname;
