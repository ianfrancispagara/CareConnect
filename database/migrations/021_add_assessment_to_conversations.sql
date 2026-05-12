-- Migration: Add case assessment fields to conversations table
-- Description: Allow storing assessment results directly in conversation for quick access

-- Add assessment fields to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS assessment_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assessment_severity TEXT CHECK (assessment_severity IN ('low', 'moderate', 'high')),
ADD COLUMN IF NOT EXISTS assessment_color TEXT CHECK (assessment_color IN ('green', 'yellow', 'red')),
ADD COLUMN IF NOT EXISTS requires_immediate_attention BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assessment_responses JSONB,
ADD COLUMN IF NOT EXISTS assessment_completed_at TIMESTAMPTZ;

-- Create index for querying by severity
CREATE INDEX IF NOT EXISTS idx_conversations_assessment_severity 
ON conversations(assessment_severity) 
WHERE assessment_completed = TRUE;

-- Create index for urgent cases
CREATE INDEX IF NOT EXISTS idx_conversations_immediate_attention 
ON conversations(requires_immediate_attention) 
WHERE requires_immediate_attention = TRUE;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name LIKE 'assessment%'
ORDER BY ordinal_position;
