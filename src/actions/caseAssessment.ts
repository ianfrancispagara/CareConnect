"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateSeverity,
  type AssessmentResponse,
} from "@/lib/constants/caseAssessment";

export async function submitCaseAssessment(
  conversationId: string,
  responses: AssessmentResponse[]
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Calculate severity
    const severity = calculateSeverity(responses);

    // Store assessment result in conversation metadata
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        assessment_completed: true,
        assessment_severity: severity.level,
        assessment_color: severity.color,
        requires_immediate_attention: severity.requiresImmediateAttention,
        assessment_responses: responses,
        assessment_completed_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (updateError) {
      console.error(
        "Error updating conversation with assessment:",
        updateError
      );
      return { success: false, error: "Failed to save assessment" };
    }

    return {
      success: true,
      data: {
        severity: severity.level,
        requiresImmediateAttention: severity.requiresImmediateAttention,
      },
    };
  } catch (error) {
    console.error("Error in submitCaseAssessment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getConversationAssessment(conversationId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("conversations")
      .select(
        "assessment_completed, assessment_severity, assessment_color, requires_immediate_attention, assessment_responses"
      )
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Error fetching conversation assessment:", error);
      return { success: false, error: "Failed to fetch assessment" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getConversationAssessment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
