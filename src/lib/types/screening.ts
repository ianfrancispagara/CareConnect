// Database types for mental health screening module

export type ScreeningQuestion = {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "scale" | "yes_no" | "text";
  options: string[] | null;
  weight: number;
  is_preset: boolean;
  created_by: string | null;
  order: number;
  created_at: string;
  updated_at: string;
};

export type ScreeningResponse = {
  id: string;
  screening_result_id: string;
  question_id: string;
  answer: string | number | boolean;
  score: number;
  created_at: string;
  question_text?: string; // Optional field added by getScreeningById
};

export type ScreeningResult = {
  id: string;
  user_id: string;
  total_score: number;
  severity_score: number; // Numeric score (e.g., 0-100)
  color_code: "green" | "yellow" | "red";
  recommendations: string | null;
  requires_immediate_attention: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CaseAssessment = {
  id: string;
  screening_result_id: string;
  user_id: string;
  psg_member_id: string | null;
  status: "pending" | "in_progress" | "completed" | "escalated";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentMessage = {
  id: string;
  case_assessment_id: string;
  sender_id: string;
  sender_role: "student" | "psg_member" | "admin";
  message: string;
  is_question: boolean;
  created_at: string;
};

// SQL to create tables (for reference)
export const SCREENING_TABLES_SQL = `
-- Screening Questions Table
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

-- Screening Results Table
CREATE TABLE IF NOT EXISTS screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_score NUMERIC NOT NULL,
  severity_score INTEGER NOT NULL,
  color_code TEXT NOT NULL CHECK (color_code IN ('green', 'yellow', 'red')),
  recommendations TEXT,
  requires_immediate_attention BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screening Responses Table
CREATE TABLE IF NOT EXISTS screening_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_result_id UUID NOT NULL REFERENCES screening_results(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES screening_questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL, -- Flexible to store string, number, or boolean
  score NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Assessments Table
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

-- Assessment Messages Table (for chat/follow-up questions)
CREATE TABLE IF NOT EXISTS assessment_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_assessment_id UUID NOT NULL REFERENCES case_assessments(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'psg_member', 'admin')),
  message TEXT NOT NULL,
  is_question BOOLEAN DEFAULT false, -- Mark if this is a follow-up question
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_screening_results_student ON screening_results(student_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_severity ON screening_results(severity_level);
CREATE INDEX IF NOT EXISTS idx_screening_responses_result ON screening_responses(screening_result_id);
CREATE INDEX IF NOT EXISTS idx_case_assessments_student ON case_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_case_assessments_psg ON case_assessments(psg_member_id);
CREATE INDEX IF NOT EXISTS idx_assessment_messages_case ON assessment_messages(case_assessment_id);

-- RLS Policies
ALTER TABLE screening_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_messages ENABLE ROW LEVEL SECURITY;

-- Screening Questions: Everyone can read, only admins can modify
CREATE POLICY "Everyone can view screening questions"
  ON screening_questions FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert screening questions"
  ON screening_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update screening questions"
  ON screening_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Screening Results: Students can view their own, PSG/Admin can view all
CREATE POLICY "Students can view own screening results"
  ON screening_results FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('psg_member', 'admin')
    )
  );

CREATE POLICY "Students can insert own screening results"
  ON screening_results FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "PSG members can update screening results"
  ON screening_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('psg_member', 'admin')
    )
  );

-- Similar policies for other tables...
`;
