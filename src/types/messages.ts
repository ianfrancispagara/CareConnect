export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null; // null for system messages
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    full_name: string;
    role: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  id: string;
  student_id: string;
  psg_member_id: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  assessment_completed?: boolean;
  assessment_severity?: "low" | "moderate" | "high";
  assessment_color?: "green" | "yellow" | "red";
  requires_immediate_attention?: boolean;
  assessment_responses?: unknown;
  assessment_completed_at?: string;
}

export interface ConversationWithProfiles extends Conversation {
  student: {
    id: string;
    full_name: string;
    school_id: string | null;
    avatar_url?: string;
  };
  psg_member: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: string;
  };
}
