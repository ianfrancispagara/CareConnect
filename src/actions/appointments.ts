"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentWithProfiles,
  AvailabilityCheckInput,
} from "@/types/appointments";

// =============================
// Appointment CRUD Operations
// =============================

export async function createAppointment(input: CreateAppointmentInput) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify student can only create appointments for themselves
    if (input.student_id !== user.id) {
      return {
        success: false,
        error: "You can only create appointments for yourself",
      };
    }

    // Check PSG availability
    const { data: isAvailable, error: checkError } = await supabase.rpc(
      "is_psg_available",
      {
        p_psg_member_id: input.psg_member_id,
        p_appointment_date: input.appointment_date,
        p_duration_minutes: input.duration_minutes || 60,
      },
    );

    if (checkError) {
      console.error("Availability check error:", checkError);
      return { success: false, error: "Failed to check availability" };
    }

    if (!isAvailable) {
      return { success: false, error: "This time slot is not available" };
    }

    // Create appointment
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        student_id: input.student_id,
        psg_member_id: input.psg_member_id,
        appointment_date: input.appointment_date,
        duration_minutes: input.duration_minutes || 60,
        location_type: input.location_type || "online",
        meeting_link: input.meeting_link,
        notes: input.notes,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      console.error("Create appointment error:", error);
      return { success: false, error: "Failed to create appointment" };
    }

    revalidatePath("/dashboard/appointments");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getStudentAppointments(studentId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        psg_member:profiles!psg_member_id(id, full_name, avatar_url)
      `,
      )
      .eq("student_id", studentId)
      .order("appointment_date", { ascending: true });

    if (error) {
      console.error("Get student appointments error:", error);
      return { success: false, error: "Failed to fetch appointments" };
    }

    return { success: true, data: data as AppointmentWithProfiles[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getPSGAppointments(psgMemberId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        student:profiles!student_id(id, full_name, school_id, avatar_url),
        psg_member:profiles!psg_member_id(id, full_name, avatar_url)
      `,
      )
      .eq("psg_member_id", psgMemberId)
      .order("appointment_date", { ascending: true });

    if (error) {
      console.error("Get PSG appointments error:", error);
      return { success: false, error: "Failed to fetch appointments" };
    }

    return { success: true, data: data as AppointmentWithProfiles[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getAllPSGAppointments() {
  try {
    const supabase = await createClient();

    // Check if user is admin
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
      return { success: false, error: "Only admins can view all appointments" };
    }

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        student:profiles!student_id(id, full_name, school_id, avatar_url),
        psg_member:profiles!psg_member_id(id, full_name, avatar_url)
      `,
      )
      .order("appointment_date", { ascending: false });

    if (error) {
      console.error("Get all PSG appointments error:", error);
      return { success: false, error: "Failed to fetch appointments" };
    }

    return { success: true, data: data as AppointmentWithProfiles[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getCurrentUserAppointmentsView() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.role) {
      return { success: false, error: "Failed to load profile" };
    }

    if (profile.role !== "psg_member" && profile.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    let query = supabase.from("appointments").select(
      `
      *,
      student:profiles!student_id(id, full_name, school_id, avatar_url),
      psg_member:profiles!psg_member_id(id, full_name, avatar_url)
    `,
    );

    if (profile.role !== "admin") {
      query = query.eq("psg_member_id", user.id);
    }

    const { data, error } = await query.order("appointment_date", {
      ascending: true,
    });

    if (error) {
      console.error("Get current user appointments view error:", error);
      return { success: false, error: "Failed to fetch appointments" };
    }

    return {
      success: true,
      data: data as AppointmentWithProfiles[],
      role: profile.role,
    };
  } catch (error) {
    console.error("Unexpected error getting appointments view:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getAppointmentById(appointmentId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        student:profiles!student_id(id, full_name, school_id, avatar_url),
        psg_member:profiles!psg_member_id(id, full_name, avatar_url)
      `,
      )
      .eq("id", appointmentId)
      .single();

    if (error) {
      console.error("Get appointment error:", error);
      return { success: false, error: "Failed to fetch appointment" };
    }

    return { success: true, data: data as AppointmentWithProfiles };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput,
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Build update object with type safety
    const updateData: Partial<UpdateAppointmentInput> & {
      cancelled_by?: string;
      cancelled_at?: string;
    } = { ...input };

    // If cancelling, add cancellation metadata
    if (input.status === "cancelled") {
      updateData.cancelled_by = user.id;
      updateData.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) {
      console.error("Update appointment error:", error);
      return { success: false, error: "Failed to update appointment" };
    }

    revalidatePath("/dashboard/appointments");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function cancelAppointment(appointmentId: string, reason: string) {
  return updateAppointment(appointmentId, {
    status: "cancelled",
    cancellation_reason: reason,
  });
}

export async function confirmAppointment(appointmentId: string) {
  return updateAppointment(appointmentId, {
    status: "confirmed",
  });
}

export async function completeAppointment(
  appointmentId: string,
  notes?: string,
) {
  return updateAppointment(appointmentId, {
    status: "completed",
    notes,
  });
}

export async function markNoShow(appointmentId: string) {
  return updateAppointment(appointmentId, {
    status: "no_show",
  });
}

// =============================
// Availability Checking
// =============================

export async function checkPSGAvailability(input: AvailabilityCheckInput) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("is_psg_available", {
      p_psg_member_id: input.psg_member_id,
      p_appointment_date: input.appointment_date,
      p_duration_minutes: input.duration_minutes,
    });

    if (error) {
      console.error("Check availability error:", error);
      return { success: false, error: "Failed to check availability" };
    }

    return { success: true, isAvailable: data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
