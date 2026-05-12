-- Verify PSG Availability and Profile Data
-- This checks if availability records have matching profiles

-- 1. Check all PSG availability records
SELECT 
  pa.id,
  pa.psg_member_id,
  pa.day_of_week,
  pa.start_time,
  pa.end_time,
  pa.is_active
FROM psg_availability pa
WHERE pa.is_active = true;

-- 2. Check if profiles exist for these PSG members
SELECT 
  pa.psg_member_id,
  pa.day_of_week,
  pa.start_time,
  pa.end_time,
  p.id as profile_id,
  p.full_name,
  p.role,
  p.email
FROM psg_availability pa
LEFT JOIN profiles p ON pa.psg_member_id = p.id
WHERE pa.is_active = true;

-- 3. Find orphaned availability (no matching profile)
SELECT 
  pa.id,
  pa.psg_member_id,
  'ORPHANED - No Profile Found' as issue
FROM psg_availability pa
LEFT JOIN profiles p ON pa.psg_member_id = p.id
WHERE pa.is_active = true
  AND p.id IS NULL;

-- 4. Find availability with wrong role (not psg_member)
SELECT 
  pa.id,
  pa.psg_member_id,
  p.full_name,
  p.role,
  'WRONG ROLE - Should be psg_member' as issue
FROM psg_availability pa
JOIN profiles p ON pa.psg_member_id = p.id
WHERE pa.is_active = true
  AND p.role != 'psg_member';

-- 5. Check all PSG members (should have role = 'psg_member')
SELECT 
  id,
  full_name,
  email,
  role
FROM profiles
WHERE role = 'psg_member';
