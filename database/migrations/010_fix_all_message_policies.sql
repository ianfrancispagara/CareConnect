-- Fix all RLS policies for messages table to allow proper messaging

-- Drop all existing message policies
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON messages;

-- Policy 1: Allow viewing messages in conversations user is part of
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.student_id = auth.uid()
        OR conversations.psg_member_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('psg_member', 'admin')
        )
      )
    )
  );

-- Policy 2: Allow inserting messages (simplified - just check if user is sender and conversation exists)
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (
        -- Students can send in their own conversations
        conversations.student_id = auth.uid()
        OR
        -- PSG members can send in conversations they're assigned to
        conversations.psg_member_id = auth.uid()
        OR
        -- Admins and unassigned PSG members can send in any conversation
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('psg_member', 'admin')
        )
      )
    )
  );

-- Policy 3: Allow updating messages (for read receipts)
CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.student_id = auth.uid()
        OR conversations.psg_member_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('psg_member', 'admin')
        )
      )
    )
  );
