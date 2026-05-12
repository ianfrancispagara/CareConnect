-- Ensure uuid extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('self', 'peer', 'faculty', 'screening')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'assigned', 'in_progress', 'completed', 'escalated')),
  severity TEXT CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  assigned_psg_member_id UUID,
  notes TEXT,
  reason TEXT,
  screening_result_id UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  escalated_to TEXT, -- OCCS staff email or external resource
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add named foreign key constraints
  CONSTRAINT referrals_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT referrals_assigned_psg_member_id_fkey FOREIGN KEY (assigned_psg_member_id) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT referrals_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT referrals_screening_result_id_fkey FOREIGN KEY (screening_result_id) REFERENCES screening_results(id) ON DELETE SET NULL
);

-- Create referral_assessments table for structured assessment
CREATE TABLE IF NOT EXISTS referral_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  assessed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  presenting_concerns TEXT NOT NULL,
  mental_health_history TEXT,
  support_network TEXT,
  coping_strategies TEXT,
  immediate_safety_concerns BOOLEAN DEFAULT FALSE,
  safety_plan TEXT,
  recommended_interventions TEXT[],
  follow_up_frequency TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_updates table for tracking progress
CREATE TABLE IF NOT EXISTS referral_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change', 'note', 'assessment', 'escalation', 'completion')),
  previous_status TEXT,
  new_status TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_student_id ON referrals(student_id);
CREATE INDEX IF NOT EXISTS idx_referrals_assigned_psg_member_id ON referrals(assigned_psg_member_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_severity ON referrals(severity);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_assessments_referral_id ON referral_assessments(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_updates_referral_id ON referral_updates(referral_id);

-- Add RLS policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_updates ENABLE ROW LEVEL SECURITY;

-- Students can view their own referrals and create self-referrals
CREATE POLICY "Students can view own referrals" ON referrals
  FOR SELECT USING (
    student_id = auth.uid()
  );

CREATE POLICY "Students can create self-referrals" ON referrals
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND source = 'self'
  );

-- PSG members can view all referrals and manage assigned ones
CREATE POLICY "PSG members can view all referrals" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'psg_member'
    )
  );

CREATE POLICY "PSG members can update referrals" ON referrals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'psg_member'
    )
  );

-- PSG members can create assessments
CREATE POLICY "PSG members can view referral assessments" ON referral_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'psg_member'
    )
  );

CREATE POLICY "PSG members can create referral assessments" ON referral_assessments
  FOR INSERT WITH CHECK (
    assessed_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'psg_member'
    )
  );

-- PSG members can add updates
CREATE POLICY "PSG members can view updates" ON referral_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('student', 'psg_member')
    )
  );

CREATE POLICY "PSG members can create updates" ON referral_updates
  FOR INSERT WITH CHECK (
    updated_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'psg_member'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_referral_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referrals_timestamp
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_timestamp();

CREATE TRIGGER update_referral_assessments_timestamp
  BEFORE UPDATE ON referral_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_timestamp();

-- Students can also view their own referral updates
CREATE POLICY "Students can view own referral updates" ON referral_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM referrals
      WHERE referrals.id = referral_updates.referral_id
      AND referrals.student_id = auth.uid()
    )
  );
