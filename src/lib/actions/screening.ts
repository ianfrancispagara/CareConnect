"use server";

import { createClient } from "@/lib/supabase/server";
import {
  screeningQuestionSchema,
  calculateSeverity,
  type ScreeningQuestion,
  type QuestionResponse,
} from "@/lib/validations/screening";
import type { PsgTriageLevel, ReferralSeverity } from "@/types/referrals";

function mapPsgTriageToReferralSeverity(
  triageLevel: PsgTriageLevel,
): ReferralSeverity {
  switch (triageLevel) {
    case "needs_immediate_help":
      return "critical";
    case "moderate":
      return "moderate";
    case "good":
      return "low";
    default:
      return "low";
  }
}

function getPsgTriageLabel(triageLevel: PsgTriageLevel): string {
  switch (triageLevel) {
    case "needs_immediate_help":
      return "Needs Immediate Help";
    case "moderate":
      return "Moderate";
    case "good":
      return "Good";
    default:
      return "Good";
  }
}

/**
 * Submit a new screening with responses
 */
export async function submitScreening(responses: QuestionResponse[]) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Calculate severity
    const severity = calculateSeverity(responses);

    // Insert screening result
    const { data: result, error: resultError } = await supabase
      .from("screening_results")
      .insert({
        user_id: user.id,
        total_score: severity.totalScore,
        severity_score: Math.round(severity.percentage), // Store as integer (0-100)
        color_code: severity.color,
        requires_immediate_attention: severity.requiresImmediateAttention,
      })
      .select()
      .single();

    if (resultError || !result) {
      console.error("Error inserting screening result:", resultError);
      return { error: "Failed to save screening result" };
    }

    // Insert screening responses
    const responsesToInsert = responses.map((response) => ({
      screening_result_id: result.id,
      question_id: response.question_id,
      answer: String(response.answer),
      score: response.score || 0,
    }));

    const { error: responsesError } = await supabase
      .from("screening_responses")
      .insert(responsesToInsert);

    if (responsesError) {
      console.error("Error inserting responses:", responsesError);
      return { error: "Failed to save screening responses" };
    }

    return { data: result, success: true };
  } catch (error) {
    console.error("Unexpected error in submitScreening:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get all screening results for PSG members (with filters)
 */
export async function getScreeningResults(options?: {
  reviewed?: boolean;
  severityLevel?: "low" | "moderate" | "high";
  limit?: number;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("screening_results")
      .select("*")
      .order("created_at", { ascending: false });

    if (options?.reviewed !== undefined) {
      if (options.reviewed) {
        query = query.not("reviewed_at", "is", null);
      } else {
        query = query.is("reviewed_at", null);
      }
    }

    if (options?.severityLevel) {
      query = query.eq("severity_level", options.severityLevel);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching screening results:", error);
      return { error: "Failed to fetch screening results" };
    }

    return { data, success: true };
  } catch (error) {
    console.error("Unexpected error in getScreeningResults:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get a single screening result with responses
 */
export async function getScreeningById(screeningId: string) {
  try {
    const supabase = await createClient();

    // Get screening result
    const { data: result, error: resultError } = await supabase
      .from("screening_results")
      .select("*")
      .eq("id", screeningId)
      .single();

    if (resultError || !result) {
      console.error("Error fetching screening:", resultError);
      return { error: "Screening not found" };
    }

    // Get responses
    const { data: responses, error: responsesError } = await supabase
      .from("screening_responses")
      .select("*")
      .eq("screening_result_id", screeningId)
      .order("created_at", { ascending: true });

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      return { error: "Failed to fetch responses" };
    }

    // Get questions to match with responses
    const { data: questions, error: questionsError } = await supabase
      .from("screening_questions")
      .select("*")
      .order("order", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
    }

    // Create maps for matching - both by ID and by index for legacy data
    const questionMapById = new Map();
    const questionsByOrder: Array<NonNullable<typeof questions>[number]> = [];

    if (questions) {
      questions.forEach((q, index) => {
        questionMapById.set(q.id, q);
        questionsByOrder[index] = q;
      });
    }

    // Enhance responses with question text
    const enhancedResponses = (responses || []).map((response, index) => {
      let question;

      // Try to match by question_id first (for new responses with UUID)
      question = questionMapById.get(response.question_id);

      // If no match and question_id looks like "preset-X" (legacy format),
      // match by order/index instead
      if (
        !question &&
        typeof response.question_id === "string" &&
        response.question_id.startsWith("preset-")
      ) {
        const presetIndex = parseInt(
          response.question_id.replace("preset-", ""),
        );
        if (!isNaN(presetIndex) && questionsByOrder[presetIndex]) {
          question = questionsByOrder[presetIndex];
        }
      }

      // If still no match, try matching by response index
      if (!question && questionsByOrder[index]) {
        question = questionsByOrder[index];
      }

      return {
        ...response,
        question_text: question?.question_text || "Question text not available",
      };
    });

    return {
      data: {
        screening: result,
        responses: enhancedResponses,
      },
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in getScreeningById:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update screening review status
 */
export async function updateScreeningReview(
  screeningId: string,
  reviewNotes: string,
  triageLevel: PsgTriageLevel,
) {
  try {
    const supabase = await createClient();

    // Get current user (must be PSG member or admin)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    const { data: reviewerProfile, error: reviewerProfileError } =
      await supabase.from("profiles").select("role").eq("id", user.id).single();

    if (reviewerProfileError || !reviewerProfile) {
      return { error: "Unable to verify user role" };
    }

    if (
      reviewerProfile.role !== "psg_member" &&
      reviewerProfile.role !== "admin"
    ) {
      return { error: "Only PSG members can review screenings" };
    }

    const referralSeverity = mapPsgTriageToReferralSeverity(triageLevel);
    const triageLabel = getPsgTriageLabel(triageLevel);

    const { data, error } = await supabase
      .from("screening_results")
      .update({
        recommendations: reviewNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", screeningId)
      .select()
      .single();

    if (error) {
      console.error("Error updating screening review:", error);
      return { error: "Failed to update screening review" };
    }

    const { data: existingReferral, error: referralFetchError } = await supabase
      .from("referrals")
      .select("id")
      .eq("screening_result_id", screeningId)
      .maybeSingle();

    if (referralFetchError) {
      console.error("Error fetching screening referral:", referralFetchError);
      return { error: "Failed to route screening to admin" };
    }

    const referralNotes = reviewNotes?.trim()
      ? `PSG review: ${reviewNotes.trim()}`
      : `PSG triage decision: ${triageLabel}`;

    let referralId = existingReferral?.id ?? null;

    if (referralId) {
      const { error: referralUpdateError } = await supabase
        .from("referrals")
        .update({
          status: "reviewed",
          severity: referralSeverity,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          notes: referralNotes,
        })
        .eq("id", referralId);

      if (referralUpdateError) {
        console.error(
          "Error updating referral from screening:",
          referralUpdateError,
        );
        return { error: "Failed to route screening to admin" };
      }
    } else {
      const { data: createdReferral, error: referralCreateError } =
        await supabase
          .from("referrals")
          .insert({
            student_id: data.user_id,
            source: "screening",
            status: "reviewed",
            severity: referralSeverity,
            notes: referralNotes,
            reason: `PSG triage decision: ${triageLabel}`,
            screening_result_id: screeningId,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .select("id")
          .single();

      if (referralCreateError || !createdReferral) {
        console.error(
          "Error creating referral from screening:",
          referralCreateError,
        );
        return { error: "Failed to route screening to admin" };
      }

      referralId = createdReferral.id;
    }

    if (referralId) {
      await supabase.from("referral_updates").insert({
        referral_id: referralId,
        updated_by: user.id,
        update_type: "status_change",
        new_status: "reviewed",
        content: `Forwarded screening result to admin as ${triageLabel}.`,
      });
    }

    return { data, success: true };
  } catch (error) {
    console.error("Unexpected error in updateScreeningReview:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Create a case assessment for a screening
 */
export async function createCaseAssessment(screeningId: string) {
  try {
    const supabase = await createClient();

    // Get current user (student initiating the assessment)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Get screening to verify it belongs to the user
    const { data: screening, error: screeningError } = await supabase
      .from("screening_results")
      .select("user_id")
      .eq("id", screeningId)
      .single();

    if (screeningError || !screening) {
      return { error: "Screening not found" };
    }

    // Verify the screening belongs to the current user
    if (screening.user_id !== user.id) {
      return { error: "Unauthorized access" };
    }

    // Create case assessment (no PSG member assigned yet)
    const { data, error } = await supabase
      .from("case_assessments")
      .insert({
        screening_result_id: screeningId,
        user_id: user.id,
        psg_member_id: null, // Will be assigned later by PSG member
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating case assessment:", error);
      return { error: "Failed to create case assessment" };
    }

    return { data, success: true };
  } catch (error) {
    console.error("Unexpected error in createCaseAssessment:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get preset screening questions
 */
export async function getScreeningQuestions() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("screening_questions")
      .select("*")
      .eq("is_preset", true)
      .order("order", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error);
      return { error: "Failed to fetch questions" };
    }

    return { data, success: true };
  } catch (error) {
    console.error("Unexpected error in getScreeningQuestions:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get the latest screening result for the current user
 */
export async function getLatestScreeningResult() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Get latest screening result
    const { data, error } = await supabase
      .from("screening_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No results found
        return { error: "No screening results found" };
      }
      console.error("Error fetching latest screening:", error);
      return { error: "Failed to fetch screening result" };
    }

    return { data, success: true };
  } catch (error) {
    console.error("Unexpected error in getLatestScreeningResult:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Add a custom screening question (Admin/PSG only)
 */
export async function addScreeningQuestion(
  question: Omit<ScreeningQuestion, "id" | "created_at" | "updated_at">,
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Validate question
    const validated = screeningQuestionSchema.parse(question);

    const { data, error } = await supabase
      .from("screening_questions")
      .insert({
        ...validated,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding question:", error);
      return { error: "Failed to add question" };
    }

    return { data, success: true };
  } catch (error) {
    console.error("Unexpected error in addScreeningQuestion:", error);
    return { error: "An unexpected error occurred" };
  }
}
