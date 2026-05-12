-- Add encryption metadata to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT true;

-- Add index for encryption_enabled
CREATE INDEX IF NOT EXISTS idx_conversations_encryption_enabled ON conversations(encryption_enabled);

-- Add comment to document encryption
COMMENT ON COLUMN conversations.encryption_enabled IS 'Indicates if messages in this conversation are encrypted with AES-256';
COMMENT ON TABLE messages IS 'Messages are encrypted using AES-256 before storage. Content field contains encrypted data.';
