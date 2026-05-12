-- Insert Test PSG Availability Data
-- This creates sample availability slots for PSG members

-- Insert sample availability for PSG members (Monday-Friday, 9 AM - 5 PM)
-- This will help test the appointment booking functionality

INSERT INTO psg_availability (psg_member_id, day_of_week, start_time, end_time, is_active)
SELECT 
  id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00:00'::TIME as start_time,
  '17:00:00'::TIME as end_time,
  true as is_active
FROM profiles
WHERE role = 'psg_member'
ON CONFLICT (psg_member_id, day_of_week, start_time, end_time) DO NOTHING;

-- Verify the data was inserted
SELECT 
  pa.id,
  pa.psg_member_id,
  p.full_name,
  pa.day_of_week,
  pa.start_time,
  pa.end_time,
  pa.is_active
FROM psg_availability pa
JOIN profiles p ON pa.psg_member_id = p.id
ORDER BY p.full_name, pa.day_of_week;
