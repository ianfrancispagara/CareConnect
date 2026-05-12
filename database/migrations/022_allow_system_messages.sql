-- Allow system messages by making sender_id nullable
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;

-- Update RLS policy to allow system messages (sender_id can be NULL)
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      -- Regular user messages
      auth.uid() = sender_id
      AND EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (
          conversations.student_id = auth.uid()
          OR conversations.psg_member_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        )
      )
    )
    OR
    (
      -- System messages (sender_id is NULL)
      sender_id IS NULL
      AND EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (
          conversations.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('psg_member', 'admin')
          )
        )
      )
    )
  );
