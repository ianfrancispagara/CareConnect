-- Mental Health Screening Module Database Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================
-- 1. Screening Questions Table
-- =======================
CREATE TABLE IF NOT EXISTS screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'scale', 'yes_no', 'text')),
  options TEXT[], -- For multiple choice questions
  weight INTEGER NOT NULL DEFAULT 5 CHECK (weight >= 1 AND weight <= 10),
  is_preset BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- 2. Screening Results Table (Drop and recreate with new schema)
-- =======================
-- Note: This will drop the existing screening_results table and create a new one
-- If you want to preserve old data, backup first!
DROP TABLE IF EXISTS screening_results CASCADE;

CREATE TABLE screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_score NUMERIC NOT NULL,
  severity_score INTEGER NOT NULL, -- Numeric score (0-100 range typically)
  color_code TEXT NOT NULL CHECK (color_code IN ('green', 'yellow', 'red')),
  recommendations TEXT,
  requires_immediate_attention BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- 3. Screening Responses Table
-- =======================
CREATE TABLE IF NOT EXISTS screening_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_result_id UUID NOT NULL REFERENCES screening_results(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, -- Can be UUID for custom questions or string for preset
  answer TEXT NOT NULL, -- Store all answers as text (can be number, boolean, or string)
  score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- 4. Case Assessments Table
-- =======================
CREATE TABLE IF NOT EXISTS case_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_result_id UUID NOT NULL REFERENCES screening_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  psg_member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'escalated')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- 5. Assessment Messages Table (Chat)
-- =======================
CREATE TABLE IF NOT EXISTS assessment_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_assessment_id UUID NOT NULL REFERENCES case_assessments(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'psg_member', 'admin')),
  message TEXT NOT NULL,
  is_question BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- Indexes for Performance
-- =======================
CREATE INDEX IF NOT EXISTS idx_screening_results_user_id ON screening_results(user_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_severity ON screening_results(severity_score);
CREATE INDEX IF NOT EXISTS idx_screening_results_reviewed ON screening_results(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_screening_results_created ON screening_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_screening_responses_result_id ON screening_responses(screening_result_id);

CREATE INDEX IF NOT EXISTS idx_case_assessments_user_id ON case_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_case_assessments_psg_member ON case_assessments(psg_member_id);
CREATE INDEX IF NOT EXISTS idx_case_assessments_status ON case_assessments(status);

CREATE INDEX IF NOT EXISTS idx_assessment_messages_case_id ON assessment_messages(case_assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_messages_created ON assessment_messages(created_at ASC);

-- =======================
-- Row Level Security (RLS) Policies
-- =======================

-- Enable RLS on all tables
ALTER TABLE screening_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_messages ENABLE ROW LEVEL SECURITY;

-- ===== Screening Questions Policies =====
-- Everyone can read preset questions
CREATE POLICY "Anyone can view preset questions"
  ON screening_questions FOR SELECT
  USING (is_preset = true);

-- PSG members and admins can create custom questions
CREATE POLICY "PSG/Admin can create questions"
  ON screening_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('psg_member', 'admin')
    )
  );

-- ===== Screening Results Policies =====
-- Students can view their own results
CREATE POLICY "Students can view own screening results"
  ON screening_results FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Students can insert their own results
CREATE POLICY "Students can create own screening results"
  ON screening_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- PSG members and admins can view all results
CREATE POLICY "PSG/Admin can view all screening results"
  ON screening_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('psg_member', 'admin')
    )
  );

-- PSG members and admins can update results (for review)
CREATE POLICY "PSG/Admin can update screening results"
  ON screening_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('psg_member', 'admin')
    )
  );

-- ===== Screening Responses Policies =====
-- Students can view their own responses
CREATE POLICY "Students can view own responses"
  ON screening_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM screening_results
      WHERE screening_results.id = screening_responses.screening_result_id
      AND screening_results.user_id = auth.uid()
    )
  );

-- Students can insert their own responses
CREATE POLICY "Students can create own responses"
  ON screening_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM screening_results
      WHERE screening_results.id = screening_responses.screening_result_id
      AND screening_results.user_id = auth.uid()
    )
  );

-- PSG members and admins can view all responses
CREATE POLICY "PSG/Admin can view all responses"
  ON screening_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('psg_member', 'admin')
    )
  );

-- ===== Case Assessments Policies =====
-- Students can view their own case assessments
CREATE POLICY "Students can view own case assessments"
  ON case_assessments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- PSG members can view and create case assessments
CREATE POLICY "PSG/Admin can manage case assessments"
  ON case_assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('psg_member', 'admin')
    )
  );

-- ===== Assessment Messages Policies =====
-- Students can view messages in their own case assessments
CREATE POLICY "Students can view own case messages"
  ON assessment_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM case_assessments
      WHERE case_assessments.id = assessment_messages.case_assessment_id
      AND case_assessments.user_id = auth.uid()
    )
  );

-- Students can send messages in their own case assessments
CREATE POLICY "Students can send messages in own cases"
  ON assessment_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM case_assessments
      WHERE case_assessments.id = assessment_messages.case_assessment_id
      AND case_assessments.user_id = auth.uid()
    )
  );

-- PSG members can view and send messages in their assigned cases
CREATE POLICY "PSG can manage messages in assigned cases"
  ON assessment_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM case_assessments
      JOIN profiles ON profiles.id = auth.uid()
      WHERE case_assessments.id = assessment_messages.case_assessment_id
      AND (
        case_assessments.psg_member_id = auth.uid()
        OR profiles.role = 'admin'
      )
    )
  );

-- =======================
-- Functions and Triggers
-- =======================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_screening_questions_updated_at
  BEFORE UPDATE ON screening_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screening_results_updated_at
  BEFORE UPDATE ON screening_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_assessments_updated_at
  BEFORE UPDATE ON case_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- Insert Preset Questions (PHQ-9 based)
-- =======================
INSERT INTO screening_questions (question_text, question_type, weight, is_preset, "order") VALUES
  ('Over the last 2 weeks, how often have you felt down, depressed, or hopeless?', 'scale', 8, true, 1),
  ('How often have you had little interest or pleasure in doing things?', 'scale', 8, true, 2),
  ('How often have you had trouble falling or staying asleep, or sleeping too much?', 'scale', 6, true, 3),
  ('How often have you felt tired or had little energy?', 'scale', 6, true, 4),
  ('How often have you had poor appetite or been overeating?', 'scale', 5, true, 5),
  ('How often have you felt bad about yourself or that you are a failure?', 'scale', 7, true, 6),
  ('How often have you had trouble concentrating on things?', 'scale', 6, true, 7),
  ('Have you had thoughts that you would be better off dead or of hurting yourself?', 'yes_no', 10, true, 8),
  ('How would you rate your overall stress level right now?', 'scale', 7, true, 9),
  ('Is there anything else you would like to share about how you have been feeling?', 'text', 3, true, 10)
ON CONFLICT DO NOTHING;

-- =======================
-- Grant Permissions
-- =======================
GRANT ALL ON screening_questions TO authenticated;
GRANT ALL ON screening_results TO authenticated;
GRANT ALL ON screening_responses TO authenticated;
GRANT ALL ON case_assessments TO authenticated;
GRANT ALL ON assessment_messages TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Mental Health Screening Module schema created successfully!';
  RAISE NOTICE 'Tables created: screening_questions, screening_results, screening_responses, case_assessments, assessment_messages';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Preset questions inserted (10 PHQ-9 based questions)';
END $$;
