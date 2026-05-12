-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Also enable for conversations table (for future features)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
