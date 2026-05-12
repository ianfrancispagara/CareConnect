-- Appointment Scheduling System Enhancement
-- Adds PSG availability tracking and improved appointment management

-- =======================
-- 1. PSG Availability Table
-- =======================
CREATE TABLE IF NOT EXISTS psg_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psg_member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT unique_psg_schedule UNIQUE (psg_member_id, day_of_week, start_time, end_time)
);

-- =======================
-- 2. Add Additional Columns to Appointments
-- =======================
-- Add duration, location type, and cancellation reason
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),
  ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'online' CHECK (location_type IN ('online', 'in_person')),
  ADD COLUMN IF NOT EXISTS meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- =======================
-- 3. Indexes for Performance
-- =======================
CREATE INDEX IF NOT EXISTS idx_psg_availability_member ON psg_availability(psg_member_id);
CREATE INDEX IF NOT EXISTS idx_psg_availability_day ON psg_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_psg_availability_active ON psg_availability(is_active);

CREATE INDEX IF NOT EXISTS idx_appointments_student ON appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_psg ON appointments(psg_member_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- =======================
-- 4. RLS Policies for PSG Availability
-- =======================
ALTER TABLE psg_availability ENABLE ROW LEVEL SECURITY;

-- PSG members can manage their own availability
CREATE POLICY "PSG members can view own availability"
  ON psg_availability FOR SELECT
  TO authenticated
  USING (psg_member_id = auth.uid());

CREATE POLICY "PSG members can create own availability"
  ON psg_availability FOR INSERT
  TO authenticated
  WITH CHECK (
    psg_member_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'psg_member'
    )
  );

CREATE POLICY "PSG members can update own availability"
  ON psg_availability FOR UPDATE
  TO authenticated
  USING (psg_member_id = auth.uid());

CREATE POLICY "PSG members can delete own availability"
  ON psg_availability FOR DELETE
  TO authenticated
  USING (psg_member_id = auth.uid());

-- Students can view active PSG availability
CREATE POLICY "Students can view active availability"
  ON psg_availability FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );

-- Admins can view all availability
CREATE POLICY "Admins can manage all availability"
  ON psg_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =======================
-- 5. Enhanced Appointment RLS Policies
-- =======================
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Students can create appointments" ON appointments;
DROP POLICY IF EXISTS "Students can update own appointments" ON appointments;
DROP POLICY IF EXISTS "PSG members can update assigned appointments" ON appointments;

-- Students can create appointments
CREATE POLICY "Students can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );

-- Students can update their own appointments (for cancellation)
CREATE POLICY "Students can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid());

-- PSG members can update their assigned appointments
CREATE POLICY "PSG members can update assigned appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    psg_member_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'psg_member'
    )
  );

-- =======================
-- 6. Triggers for Updated At
-- =======================
CREATE OR REPLACE FUNCTION update_psg_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_psg_availability_updated_at
  BEFORE UPDATE ON psg_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_psg_availability_updated_at();

-- =======================
-- 7. Helper Function: Check PSG Availability
-- =======================
CREATE OR REPLACE FUNCTION is_psg_available(
  p_psg_member_id UUID,
  p_appointment_date TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_is_available BOOLEAN;
BEGIN
  -- Extract day of week (0 = Sunday) and time
  v_day_of_week := EXTRACT(DOW FROM p_appointment_date);
  v_start_time := p_appointment_date::TIME;
  v_end_time := (p_appointment_date + (p_duration_minutes || ' minutes')::INTERVAL)::TIME;
  
  -- Check if PSG member has availability for this time slot
  SELECT EXISTS (
    SELECT 1 FROM psg_availability
    WHERE psg_member_id = p_psg_member_id
      AND day_of_week = v_day_of_week
      AND is_active = true
      AND start_time <= v_start_time
      AND end_time >= v_end_time
  ) INTO v_is_available;
  
  -- Check for conflicting appointments
  IF v_is_available THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM appointments
      WHERE psg_member_id = p_psg_member_id
        AND status IN ('scheduled', 'confirmed')
        AND (
          (appointment_date <= p_appointment_date 
           AND appointment_date + (duration_minutes || ' minutes')::INTERVAL > p_appointment_date)
          OR
          (appointment_date < p_appointment_date + (p_duration_minutes || ' minutes')::INTERVAL
           AND appointment_date >= p_appointment_date)
        )
    ) INTO v_is_available;
  END IF;
  
  RETURN v_is_available;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- 8. Sample Data (Optional - for development)
-- =======================
-- Uncomment to add sample PSG availability
/*
-- Insert sample availability for PSG members (Monday-Friday, 9 AM - 5 PM)
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
*/
