"use server";

import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  UserProfile,
  UpdateUserInput,
  SystemStats,
  AppointmentReport,
  ReferralReport,
  SessionReport,
  UsageReport,
  AuditLog,
  ReportFilters,
} from "@/types/admin";

// =============================
// User Management
// =============================

export async function getAllUsers() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get all users error:", error);
      return { success: false, error: "Failed to fetch users" };
    }

    return { success: true, data: data as UserProfile[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getUserById(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Get user error:", error);
      return { success: false, error: "Failed to fetch user" };
    }

    return { success: true, data: data as UserProfile };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateUser(userId: string, updates: UpdateUserInput) {
  try {
    const supabase = await createClient();

    // Check if admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "Only admins can update users" };
    }

    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetUserError) {
      console.error("Get target user error:", targetUserError);
      return { success: false, error: "Failed to fetch user" };
    }

    if (targetUser?.role === "admin") {
      return {
        success: false,
        error: "Admin accounts are SQL-managed and cannot be edited here",
      };
    }

    if (updates.role === "admin") {
      return {
        success: false,
        error:
          "Admin accounts can only be created through the Supabase SQL editor",
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Update user error:", error);
      return { success: false, error: "Failed to update user" };
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true, data: data as UserProfile };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteUser() {
  try {
    const supabase = await createClient();

    // Check if admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "Only admins can delete users" };
    }

    return {
      success: false,
      error: "Account deletion is disabled. Use block or unblock instead.",
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function blockPsgMember(userId: string) {
  try {
    const supabase = await createClient();

    // Check if admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "Only admins can block accounts" };
    }

    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("role, is_blocked")
      .eq("id", userId)
      .single();

    if (targetUserError) {
      console.error("Get target user error:", targetUserError);
      return { success: false, error: "Failed to fetch user" };
    }

    if (targetUser?.role !== "psg_member" && targetUser?.role !== "student") {
      return {
        success: false,
        error: "Only student and PSG accounts can be blocked",
      };
    }

    if (targetUser.is_blocked) {
      return { success: false, error: "Account is already blocked" };
    }

    // Keep role unchanged and explicitly mark the account as blocked.
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ is_blocked: true })
      .eq("id", userId);

    if (updateProfileError) {
      console.error(
        "Block PSG member profile update error:",
        updateProfileError,
      );
      return { success: false, error: "Failed to block account" };
    }

    // Ensure blocked member no longer appears as available for booking.
    const { error: deactivateAvailabilityError } = await supabase
      .from("psg_availability")
      .update({ is_active: false })
      .eq("psg_member_id", userId)
      .eq("is_active", true);

    if (deactivateAvailabilityError) {
      console.error(
        "Deactivate PSG availability error:",
        deactivateAvailabilityError,
      );
      return { success: false, error: "Failed to deactivate PSG availability" };
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function unblockPsgMember(userId: string) {
  try {
    const supabase = await createClient();

    // Check if admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "Only admins can unblock accounts" };
    }

    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("role, is_blocked")
      .eq("id", userId)
      .single();

    if (targetUserError) {
      console.error("Get target user error:", targetUserError);
      return { success: false, error: "Failed to fetch user" };
    }

    if (targetUser?.role !== "psg_member" && targetUser?.role !== "student") {
      return {
        success: false,
        error: "Only student and PSG accounts can be unblocked",
      };
    }

    if (!targetUser.is_blocked) {
      return { success: false, error: "Account is not blocked" };
    }

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ is_blocked: false })
      .eq("id", userId);

    if (updateProfileError) {
      console.error(
        "Unblock PSG member profile update error:",
        updateProfileError,
      );
      return { success: false, error: "Failed to unblock account" };
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function generatePsgInviteLink() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return {
        success: false,
        error: "Only admins can generate PSG invite links",
      };
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const { error: inviteError } = await supabase.from("psg_invites").insert({
      token_hash: tokenHash,
      created_by: user.id,
      expires_at: expiresAt,
    });

    if (inviteError) {
      console.error("Generate PSG invite error:", inviteError);
      return { success: false, error: "Failed to generate invite link" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/register?invite=${encodeURIComponent(token)}`;

    return {
      success: true,
      data: {
        inviteLink,
        expiresAt,
      },
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================
// System Statistics
// =============================

export async function getSystemStats(): Promise<{
  success: boolean;
  data?: SystemStats;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get user counts
    const { data: users } = await supabase.from("profiles").select("role");

    const total_users = users?.length || 0;
    const total_students =
      users?.filter((u) => u.role === "student").length || 0;
    const total_psg_members =
      users?.filter((u) => u.role === "psg_member").length || 0;
    const total_admins = users?.filter((u) => u.role === "admin").length || 0;

    // Get appointment counts
    const { count: total_appointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true });

    const { count: appointments_this_month } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ).toISOString(),
      );

    // Get referral counts
    const { count: total_referrals } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true });

    const { count: referrals_this_month } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ).toISOString(),
      );

    // Get session counts
    const { count: total_sessions } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true });

    const { count: sessions_this_month } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ).toISOString(),
      );

    const stats: SystemStats = {
      total_users,
      total_students,
      total_psg_members,
      total_admins,
      total_appointments: total_appointments || 0,
      total_referrals: total_referrals || 0,
      total_sessions: total_sessions || 0,
      appointments_this_month: appointments_this_month || 0,
      referrals_this_month: referrals_this_month || 0,
      sessions_this_month: sessions_this_month || 0,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================
// Reporting
// =============================

export async function getAppointmentReports(filters?: ReportFilters) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_date,
        status,
        duration_minutes,
        location_type,
        created_at,
        student:profiles!appointments_student_id_fkey(id, full_name, school_id),
        psg_member:profiles!appointments_psg_member_id_fkey(id, full_name)
      `,
      )
      .order("appointment_date", { ascending: false });

    if (filters?.start_date) {
      query = query.gte("appointment_date", filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte("appointment_date", filters.end_date);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.psg_member_id) {
      query = query.eq("psg_member_id", filters.psg_member_id);
    }
    if (filters?.student_id) {
      query = query.eq("student_id", filters.student_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Get appointment reports error:", error);
      return { success: false, error: "Failed to fetch appointment reports" };
    }

    const reports: AppointmentReport[] =
      data?.map((apt) => {
        const student = Array.isArray(apt.student)
          ? apt.student[0]
          : apt.student;
        const psgMember = Array.isArray(apt.psg_member)
          ? apt.psg_member[0]
          : apt.psg_member;
        return {
          id: apt.id,
          student_name: student?.full_name || "Unknown",
          student_id: student?.school_id || "N/A",
          psg_member_name: psgMember?.full_name || "Unknown",
          appointment_date: apt.appointment_date,
          status: apt.status,
          duration_minutes: apt.duration_minutes,
          location_type: apt.location_type,
          created_at: apt.created_at,
        };
      }) || [];

    return { success: true, data: reports };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getReferralReports(filters?: ReportFilters) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("referrals")
      .select(
        `
        id,
        source,
        status,
        severity,
        created_at,
        updated_at,
        student:profiles!referrals_student_id_fkey(id, full_name, school_id),
        assigned_psg_member:profiles!referrals_assigned_psg_member_id_fkey(full_name)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.start_date) {
      query = query.gte("created_at", filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte("created_at", filters.end_date);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.psg_member_id) {
      query = query.eq("assigned_psg_member_id", filters.psg_member_id);
    }
    if (filters?.student_id) {
      query = query.eq("student_id", filters.student_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Get referral reports error:", error);
      return { success: false, error: "Failed to fetch referral reports" };
    }

    const reports: ReferralReport[] =
      data?.map((ref) => {
        const student = Array.isArray(ref.student)
          ? ref.student[0]
          : ref.student;
        const assignedPsg = Array.isArray(ref.assigned_psg_member)
          ? ref.assigned_psg_member[0]
          : ref.assigned_psg_member;
        const source = ref.source || "unknown";
        const status = ref.status || "unknown";
        const severity = ref.severity || "unknown";
        return {
          id: ref.id,
          student_name: student?.full_name || "Unknown",
          student_id: student?.school_id || "N/A",
          source,
          status,
          severity,
          assigned_psg_member: assignedPsg?.full_name,
          created_at: ref.created_at,
          updated_at: ref.updated_at,
        };
      }) || [];

    return { success: true, data: reports };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getSessionReports(filters?: ReportFilters) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("sessions")
      .select(
        `
        id,
        duration_minutes,
        notes,
        feedback,
        created_at,
        appointment:appointments(
          appointment_date,
          student:profiles!appointments_student_id_fkey(full_name, school_id),
          psg_member:profiles!appointments_psg_member_id_fkey(full_name)
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.start_date) {
      query = query.gte("created_at", filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte("created_at", filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Get session reports error:", error);
      return { success: false, error: "Failed to fetch session reports" };
    }

    const reports: SessionReport[] =
      data?.map((sess) => {
        const appointment = Array.isArray(sess.appointment)
          ? sess.appointment[0]
          : sess.appointment;
        const student =
          appointment?.student &&
          (Array.isArray(appointment.student)
            ? appointment.student[0]
            : appointment.student);
        const psgMember =
          appointment?.psg_member &&
          (Array.isArray(appointment.psg_member)
            ? appointment.psg_member[0]
            : appointment.psg_member);
        return {
          id: sess.id,
          student_name: student?.full_name || "Unknown",
          student_id: student?.school_id || "N/A",
          psg_member_name: psgMember?.full_name || "Unknown",
          appointment_date: appointment?.appointment_date || "",
          duration_minutes: sess.duration_minutes || 0,
          has_notes: !!sess.notes,
          has_feedback: !!sess.feedback,
          created_at: sess.created_at,
        };
      }) || [];

    return { success: true, data: reports };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getUsageReport(
  startDate?: string,
  endDate?: string,
): Promise<{ success: boolean; data?: UsageReport; error?: string }> {
  try {
    const supabase = await createClient();

    // Get appointment counts
    let totalAppointmentsQuery = supabase
      .from("appointments")
      .select("*", { count: "exact", head: true });

    if (startDate) {
      totalAppointmentsQuery = totalAppointmentsQuery.gte(
        "created_at",
        startDate,
      );
    }
    if (endDate) {
      totalAppointmentsQuery = totalAppointmentsQuery.lte(
        "created_at",
        endDate,
      );
    }

    const { count: total_appointments } = await totalAppointmentsQuery;

    let completedAppointmentsQuery = supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    if (startDate) {
      completedAppointmentsQuery = completedAppointmentsQuery.gte(
        "created_at",
        startDate,
      );
    }
    if (endDate) {
      completedAppointmentsQuery = completedAppointmentsQuery.lte(
        "created_at",
        endDate,
      );
    }

    const { count: completed_appointments } = await completedAppointmentsQuery;

    let cancelledAppointmentsQuery = supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled");

    if (startDate) {
      cancelledAppointmentsQuery = cancelledAppointmentsQuery.gte(
        "created_at",
        startDate,
      );
    }
    if (endDate) {
      cancelledAppointmentsQuery = cancelledAppointmentsQuery.lte(
        "created_at",
        endDate,
      );
    }

    const { count: cancelled_appointments } = await cancelledAppointmentsQuery;

    // Get referral counts
    let totalReferralsQuery = supabase
      .from("referrals")
      .select("*", { count: "exact", head: true });

    if (startDate) {
      totalReferralsQuery = totalReferralsQuery.gte("created_at", startDate);
    }
    if (endDate) {
      totalReferralsQuery = totalReferralsQuery.lte("created_at", endDate);
    }

    const { count: total_referrals } = await totalReferralsQuery;

    // Get session counts
    let totalSessionsQuery = supabase
      .from("sessions")
      .select("*", { count: "exact", head: true });

    if (startDate) {
      totalSessionsQuery = totalSessionsQuery.gte("created_at", startDate);
    }
    if (endDate) {
      totalSessionsQuery = totalSessionsQuery.lte("created_at", endDate);
    }

    const { count: total_sessions } = await totalSessionsQuery;

    // Get user counts
    let totalUsersQuery = supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (startDate) {
      totalUsersQuery = totalUsersQuery.gte("created_at", startDate);
    }
    if (endDate) {
      totalUsersQuery = totalUsersQuery.lte("created_at", endDate);
    }

    const { count: total_users } = await totalUsersQuery;

    // Get active students (those with appointments or referrals in period)
    let activeStudentsAppointmentsQuery = supabase
      .from("appointments")
      .select("student_id");

    if (startDate) {
      activeStudentsAppointmentsQuery = activeStudentsAppointmentsQuery.gte(
        "created_at",
        startDate,
      );
    }
    if (endDate) {
      activeStudentsAppointmentsQuery = activeStudentsAppointmentsQuery.lte(
        "created_at",
        endDate,
      );
    }

    const { data: activeStudentsFromAppointments } =
      await activeStudentsAppointmentsQuery;

    let activeStudentsReferralsQuery = supabase
      .from("referrals")
      .select("student_id");

    if (startDate) {
      activeStudentsReferralsQuery = activeStudentsReferralsQuery.gte(
        "created_at",
        startDate,
      );
    }
    if (endDate) {
      activeStudentsReferralsQuery = activeStudentsReferralsQuery.lte(
        "created_at",
        endDate,
      );
    }

    const { data: activeStudentsFromReferrals } =
      await activeStudentsReferralsQuery;

    const studentIds = new Set([
      ...(activeStudentsFromAppointments?.map((a) => a.student_id) || []),
      ...(activeStudentsFromReferrals?.map((r) => r.student_id) || []),
    ]);
    const active_students = studentIds.size;

    // Get active PSG members (those with appointments in period)
    let activePsgQuery = supabase.from("appointments").select("psg_member_id");

    if (startDate) {
      activePsgQuery = activePsgQuery.gte("created_at", startDate);
    }
    if (endDate) {
      activePsgQuery = activePsgQuery.lte("created_at", endDate);
    }

    const { data: activePSG } = await activePsgQuery;

    const active_psg_members = new Set(activePSG?.map((a) => a.psg_member_id))
      .size;

    const period =
      startDate && endDate
        ? `${new Date(startDate).toLocaleDateString()} - ${new Date(
            endDate,
          ).toLocaleDateString()}`
        : startDate
          ? `From ${new Date(startDate).toLocaleDateString()}`
          : endDate
            ? `Until ${new Date(endDate).toLocaleDateString()}`
            : "All time";

    const report: UsageReport = {
      period,
      total_appointments: total_appointments || 0,
      completed_appointments: completed_appointments || 0,
      cancelled_appointments: cancelled_appointments || 0,
      total_referrals: total_referrals || 0,
      total_sessions: total_sessions || 0,
      total_users: total_users || 0,
      active_students,
      active_psg_members,
    };

    return { success: true, data: report };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================
// Audit Logs
// =============================

export async function getAuditLogs(limit: number = 100) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("audit_logs")
      .select(
        `
        *,
        user:profiles(full_name, email, role)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Get audit logs error:", error);
      return { success: false, error: "Failed to fetch audit logs" };
    }

    const logs: AuditLog[] =
      data?.map((log) => {
        const user = Array.isArray(log.user) ? log.user[0] : log.user;
        return {
          id: log.id,
          user_id: log.user_id,
          user_name: user?.full_name || "Unknown",
          user_email: user?.email || "Unknown",
          user_role: user?.role || "student",
          action: log.action,
          table_name: log.table_name,
          record_id: log.record_id,
          details: log.details,
          created_at: log.created_at,
        };
      }) || [];

    return { success: true, data: logs };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
