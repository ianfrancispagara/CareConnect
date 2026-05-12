-- Fix timezone handling in is_psg_available function
-- This ensures times are compared in Asia/Manila timezone (UTC+8)

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
  v_local_appointment TIMESTAMP;
  v_local_end TIMESTAMP;
BEGIN
  -- Convert to Asia/Manila timezone for time extraction
  v_local_appointment := p_appointment_date AT TIME ZONE 'Asia/Manila';
  v_local_end := v_local_appointment + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Extract day of week and time in local timezone
  v_day_of_week := EXTRACT(DOW FROM v_local_appointment);
  v_start_time := v_local_appointment::TIME;
  v_end_time := v_local_end::TIME;
  
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
