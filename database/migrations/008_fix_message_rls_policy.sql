-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

-- Create a simpler policy that allows students to send messages in their own conversations
-- and PSG members/admins to send messages in any conversation
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      -- Students can send in their own conversations
      EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND conversations.student_id = auth.uid()
      )
      OR
      -- PSG members and admins can send in any conversation
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('psg_member', 'admin')
      )
    )
  );
