"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  Referral,
  ReferralWithProfiles,
  ReferralAssessment,
  ReferralUpdateWithProfile,
  ReferralSource,
  ReferralStatus,
  ReferralSeverity,
  PsgTriageLevel,
} from "@/types/referrals";

type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

function mapPsgTriageToSeverity(triageLevel: PsgTriageLevel): ReferralSeverity {
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

// Create a new referral
export async function createReferral(data: {
  source: ReferralSource;
  reason: string;
  notes?: string;
  screening_result_id?: string;
}): Promise<ActionResponse<Referral>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const referralData = {
      student_id: user.id,
      source: data.source,
      reason: data.reason,
      notes: data.notes || null,
      screening_result_id: data.screening_result_id || null,
      status: "pending" as ReferralStatus,
    };

    const { data: referral, error } = await supabase
      .from("referrals")
      .insert(referralData)
      .select()
      .single();

    if (error) {
      console.error("Error creating referral:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: referral };
  } catch (error) {
    console.error("Unexpected error creating referral:", error);
    return { success: false, error: "Failed to create referral" };
  }
}

// Get all referrals for PSG members/admins
export async function getAllReferrals(): Promise<
  ActionResponse<ReferralWithProfiles[]>
> {
  try {
    const supabase = await createClient();

    const { data: referrals, error } = await supabase
      .from("referrals")
      .select(
        `
        *,
        student:profiles!referrals_student_id_fkey(id, full_name, email, school_id),
        assigned_psg_member:profiles!referrals_assigned_psg_member_id_fkey(id, full_name, codename, email),
        reviewed_by_profile:profiles!referrals_reviewed_by_fkey(id, full_name, codename)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching referrals:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: referrals };
  } catch (error) {
    console.error("Unexpected error fetching referrals:", error);
    return { success: false, error: "Failed to fetch referrals" };
  }
}

// Get only referrals forwarded by PSG members for admin queue review
export async function getAdminForwardedReferrals(): Promise<
  ActionResponse<ReferralWithProfiles[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Please login first" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unable to verify user role" };
    }

    if (profile.role !== "admin") {
      return { success: false, error: "Unauthorized access" };
    }

    const { data: referrals, error } = await supabase
      .from("referrals")
      .select(
        `
        *,
        student:profiles!referrals_student_id_fkey(id, full_name, email, school_id),
        assigned_psg_member:profiles!referrals_assigned_psg_member_id_fkey(id, full_name, codename, email),
        reviewed_by_profile:profiles!referrals_reviewed_by_fkey(id, full_name, codename)
      `,
      )
      .not("reviewed_by", "is", null)
      .neq("status", "pending")
      .order("reviewed_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin referral queue:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: referrals || [] };
  } catch (error) {
    console.error("Unexpected error fetching admin referral queue:", error);
    return { success: false, error: "Failed to fetch admin referral queue" };
  }
}

// Get referrals for the currently authenticated PSG/Admin user
export async function getCurrentUserReferralsView(): Promise<
  ActionResponse<ReferralWithProfiles[]>
> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Please login first" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unable to verify user role" };
    }

    if (profile.role === "admin") {
      return await getAllReferrals();
    }

    if (profile.role === "psg_member") {
      return await getPSGAssignedReferrals(user.id);
    }

    return { success: false, error: "Unauthorized access" };
  } catch (error) {
    console.error("Unexpected error loading current user referrals:", error);
    return { success: false, error: "Failed to fetch referrals" };
  }
}

// Get referrals for a specific PSG member (assigned to them OR unassigned)
export async function getPSGAssignedReferrals(
  psgMemberId: string,
): Promise<ActionResponse<ReferralWithProfiles[]>> {
  try {
    const supabase = await createClient();

    const { data: referrals, error } = await supabase
      .from("referrals")
      .select(
        `
        *,
        student:profiles!referrals_student_id_fkey(id, full_name, email, school_id),
        assigned_psg_member:profiles!referrals_assigned_psg_member_id_fkey(id, full_name, codename, email),
        reviewed_by_profile:profiles!referrals_reviewed_by_fkey(id, full_name, codename)
      `,
      )
      .or(
        `assigned_psg_member_id.eq.${psgMemberId},assigned_psg_member_id.is.null`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching PSG assigned referrals:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: referrals };
  } catch (error) {
    console.error("Unexpected error fetching PSG assigned referrals:", error);
    return { success: false, error: "Failed to fetch assigned referrals" };
  }
}

// Get student's own referrals
export async function getStudentReferrals(
  studentId: string,
): Promise<ActionResponse<ReferralWithProfiles[]>> {
  try {
    const supabase = await createClient();

    const { data: referrals, error } = await supabase
      .from("referrals")
      .select(
        `
        *,
        student:profiles!referrals_student_id_fkey(id, full_name, email, school_id),
        assigned_psg_member:profiles!referrals_assigned_psg_member_id_fkey(id, full_name, codename, email),
        reviewed_by_profile:profiles!referrals_reviewed_by_fkey(id, full_name, codename)
      `,
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching student referrals:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: referrals };
  } catch (error) {
    console.error("Unexpected error fetching student referrals:", error);
    return { success: false, error: "Failed to fetch referrals" };
  }
}

export async function getStudentReferralAppointmentDetails(
  referralId: string,
): Promise<
  ActionResponse<{
    id: string;
    appointment_date: string;
    location_type: "online" | "in_person" | null;
    meeting_link: string | null;
    notes: string | null;
    status: string;
  } | null>
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

    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select("id, student_id, assigned_psg_member_id, reviewed_by")
      .eq("id", referralId)
      .single();

    if (referralError || !referral) {
      return { success: false, error: "Referral not found" };
    }

    if (referral.student_id !== user.id) {
      return { success: false, error: "Unauthorized access" };
    }

    const psgMemberId = referral.assigned_psg_member_id || referral.reviewed_by;

    if (!psgMemberId) {
      return { success: true, data: null };
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        "id, appointment_date, location_type, meeting_link, notes, status",
      )
      .eq("student_id", user.id)
      .eq("psg_member_id", psgMemberId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appointmentError) {
      console.error(
        "Error fetching appointment details for referral:",
        appointmentError,
      );
      return { success: false, error: appointmentError.message };
    }

    return { success: true, data: appointment ?? null };
  } catch (error) {
    console.error(
      "Unexpected error fetching student referral appointment details:",
      error,
    );
    return { success: false, error: "Failed to fetch appointment details" };
  }
}

// Get single referral details
export async function getReferralById(
  referralId: string,
): Promise<ActionResponse<ReferralWithProfiles>> {
  try {
    const supabase = await createClient();

    const { data: referral, error } = await supabase
      .from("referrals")
      .select(
        `
        *,
        student:profiles!referrals_student_id_fkey(id, full_name, email, school_id),
        assigned_psg_member:profiles!referrals_assigned_psg_member_id_fkey(id, full_name, codename, email),
        reviewed_by_profile:profiles!referrals_reviewed_by_fkey(id, full_name, codename)
      `,
      )
      .eq("id", referralId)
      .single();

    if (error) {
      console.error("Error fetching referral:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: referral };
  } catch (error) {
    console.error("Unexpected error fetching referral:", error);
    return { success: false, error: "Failed to fetch referral" };
  }
}

// Update referral status and assignment
export async function updateReferralStatus(
  referralId: string,
  status: ReferralStatus,
  severity?: ReferralSeverity,
  assignedPsgMemberId?: string,
): Promise<ActionResponse<Referral>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unable to verify user role" };
    }

    if (profile.role === "psg_member") {
      if (status !== "reviewed") {
        return {
          success: false,
          error: "PSG members can only forward referrals to admin after review",
        };
      }

      if (!severity) {
        return {
          success: false,
          error: "Select a triage level before forwarding to admin",
        };
      }
    }

    const updateData: Partial<Referral> = {
      status,
      ...(severity && { severity }),
      ...(status === "reviewed" && {
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      }),
      ...(status === "assigned" &&
        assignedPsgMemberId && {
          assigned_psg_member_id: assignedPsgMemberId,
          assigned_at: new Date().toISOString(),
        }),
      ...(status === "completed" && {
        completed_at: new Date().toISOString(),
      }),
    };

    const { data: referral, error } = await supabase
      .from("referrals")
      .update(updateData)
      .eq("id", referralId)
      .select()
      .single();

    if (error) {
      console.error("Error updating referral:", error);
      return { success: false, error: error.message };
    }

    // Create update log
    await supabase.from("referral_updates").insert({
      referral_id: referralId,
      updated_by: user.id,
      update_type: "status_change",
      new_status: status,
      content: `Status changed to ${status}`,
    });

    return { success: true, data: referral };
  } catch (error) {
    console.error("Unexpected error updating referral:", error);
    return { success: false, error: "Failed to update referral" };
  }
}

export async function forwardReferralToAdmin(
  referralId: string,
  triageLevel: PsgTriageLevel,
  reviewNotes?: string,
): Promise<ActionResponse<Referral>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unable to verify user role" };
    }

    if (profile.role !== "psg_member" && profile.role !== "admin") {
      return {
        success: false,
        error: "Only PSG members can forward referrals",
      };
    }

    const severity = mapPsgTriageToSeverity(triageLevel);
    const triageLabel = getPsgTriageLabel(triageLevel);

    const { data: referral, error: updateError } = await supabase
      .from("referrals")
      .update({
        status: "reviewed",
        severity,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", referralId)
      .select()
      .single();

    if (updateError) {
      console.error("Error forwarding referral to admin:", updateError);
      return { success: false, error: updateError.message };
    }

    const updateContent = reviewNotes?.trim()
      ? `Forwarded to admin as ${triageLabel}. Notes: ${reviewNotes.trim()}`
      : `Forwarded to admin as ${triageLabel}.`;

    await supabase.from("referral_updates").insert({
      referral_id: referralId,
      updated_by: user.id,
      update_type: "status_change",
      new_status: "reviewed",
      content: updateContent,
    });

    return { success: true, data: referral };
  } catch (error) {
    console.error("Unexpected error forwarding referral:", error);
    return { success: false, error: "Failed to forward referral to admin" };
  }
}

// Create case assessment
export async function createReferralAssessment(
  data: Omit<
    ReferralAssessment,
    "id" | "created_at" | "updated_at" | "assessed_by"
  >,
): Promise<ActionResponse<ReferralAssessment>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: assessment, error } = await supabase
      .from("referral_assessments")
      .insert({
        ...data,
        assessed_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating assessment:", error);
      return { success: false, error: error.message };
    }

    // Update referral severity based on assessment
    await supabase
      .from("referrals")
      .update({ severity: data.risk_level })
      .eq("id", data.referral_id);

    // Create update log
    await supabase.from("referral_updates").insert({
      referral_id: data.referral_id,
      updated_by: user.id,
      update_type: "assessment",
      content: `Case assessment completed with ${data.risk_level} risk level`,
    });

    return { success: true, data: assessment };
  } catch (error) {
    console.error("Unexpected error creating assessment:", error);
    return { success: false, error: "Failed to create assessment" };
  }
}

// Get case assessment for a referral
export async function getReferralAssessment(
  referralId: string,
): Promise<ActionResponse<ReferralAssessment>> {
  try {
    const supabase = await createClient();

    const { data: assessment, error } = await supabase
      .from("referral_assessments")
      .select("*")
      .eq("referral_id", referralId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error fetching assessment:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: assessment || undefined };
  } catch (error) {
    console.error("Unexpected error fetching assessment:", error);
    return { success: false, error: "Failed to fetch assessment" };
  }
}

// Get referral updates
export async function getReferralUpdates(
  referralId: string,
): Promise<ActionResponse<ReferralUpdateWithProfile[]>> {
  try {
    const supabase = await createClient();

    const { data: updates, error } = await supabase
      .from("referral_updates")
      .select(
        `
        *,
        updated_by_profile:profiles!referral_updates_updated_by_fkey(id, full_name, role)
      `,
      )
      .eq("referral_id", referralId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching referral updates:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: updates };
  } catch (error) {
    console.error("Unexpected error fetching referral updates:", error);
    return { success: false, error: "Failed to fetch updates" };
  }
}

// Add a note to referral
export async function addReferralNote(
  referralId: string,
  content: string,
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase.from("referral_updates").insert({
      referral_id: referralId,
      updated_by: user.id,
      update_type: "note",
      content,
    });

    if (error) {
      console.error("Error adding note:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error adding note:", error);
    return { success: false, error: "Failed to add note" };
  }
}

// Escalate referral to OCCS
export async function escalateReferral(
  referralId: string,
  escalatedTo: string,
  escalationReason: string,
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase
      .from("referrals")
      .update({
        status: "escalated",
        escalated_to: escalatedTo,
        escalation_reason: escalationReason,
      })
      .eq("id", referralId);

    if (error) {
      console.error("Error escalating referral:", error);
      return { success: false, error: error.message };
    }

    // Create update log
    await supabase.from("referral_updates").insert({
      referral_id: referralId,
      updated_by: user.id,
      update_type: "escalation",
      content: `Escalated to ${escalatedTo}: ${escalationReason}`,
    });

    return { success: true };
  } catch (error) {
    console.error("Unexpected error escalating referral:", error);
    return { success: false, error: "Failed to escalate referral" };
  }
}

// Get all PSG members
export async function getPSGMembers(): Promise<
  ActionResponse<Array<{ id: string; full_name: string; email: string }>>
> {
  try {
    const supabase = await createClient();

    const { data: psgMembers, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "psg_member")
      .order("full_name");

    if (error) {
      console.error("Error fetching PSG members:", error);
      return { success: false, error: "Failed to load PSG members" };
    }

    return { success: true, data: psgMembers };
  } catch (error) {
    console.error("Unexpected error fetching PSG members:", error);
    return { success: false, error: "Failed to load PSG members" };
  }
}

export async function approveReferralAndSchedule(
  referralId: string,
  input: {
    appointment_date: string;
    location_type: "online" | "in_person";
    meeting_link?: string;
    notes?: string;
    duration_minutes?: number;
    psg_member_id?: string;
  },
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Please login first" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized access" };
    }

    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select("id, student_id, assigned_psg_member_id, reviewed_by, status")
      .eq("id", referralId)
      .single();

    if (referralError || !referral) {
      return { success: false, error: "Referral not found" };
    }

    const psgMemberId =
      input.psg_member_id ||
      referral.assigned_psg_member_id ||
      referral.reviewed_by;

    if (!psgMemberId) {
      return {
        success: false,
        error: "No PSG member available for scheduling",
      };
    }

    if (!input.appointment_date) {
      return { success: false, error: "Appointment date is required" };
    }

    if (input.location_type === "online" && !input.meeting_link?.trim()) {
      return {
        success: false,
        error: "Meeting link is required for online sessions",
      };
    }

    const appointmentDate = new Date(input.appointment_date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return { success: false, error: "Invalid appointment date" };
    }

    const { error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        student_id: referral.student_id,
        psg_member_id: psgMemberId,
        appointment_date: appointmentDate.toISOString(),
        duration_minutes: input.duration_minutes || 60,
        location_type: input.location_type,
        meeting_link:
          input.location_type === "online"
            ? input.meeting_link?.trim() || null
            : null,
        notes: input.notes?.trim() || null,
        status: "scheduled",
      });

    if (appointmentError) {
      console.error(
        "Error creating appointment from referral:",
        appointmentError,
      );
      return {
        success: false,
        error: appointmentError.message || "Failed to schedule appointment",
      };
    }

    const { error: updateReferralError } = await supabase
      .from("referrals")
      .update({
        status: "assigned",
        assigned_psg_member_id: psgMemberId,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", referralId);

    if (updateReferralError) {
      console.error(
        "Error updating referral after approval:",
        updateReferralError,
      );
      return { success: false, error: "Failed to update referral status" };
    }

    await supabase.from("referral_updates").insert({
      referral_id: referralId,
      updated_by: user.id,
      update_type: "status_change",
      previous_status: referral.status,
      new_status: "assigned",
      content: `Approved by admin and scheduled as ${input.location_type === "online" ? "online" : "face-to-face"} session.`,
    });

    revalidatePath("/dashboard/admin/referrals");
    revalidatePath("/dashboard/appointments");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error approving referral:", error);
    return { success: false, error: "Failed to approve referral" };
  }
}

export async function rejectReferralByAdmin(
  referralId: string,
  reason?: string,
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Please login first" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized access" };
    }

    const rejectionReason = reason?.trim() || "Rejected by admin";

    const { data: referralBeforeUpdate, error: referralLoadError } =
      await supabase
        .from("referrals")
        .select("status")
        .eq("id", referralId)
        .single();

    if (referralLoadError || !referralBeforeUpdate) {
      return { success: false, error: "Referral not found" };
    }

    const { error: rejectError } = await supabase
      .from("referrals")
      .update({
        status: "escalated",
        escalated_to: "OCCS",
        escalation_reason: rejectionReason,
      })
      .eq("id", referralId);

    if (rejectError) {
      console.error("Error rejecting referral:", rejectError);
      return { success: false, error: "Failed to reject referral" };
    }

    await supabase.from("referral_updates").insert({
      referral_id: referralId,
      updated_by: user.id,
      update_type: "escalation",
      previous_status: referralBeforeUpdate.status,
      new_status: "escalated",
      content: `Rejected by admin. ${rejectionReason}`,
    });

    revalidatePath("/dashboard/admin/referrals");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error rejecting referral:", error);
    return { success: false, error: "Failed to reject referral" };
  }
}
