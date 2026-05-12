"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAlert } from "@/hooks/useAlert";
import { decryptMessage } from "@/lib/encryption";
import {
  getOrCreateConversation,
  getStudentPsgMembers,
  getMessages,
  sendMessage,
  sendSystemMessage,
  markMessagesAsRead,
  getUnreadCount,
} from "@/actions/messages";
import { submitCaseAssessment } from "@/actions/caseAssessment";
import {
  CASE_ASSESSMENT_QUESTIONS,
  type AssessmentResponse,
} from "@/lib/constants/caseAssessment";
import type { MessageWithSender } from "@/types/messages";
import { MessageCircle, X, Send, Minimize2, User, Loader2 } from "lucide-react";

interface ChatWidgetProps {
  disabled?: boolean;
}

interface PsgMemberOption {
  id: string;
  full_name: string;
  email: string;
}

export function ChatWidget({ disabled = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [psgMembers, setPsgMembers] = useState<PsgMemberOption[]>([]);
  const [selectedPsgMemberId, setSelectedPsgMemberId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const assessmentStartedRef = useRef(false);
  const sentQuestionsRef = useRef<Set<number>>(new Set());
  const { showAlert } = useAlert();

  // Assessment flow state
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentResponses, setAssessmentResponses] = useState<
    AssessmentResponse[]
  >([]);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [shouldStartAssessment, setShouldStartAssessment] = useState(false);

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

  // Load PSG members when chat opens
  useEffect(() => {
    if (isOpen && psgMembers.length === 0) {
      loadPsgMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load conversation for selected PSG member
  useEffect(() => {
    if (isOpen && selectedPsgMemberId) {
      loadConversation(selectedPsgMemberId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedPsgMemberId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    console.log(
      "Setting up real-time subscription for conversation:",
      conversationId,
    );

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("Real-time message received:", payload);
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
            console.log("Adding message to state:", newMessage);
            setMessages((prev) => [...prev, newMessage]);

            // Mark as read if chat is open and message is from someone else
            if (
              isOpen &&
              !isMinimized &&
              newMessage.sender_id !== currentUserId
            ) {
              await markMessagesAsRead(conversationId);
            } else if (newMessage.sender_id !== currentUserId) {
              // Update unread count
              loadUnreadCount();
            }
          }
        },
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [conversationId, isOpen, isMinimized, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load unread count periodically
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const sendNextQuestion = useCallback(
    async (questionIndex?: number) => {
      const indexToUse = questionIndex ?? currentQuestionIndex;

      if (!conversationId || indexToUse >= CASE_ASSESSMENT_QUESTIONS.length) {
        // Will handle completion separately
        console.log("sendNextQuestion called but conditions not met:", {
          conversationId,
          currentQuestionIndex: indexToUse,
          totalQuestions: CASE_ASSESSMENT_QUESTIONS.length,
        });
        return;
      }

      const question = CASE_ASSESSMENT_QUESTIONS[indexToUse];

      console.log(`Sending question ${indexToUse + 1}:`, question.question);

      // Check if this question index was already sent using ref
      if (sentQuestionsRef.current.has(indexToUse)) {
        console.log(`Question ${indexToUse} already sent, skipping...`);
        return;
      }

      // Mark this question as sent
      sentQuestionsRef.current.add(indexToUse);

      // Send question as system message to database so PSG members can see it
      const result = await sendSystemMessage(conversationId, question.question);

      if (!result.success) {
        console.error("Failed to send question:", result.error);
        // Remove from sent set if failed
        sentQuestionsRef.current.delete(indexToUse);
        return;
      }

      setWaitingForAnswer(true);
    },
    [conversationId, currentQuestionIndex],
  );

  const completeAssessment = useCallback(async () => {
    if (!conversationId) return;

    setWaitingForAnswer(false);
    setIsAssessmentActive(false);
    assessmentStartedRef.current = false; // Reset for future assessments
    sentQuestionsRef.current.clear(); // Clear sent questions tracking

    // Submit assessment
    const result = await submitCaseAssessment(
      conversationId,
      assessmentResponses,
    );

    if (result.success) {
      const completionMsg = result.data?.requiresImmediateAttention
        ? "Thank you for completing the assessment. Based on your responses, we recommend immediate support. A PSG member will reach out to you shortly. If you're in crisis, please contact emergency services (911) or the National Mental Health Crisis Hotline (1553)."
        : "Thank you for completing the assessment. A PSG member will review your responses and reach out to you soon. You can continue to message us here if you need support.";

      await sendSystemMessage(conversationId, completionMsg);

      showAlert({
        type: "success",
        message: "Assessment completed successfully.",
        duration: 5000,
      });
    } else {
      showAlert({
        type: "error",
        message: "Failed to submit assessment. Please try again.",
        duration: 5000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, assessmentResponses]);

  const handleAssessmentAnswer = useCallback(
    async (answer: string) => {
      if (!waitingForAnswer || !conversationId) return;

      const currentQuestion = CASE_ASSESSMENT_QUESTIONS[currentQuestionIndex];
      const normalizedAnswer = answer.trim().toLowerCase();

      // Validate yes/no answer
      if (!["yes", "no"].includes(normalizedAnswer)) {
        await sendSystemMessage(
          conversationId,
          "Please answer with 'yes' or 'no'.",
        );
        return;
      } // Store response
      const response: AssessmentResponse = {
        questionId: currentQuestion.id,
        answer: normalizedAnswer,
        timestamp: new Date().toISOString(),
      };

      const newResponses = [...assessmentResponses, response];
      setAssessmentResponses(newResponses);
      setWaitingForAnswer(false);

      // Check skip logic
      if (
        currentQuestion.skipLogic &&
        normalizedAnswer === currentQuestion.skipLogic.answer
      ) {
        const skipToIndex = CASE_ASSESSMENT_QUESTIONS.findIndex(
          (q) => q.id === currentQuestion.skipLogic!.skipTo,
        );
        if (skipToIndex !== -1) {
          setCurrentQuestionIndex(skipToIndex);
          setTimeout(() => sendNextQuestion(skipToIndex), 1000);
          return;
        }
      }

      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Send next question after brief delay, passing the next index directly
      setTimeout(() => {
        if (nextIndex < CASE_ASSESSMENT_QUESTIONS.length) {
          sendNextQuestion(nextIndex);
        } else {
          completeAssessment();
        }
      }, 1000);
    },
    [
      waitingForAnswer,
      conversationId,
      currentQuestionIndex,
      assessmentResponses,
      sendNextQuestion,
      completeAssessment,
    ],
  );

  const startAssessmentFlow = useCallback(async () => {
    if (!conversationId) {
      if (!selectedPsgMemberId) {
        showAlert({
          type: "error",
          message: "Please select a PSG member to start the assessment chat.",
          duration: 4000,
        });
        return;
      }

      // Wait for conversation to be created
      setTimeout(startAssessmentFlow, 500);
      return;
    }

    console.log("Starting assessment flow for conversation:", conversationId);

    setIsAssessmentActive(true);
    setCurrentQuestionIndex(0);
    setAssessmentResponses([]);
    sentQuestionsRef.current.clear(); // Clear tracking for new assessment

    // Send welcome message as system message
    const welcomeMsg =
      "Thank you for starting the case assessment. I'll ask you a few questions to better understand how we can support you. Please answer honestly - your responses are confidential.\n\nYou can answer with 'yes' or 'no' to each question.";

    console.log("Sending welcome message...");
    await sendSystemMessage(conversationId, welcomeMsg);
    console.log("Welcome message sent");

    // Send first question after a brief delay
    setTimeout(() => {
      console.log("Sending first question...");
      sendNextQuestion();
    }, 1500);
  }, [conversationId, selectedPsgMemberId, sendNextQuestion, showAlert]);

  // Listen for assessment start event
  useEffect(() => {
    const handleOpenForAssessment = () => {
      const shouldStart = sessionStorage.getItem("startAssessmentFlow");
      if (shouldStart === "true") {
        console.log("Opening chat for assessment...");
        setIsOpen(true);
        setIsMinimized(false);
        sessionStorage.removeItem("startAssessmentFlow");
        // Set flag to start assessment once conversation is loaded
        setShouldStartAssessment(true);
      }
    };

    window.addEventListener("openChatForAssessment", handleOpenForAssessment);
    return () => {
      window.removeEventListener(
        "openChatForAssessment",
        handleOpenForAssessment,
      );
    };
  }, []);

  // Start assessment when conversation is ready and flag is set
  useEffect(() => {
    if (
      shouldStartAssessment &&
      conversationId &&
      !assessmentStartedRef.current
    ) {
      console.log("Conversation loaded, starting assessment flow...");
      assessmentStartedRef.current = true;
      setShouldStartAssessment(false);
      setTimeout(() => {
        startAssessmentFlow();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStartAssessment, conversationId]);

  const loadUnreadCount = async () => {
    const result = await getUnreadCount();
    if (result.success && result.data !== undefined) {
      setUnreadCount(result.data);
    }
  };

  const loadPsgMembers = async () => {
    const result = await getStudentPsgMembers();
    if (result.success && result.data) {
      setPsgMembers(result.data);
    } else {
      showAlert({
        type: "error",
        message: result.error || "Failed to load PSG members",
        duration: 3000,
      });
    }
  };

  const loadConversation = async (psgMemberId: string) => {
    setLoading(true);
    try {
      const result = await getOrCreateConversation(psgMemberId);
      if (result.success && result.data) {
        setConversationId(result.data.id);
        await loadMessages(result.data.id);
      } else {
        showAlert({
          type: "error",
          message: result.error || "Failed to load conversation",
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    const result = await getMessages(convId);
    if (result.success && result.data) {
      setMessages(result.data);
      // Mark messages as read
      await markMessagesAsRead(convId);
      setUnreadCount(0);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      // If assessment is active and waiting for answer, handle it specially
      if (isAssessmentActive && waitingForAnswer) {
        await sendMessage(conversationId, messageContent);
        await handleAssessmentAnswer(messageContent);
      } else {
        const result = await sendMessage(conversationId, messageContent);
        if (!result.success) {
          // If failed, restore the message
          setNewMessage(messageContent);
          showAlert({
            type: "error",
            message: result.error || "Failed to send message",
            duration: 3000,
          });
        }
      }
      // Don't need to manually add to messages array - real-time subscription will handle it
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

  const handleOpen = async () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (conversationId) {
      await markMessagesAsRead(conversationId);
      setUnreadCount(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handlePsgMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedPsgMemberId(selectedId);
    setConversationId(null);
    setMessages([]);
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

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="relative">
          <button
            onClick={disabled ? undefined : handleOpen}
            disabled={disabled}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_6px_rgba(0,0,0,0.15)] transition-all z-50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: disabled ? "var(--bg-secondary)" : "var(--primary)",
              boxShadow: disabled ? "none" : undefined,
            }}
            title={
              disabled
                ? "Please start a case assessment first to use chat"
                : "Chat with PSG"
            }
          >
            <MessageCircle
              className="w-6 h-6"
              style={{ color: "var(--bg-dark)" }}
            />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--error)", color: "#ffffff" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 w-96 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.4),0_2px_10px_rgba(0,0,0,0.2)] rounded-lg overflow-hidden z-50 transition-all ${
            isMinimized ? "h-14" : "h-[32rem]"
          }`}
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
          }}
        >
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
                Support Chat
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
              <div
                className="px-4 py-3 border-b"
                style={{
                  background: "var(--bg-light)",
                  borderColor: "var(--border-muted)",
                }}
              >
                <label
                  htmlFor="psg-member-select"
                  className="block text-xs font-medium mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Select PSG member
                </label>
                <select
                  id="psg-member-select"
                  value={selectedPsgMemberId}
                  onChange={handlePsgMemberChange}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:border-transparent outline-none"
                  style={{
                    background: "var(--bg)",
                    color: "var(--text)",
                    borderColor: "var(--border)",
                  }}
                  disabled={loading || psgMembers.length === 0}
                >
                  <option value="" disabled>
                    {psgMembers.length === 0
                      ? "No PSG members available"
                      : "Choose a PSG member"}
                  </option>
                  {psgMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Messages Area */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ background: "var(--bg)" }}
              >
                {loading ? (
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
                      {selectedPsgMemberId
                        ? "Start your conversation with the selected PSG member"
                        : "Select a PSG member to start chatting"}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_id === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${
                          isOwn ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isOwn
                              ? "var(--primary-20)"
                              : "var(--bg-secondary)",
                          }}
                        >
                          <User
                            className="w-4 h-4"
                            style={{
                              color: isOwn
                                ? "var(--primary)"
                                : "var(--text-muted)",
                            }}
                          />
                        </div>
                        <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                          <p
                            className="text-xs mb-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {isOwn
                              ? message.sender?.full_name || "You"
                              : message.sender?.full_name || "PSG Member"}
                          </p>
                          <div
                            className={`inline-block p-3 rounded-lg max-w-[80%] shadow-[0_1px_2px_rgba(0,0,0,0.1)] ${
                              isOwn ? "rounded-tr-none" : "rounded-tl-none"
                            }`}
                            style={{
                              background: isOwn
                                ? "var(--primary)"
                                : "var(--bg-light)",
                              color: isOwn ? "var(--bg-dark)" : "var(--text)",
                            }}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.sender_id === null
                                ? message.content
                                : conversationId
                                  ? decryptMessage(
                                      message.content,
                                      conversationId,
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
                    placeholder={
                      selectedPsgMemberId
                        ? "Type your message..."
                        : "Select a PSG member first"
                    }
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-lg border resize-none focus:ring-2 focus:border-transparent outline-none text-sm"
                    style={{
                      background: "var(--bg)",
                      color: "var(--text)",
                      borderColor: "var(--border)",
                    }}
                    disabled={sending || loading || !selectedPsgMemberId}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      !newMessage.trim() ||
                      sending ||
                      loading ||
                      !selectedPsgMemberId
                    }
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
            </>
          )}
        </div>
      )}
    </>
  );
}
