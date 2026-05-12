"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CreateSessionInput,
  UpdateSessionInput,
  Session,
  SessionWithAppointment,
  SessionSummary,
} from "@/types/sessions";

// =============================
// Session CRUD Operations
// =============================

export async function createSession(input: CreateSessionInput) {
  try {
    const supabase = await createClient();

    // Verify the appointment exists and user has access
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, psg_member_id, status")
      .eq("id", input.appointment_id)
      .single();

    if (appointmentError || !appointment) {
      return {
        success: false,
        error: "Appointment not found or access denied",
      };
    }

    // Check if session already exists for this appointment
    const { data: existingSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("appointment_id", input.appointment_id)
      .single();

    if (existingSession) {
      return {
        success: false,
        error: "Session already exists for this appointment",
      };
    }

    // Create the session
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        appointment_id: input.appointment_id,
        notes: input.notes || null,
        duration_minutes: input.duration_minutes || null,
        feedback: input.feedback || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Create session error:", error);
      return { success: false, error: "Failed to create session" };
    }

    revalidatePath("/dashboard/psg/sessions");

    return { success: true, data: data as Session };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateSession(
  sessionId: string,
  input: UpdateSessionInput,
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sessions")
      .update({
        notes: input.notes,
        duration_minutes: input.duration_minutes,
        feedback: input.feedback,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("Update session error:", error);
      return { success: false, error: "Failed to update session" };
    }

    revalidatePath("/dashboard/psg/sessions");

    return { success: true, data: data as Session };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getSessionById(sessionId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        *,
        appointment:appointments(
          id,
          appointment_date,
          status,
          duration_minutes,
          location_type,
          meeting_link,
          notes,
          student:student_id(
            id,
            full_name,
            school_id,
            avatar_url
          ),
          psg_member:psg_member_id(
            id,
            full_name,
            avatar_url
          )
        )
      `,
      )
      .eq("id", sessionId)
      .single();

    if (error) {
      console.error("Get session error:", error);
      return { success: false, error: "Session not found" };
    }

    return { success: true, data: data as unknown as SessionWithAppointment };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getSessionByAppointmentId(appointmentId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        *,
        appointment:appointments(
          id,
          appointment_date,
          status,
          duration_minutes,
          location_type,
          meeting_link,
          notes,
          student:student_id(
            id,
            full_name,
            school_id,
            avatar_url
          ),
          psg_member:psg_member_id(
            id,
            full_name,
            avatar_url
          )
        )
      `,
      )
      .eq("appointment_id", appointmentId)
      .single();

    if (error) {
      // Not an error if no session exists yet
      if (error.code === "PGRST116") {
        return { success: true, data: null };
      }
      console.error("Get session error:", error);
      return { success: false, error: "Failed to fetch session" };
    }

    return { success: true, data: data as unknown as SessionWithAppointment };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get all sessions (for admin)
export async function getAllSessions() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        *,
        appointment:appointments!inner(
          id,
          appointment_date,
          status,
          duration_minutes,
          location_type,
          meeting_link,
          notes,
          psg_member_id,
          student:student_id(
            id,
            full_name,
            school_id,
            avatar_url
          ),
          psg_member:psg_member_id(
            id,
            full_name,
            avatar_url
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get all sessions error:", error);
      return { success: false, error: "Failed to fetch sessions" };
    }

    return {
      success: true,
      data: data as unknown as SessionWithAppointment[],
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getPSGMemberSessions(psgMemberId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        *,
        appointment:appointments!inner(
          id,
          appointment_date,
          status,
          duration_minutes,
          location_type,
          meeting_link,
          notes,
          psg_member_id,
          student:student_id(
            id,
            full_name,
            school_id,
            avatar_url
          ),
          psg_member:psg_member_id(
            id,
            full_name,
            avatar_url
          )
        )
      `,
      )
      .eq("appointment.psg_member_id", psgMemberId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get PSG sessions error:", error);
      return { success: false, error: "Failed to fetch sessions" };
    }

    return {
      success: true,
      data: data as unknown as SessionWithAppointment[],
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getStudentSessions(studentId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        *,
        appointment:appointments!inner(
          id,
          appointment_date,
          status,
          duration_minutes,
          location_type,
          notes,
          student_id,
          student:student_id(
            id,
            full_name,
            school_id,
            avatar_url
          ),
          psg_member:psg_member_id(
            id,
            full_name,
            avatar_url
          )
        )
      `,
      )
      .eq("appointment.student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get student sessions error:", error);
      return { success: false, error: "Failed to fetch sessions" };
    }

    return {
      success: true,
      data: data as unknown as SessionWithAppointment[],
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteSession(sessionId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error("Delete session error:", error);
      return { success: false, error: "Failed to delete session" };
    }

    revalidatePath("/dashboard/psg/sessions");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================
// Session Analytics
// =============================

// Get summary of all sessions (for admin)
export async function getAllSessionsSummary() {
  try {
    const supabase = await createClient();

    // Get all sessions
    const { data: sessions, error } = await supabase.from("sessions").select(
      `
        duration_minutes,
        created_at
      `,
    );

    if (error) {
      console.error("Get all sessions summary error:", error);
      return { success: false, error: "Failed to fetch session summary" };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce(
      (sum, s) => sum + (s.duration_minutes || 0),
      0,
    );
    const sessionsThisMonth = sessions.filter(
      (s) => new Date(s.created_at) >= startOfMonth,
    ).length;
    const sessionsThisWeek = sessions.filter(
      (s) => new Date(s.created_at) >= startOfWeek,
    ).length;

    const summary: SessionSummary = {
      total_sessions: totalSessions,
      total_duration_minutes: totalDuration,
      average_duration_minutes:
        totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
      sessions_this_month: sessionsThisMonth,
      sessions_this_week: sessionsThisWeek,
    };

    return { success: true, data: summary };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getPSGSessionSummary(psgMemberId: string) {
  try {
    const supabase = await createClient();

    // Get all sessions for this PSG member
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(
        `
        duration_minutes,
        created_at,
        appointment:appointments!inner(
          psg_member_id
        )
      `,
      )
      .eq("appointment.psg_member_id", psgMemberId);

    if (error) {
      console.error("Get session summary error:", error);
      return { success: false, error: "Failed to fetch session summary" };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce(
      (sum, s) => sum + (s.duration_minutes || 0),
      0,
    );
    const sessionsThisMonth = sessions.filter(
      (s) => new Date(s.created_at) >= startOfMonth,
    ).length;
    const sessionsThisWeek = sessions.filter(
      (s) => new Date(s.created_at) >= startOfWeek,
    ).length;

    const summary: SessionSummary = {
      total_sessions: totalSessions,
      total_duration_minutes: totalDuration,
      average_duration_minutes:
        totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
      sessions_this_month: sessionsThisMonth,
      sessions_this_week: sessionsThisWeek,
    };

    return { success: true, data: summary };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
