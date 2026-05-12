-- Cleanup Orphaned PSG Availability Records
-- This removes availability records that reference non-existent profiles

-- First, let's see what we have
SELECT 
  pa.id,
  pa.psg_member_id,
  pa.day_of_week,
  pa.start_time,
  pa.end_time,
  CASE 
    WHEN p.id IS NULL THEN 'ORPHANED - No Profile'
    WHEN p.role != 'psg_member' THEN 'INVALID - Not PSG Member'
    ELSE 'VALID'
  END as status,
  p.full_name
FROM psg_availability pa
LEFT JOIN profiles p ON pa.psg_member_id = p.id
ORDER BY status, pa.psg_member_id;

-- Delete orphaned availability records (no matching profile)
DELETE FROM psg_availability
WHERE psg_member_id NOT IN (
  SELECT id FROM profiles WHERE role = 'psg_member'
);

-- Verify cleanup
SELECT COUNT(*) as remaining_availability_records
FROM psg_availability;

SELECT 
  pa.psg_member_id,
  p.full_name,
  COUNT(*) as availability_slots
FROM psg_availability pa
JOIN profiles p ON pa.psg_member_id = p.id
GROUP BY pa.psg_member_id, p.full_name;
