-- CareConnect Row Level Security (RLS) Policies
-- Run this after 001_initial_schema.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "PSG members and admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('psg_member', 'admin')
  );

CREATE POLICY "Users can insert their own profile on signup"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Referrals policies
CREATE POLICY "Students can view their own referrals"
  ON referrals FOR SELECT
  USING (
    student_id = auth.uid()
  );

CREATE POLICY "Students can create their own referrals"
  ON referrals FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    get_user_role(auth.uid()) = 'student'
  );

CREATE POLICY "PSG members can view assigned referrals"
  ON referrals FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('psg_member', 'admin') OR
    assigned_psg_member_id = auth.uid()
  );

CREATE POLICY "PSG members can update assigned referrals"
  ON referrals FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('psg_member', 'admin')
  );

-- Appointments policies
CREATE POLICY "Students can view their own appointments"
  ON appointments FOR SELECT
  USING (
    student_id = auth.uid()
  );

CREATE POLICY "PSG members can view their appointments"
  ON appointments FOR SELECT
  USING (
    psg_member_id = auth.uid() OR
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Students can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    get_user_role(auth.uid()) = 'student'
  );

CREATE POLICY "PSG members can update their appointments"
  ON appointments FOR UPDATE
  USING (
    psg_member_id = auth.uid() OR
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Students can update their appointments"
  ON appointments FOR UPDATE
  USING (student_id = auth.uid());

-- Screening results policies
CREATE POLICY "Users can view their own screening results"
  ON screening_results FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own screening results"
  ON screening_results FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "PSG members and admins can view all screening results"
  ON screening_results FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('psg_member', 'admin')
  );

-- Messages policies
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they received (mark as read)"
  ON messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- Sessions policies
CREATE POLICY "PSG members can view sessions for their appointments"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = sessions.appointment_id
      AND (
        appointments.psg_member_id = auth.uid() OR
        appointments.student_id = auth.uid()
      )
    ) OR
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "PSG members can create sessions for their appointments"
  ON sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.psg_member_id = auth.uid()
    )
  );

CREATE POLICY "PSG members can update their sessions"
  ON sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = sessions.appointment_id
      AND appointments.psg_member_id = auth.uid()
    ) OR
    get_user_role(auth.uid()) = 'admin'
  );

-- Audit logs policies
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Create audit log trigger function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, json_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
CREATE TRIGGER audit_referrals
  AFTER INSERT OR UPDATE OR DELETE ON referrals
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_sessions
  AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();
