"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAlert } from "@/hooks/useAlert";
import { decryptMessage } from "@/lib/encryption";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "@/actions/messages";
import type {
  ConversationWithProfiles,
  MessageWithSender,
} from "@/types/messages";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  User,
  Loader2,
  Search,
} from "lucide-react";

export function ChatWidgetPSG() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<
    ConversationWithProfiles[]
  >([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithProfiles | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showAlert } = useAlert();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Load conversations when chat opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // Subscribe to real-time messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: newMessage } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:profiles!messages_sender_id_fkey(id, full_name, role, avatar_url)
            `,
            )
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage]);

            // Mark as read if chat is open and not minimized
            if (isOpen && !isMinimized) {
              await markMessagesAsRead(selectedConversation.id);
            }

            // Refresh conversations to update last message
            loadConversations();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, isOpen, isMinimized]);

  // Subscribe to new conversations
  useEffect(() => {
    if (!isOpen) return;

    const supabase = createClient();
    const channel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        () => {
          loadConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Calculate total unread count
  useEffect(() => {
    const count = conversations.reduce((total, conv) => {
      return total + (conv.unread_count || 0);
    }, 0);
    setTotalUnreadCount(count);
  }, [conversations]);

  // Periodically refresh conversations to update unread counts
  useEffect(() => {
    if (!isOpen) {
      // Load conversations initially even when closed to get unread count
      loadConversations();
      // Refresh every 10 seconds when closed to update unread badge
      const interval = setInterval(() => {
        loadConversations();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUserId]);

  const loadConversations = async () => {
    const result = await getConversations();
    if (result.success && result.data) {
      // Get unread counts for each conversation
      const supabase = createClient();
      const conversationsWithUnread = await Promise.all(
        result.data.map(async (conv) => {
          let unreadQuery = supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .is("read_at", null);

          if (currentUserId) {
            unreadQuery = unreadQuery.neq("sender_id", currentUserId);
          }

          const { count, error } = await unreadQuery;

          if (error) {
            console.error("Error loading unread count:", error);
          }

          return {
            ...conv,
            unread_count: error ? 0 : count || 0,
          };
        }),
      );
      setConversations(conversationsWithUnread);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const result = await getMessages(conversationId);
      if (result.success && result.data) {
        setMessages(result.data);
        // Mark messages as read
        await markMessagesAsRead(conversationId);
        // Refresh conversations to update unread count
        loadConversations();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (
    conversation: ConversationWithProfiles,
  ) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const result = await sendMessage(selectedConversation.id, newMessage);
      if (result.success) {
        setNewMessage("");
      } else {
        showAlert({
          type: "error",
          message: result.error || "Failed to send message",
          duration: 3000,
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setSelectedConversation(null);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);

    // Check if message is from today
    if (messageDate.getTime() === today.getTime()) {
      return formatTime(dateStr);
    } else {
      // Show date and time for older messages
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateStr);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.student.school_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_6px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.4),0_3px_8px_rgba(0,0,0,0.2)] transition-all z-50"
          style={{ background: "var(--primary)" }}
        >
          <MessageCircle
            className="w-6 h-6"
            style={{ color: "var(--bg-dark)" }}
          />
          {totalUnreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--error)", color: "#ffffff" }}
            >
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Box */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 flex shadow-[0_4px_20px_rgba(0,0,0,0.4),0_2px_10px_rgba(0,0,0,0.2)] rounded-lg overflow-hidden z-50 transition-all ${
            isMinimized ? "h-14 w-80" : "h-[32rem] w-[56rem]"
          }`}
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
          }}
        >
          {/* Conversations Sidebar */}
          {!isMinimized && (
            <div
              className="w-80 border-r flex flex-col"
              style={{
                background: "var(--bg)",
                borderColor: "var(--border-muted)",
              }}
            >
              {/* Sidebar Header */}
              <div
                className="p-4 border-b"
                style={{ borderColor: "var(--border-muted)" }}
              >
                <h3
                  className="font-semibold text-base mb-3"
                  style={{ color: "var(--text)" }}
                >
                  Student Messages
                </h3>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border text-sm focus:ring-2 focus:border-transparent outline-none"
                    style={{
                      background: "var(--bg-light)",
                      color: "var(--text)",
                      borderColor: "var(--border)",
                    }}
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <MessageCircle
                      className="w-12 h-12 mb-2"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {searchTerm
                        ? "No conversations found"
                        : "No messages yet"}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv, index) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className="w-full p-4 border-b transition hover:opacity-80 text-left"
                      style={{
                        background:
                          selectedConversation?.id === conv.id
                            ? "var(--bg-light)"
                            : "transparent",
                        borderColor: "var(--border-muted)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--primary-20)" }}
                        >
                          <User
                            className="w-5 h-5"
                            style={{ color: "var(--primary)" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className="font-medium text-sm truncate"
                              style={{ color: "var(--text)" }}
                            >
                              Student {index + 1}
                            </p>
                            {conv.assessment_severity && (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0"
                                style={{
                                  background:
                                    conv.assessment_color === "red"
                                      ? "var(--error)"
                                      : conv.assessment_color === "yellow"
                                        ? "var(--warning)"
                                        : "var(--success)",
                                  color: "#ffffff",
                                }}
                              >
                                {conv.assessment_severity.toUpperCase()}
                              </span>
                            )}
                            {conv.unread_count! > 0 && (
                              <span
                                className="ml-auto px-1.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                                style={{
                                  background: "var(--primary)",
                                  color: "var(--bg-dark)",
                                }}
                              >
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs truncate"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {formatDate(conv.last_message_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{
                background: "var(--primary)",
                borderColor: "var(--border-muted)",
              }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle
                  className="w-5 h-5"
                  style={{ color: "var(--bg-dark)" }}
                />
                <h3
                  className="font-semibold text-base"
                  style={{ color: "var(--bg-dark)" }}
                >
                  {selectedConversation
                    ? `Student ${
                        conversations.findIndex(
                          (c) => c.id === selectedConversation.id,
                        ) + 1
                      }`
                    : "Support Chat"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMinimize}
                  className="p-1 rounded hover:opacity-70 transition"
                  style={{ color: "var(--bg-dark)" }}
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1 rounded hover:opacity-70 transition"
                  style={{ color: "var(--bg-dark)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  style={{ background: "var(--bg)" }}
                >
                  {!selectedConversation ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle
                        className="w-16 h-16 mb-3"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <p
                        className="text-base font-medium mb-1"
                        style={{ color: "var(--text)" }}
                      >
                        Select a conversation
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Choose a student from the list to view messages
                      </p>
                    </div>
                  ) : loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2
                        className="w-6 h-6 animate-spin"
                        style={{ color: "var(--primary)" }}
                      />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle
                        className="w-12 h-12 mb-2"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No messages yet
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      // Check if sender is PSG member, admin, or system (all team messages go to right side)
                      const isTeamMessage =
                        message.sender_id === null || // System messages
                        message.sender?.role === "psg_member" ||
                        message.sender?.role === "admin";
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${
                            isTeamMessage ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isTeamMessage
                                ? "var(--primary-20)"
                                : "var(--bg-secondary)",
                            }}
                          >
                            <User
                              className="w-4 h-4"
                              style={{
                                color: isTeamMessage
                                  ? "var(--primary)"
                                  : "var(--text-muted)",
                              }}
                            />
                          </div>
                          <div
                            className={`flex-1 ${
                              isTeamMessage ? "text-right" : ""
                            }`}
                          >
                            <p
                              className="text-xs mb-1"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {isTeamMessage
                                ? "PSG"
                                : `Student ${
                                    conversations.findIndex(
                                      (c) => c.id === selectedConversation?.id,
                                    ) + 1
                                  }`}
                            </p>
                            <div
                              className={`inline-block p-3 rounded-lg max-w-[80%] shadow-[0_1px_2px_rgba(0,0,0,0.1)] ${
                                isTeamMessage
                                  ? "rounded-tr-none"
                                  : "rounded-tl-none"
                              }`}
                              style={{
                                background: isTeamMessage
                                  ? "var(--primary)"
                                  : "var(--bg-light)",
                                color: isTeamMessage
                                  ? "var(--bg-dark)"
                                  : "var(--text)",
                              }}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.sender_id === null
                                  ? message.content
                                  : selectedConversation
                                    ? decryptMessage(
                                        message.content,
                                        selectedConversation.id,
                                      )
                                    : message.content}
                              </p>
                            </div>
                            <p
                              className="text-xs mt-1"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {selectedConversation && (
                  <div
                    className="p-4 border-t"
                    style={{
                      background: "var(--bg-light)",
                      borderColor: "var(--border-muted)",
                    }}
                  >
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        rows={2}
                        className="flex-1 px-3 py-2 rounded-lg border resize-none focus:ring-2 focus:border-transparent outline-none text-sm"
                        style={{
                          background: "var(--bg)",
                          color: "var(--text)",
                          borderColor: "var(--border)",
                        }}
                        disabled={sending || loading}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending || loading}
                        className="px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                        style={{
                          background: "var(--primary)",
                          color: "var(--bg-dark)",
                        }}
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
