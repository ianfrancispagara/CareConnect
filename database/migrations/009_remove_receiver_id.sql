-- Remove receiver_id column from messages table as it's not needed
-- The conversation structure handles participants (student_id and psg_member_id in conversations table)

-- First, drop the policies that depend on receiver_id
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can update messages they received (mark as read)" ON messages;

-- Now we can drop the receiver_id column
ALTER TABLE messages DROP COLUMN IF EXISTS receiver_id;
