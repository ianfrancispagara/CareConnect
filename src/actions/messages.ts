"use server";

import { createClient } from "@/lib/supabase/server";
import { encryptMessage } from "@/lib/encryption";
import type {
  Conversation,
  ConversationWithProfiles,
  Message,
  MessageWithSender,
} from "@/types/messages";

type PsgMemberOption = {
  id: string;
  full_name: string;
  email: string;
};

type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Get or create conversation for student with selected PSG member
export async function getOrCreateConversation(
  psgMemberId: string,
): Promise<ActionResponse<Conversation>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    if (!psgMemberId) {
      return { success: false, error: "PSG member is required" };
    }

    // Check if conversation exists for this student + PSG pair
    const { data: existingConversation, error: fetchError } = await supabase
      .from("conversations")
      .select("*")
      .eq("student_id", user.id)
      .eq("psg_member_id", psgMemberId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching conversation:", fetchError);
      return { success: false, error: "Failed to load conversation" };
    }

    if (existingConversation) {
      return { success: true, data: existingConversation };
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert({
        student_id: user.id,
        psg_member_id: psgMemberId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating conversation:", createError);
      return { success: false, error: "Failed to create conversation" };
    }

    return { success: true, data: newConversation };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get PSG members that students can start a conversation with
export async function getStudentPsgMembers(): Promise<
  ActionResponse<PsgMemberOption[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: psgMembers, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "psg_member")
      .eq("is_blocked", false)
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error fetching PSG members:", error);
      return { success: false, error: "Failed to load PSG members" };
    }

    return { success: true, data: psgMembers || [] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get conversations for PSG member/admin
export async function getConversations(): Promise<
  ActionResponse<ConversationWithProfiles[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        student:profiles!conversations_student_id_fkey(id, full_name, school_id, avatar_url),
        psg_member:profiles!conversations_psg_member_id_fkey(id, full_name, email, avatar_url)
      `,
      )
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return { success: false, error: "Failed to load conversations" };
    }

    // Filter out conversations with no messages
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id);

        return count && count > 0 ? conv : null;
      }),
    );

    const filteredConversations = conversationsWithMessages.filter(
      (conv) => conv !== null,
    ) as ConversationWithProfiles[];

    return { success: true, data: filteredConversations };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get messages for a conversation
export async function getMessages(
  conversationId: string,
): Promise<ActionResponse<MessageWithSender[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, role, avatar_url)
      `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return { success: false, error: "Failed to load messages" };
    }

    return { success: true, data: messages };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Send a message
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<ActionResponse<Message>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return { success: false, error: "Authentication required" };
    }

    if (!content.trim()) {
      return { success: false, error: "Message cannot be empty" };
    }

    // Encrypt the message content before storing
    const encryptedContent = encryptMessage(content.trim(), conversationId);

    console.log("Sending encrypted message:", {
      conversationId,
      userId: user.id,
      encrypted: true,
    });

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: encryptedContent,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Error sending message - Full error:",
        JSON.stringify(error, null, 2),
      );
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      return {
        success: false,
        error: `Failed to send message: ${error.message}`,
      };
    }

    return { success: true, data: message };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Send a system message (for assessment questions, not encrypted)
export async function sendSystemMessage(
  conversationId: string,
  content: string,
): Promise<ActionResponse<Message>> {
  try {
    const supabase = await createClient();

    if (!content.trim()) {
      return { success: false, error: "Message cannot be empty" };
    }

    console.log("Sending system message:", {
      conversationId,
      content: content.substring(0, 50) + "...",
    });

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: null, // NULL for system messages
        content: content.trim(), // System messages are not encrypted
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending system message:", error);
      return {
        success: false,
        error: `Failed to send system message: ${error.message}`,
      };
    }

    return { success: true, data: message };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Mark messages as read
export async function markMessagesAsRead(
  conversationId: string,
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Error marking messages as read:", error);
      return { success: false, error: "Failed to mark messages as read" };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get unread message count
export async function getUnreadCount(): Promise<ActionResponse<number>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Get user's conversations
    const { data: conversations, error: conversationsError } = await supabase
      .from("conversations")
      .select("id")
      .eq("student_id", user.id);

    if (conversationsError) {
      console.error("Error fetching conversations:", conversationsError);
      return { success: false, error: "Failed to load conversations" };
    }

    const conversationIds = (conversations || []).map(
      (conversation) => conversation.id,
    );

    if (conversationIds.length === 0) {
      return { success: true, data: 0 };
    }

    // Count unread messages across all student conversations
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Error counting unread messages:", error);
      return { success: false, error: "Failed to count unread messages" };
    }

    return { success: true, data: count || 0 };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Check if student has an existing conversation
export async function hasExistingConversation(): Promise<
  ActionResponse<boolean>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Check if at least one conversation exists
    const { data: conversations, error: conversationsError } = await supabase
      .from("conversations")
      .select("id")
      .eq("student_id", user.id)
      .limit(1);

    if (conversationsError) {
      console.error(
        "Error checking existing conversation:",
        conversationsError,
      );
      return { success: false, error: "Failed to check conversations" };
    }

    return { success: true, data: (conversations?.length || 0) > 0 };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
