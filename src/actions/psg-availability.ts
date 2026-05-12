"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  CreatePSGAvailabilityInput,
  PSGAvailability,
  PSGAvailabilityWithProfile,
  AvailableTimeSlot,
} from "@/types/appointments";

// =============================
// PSG Availability CRUD
// =============================

export async function createPSGAvailability(input: CreatePSGAvailabilityInput) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify PSG member can only create their own availability
    if (input.psg_member_id !== user.id) {
      return {
        success: false,
        error: "You can only manage your own availability",
      };
    }

    const { data, error } = await supabase
      .from("psg_availability")
      .insert({
        psg_member_id: input.psg_member_id,
        day_of_week: input.day_of_week,
        start_time: input.start_time,
        end_time: input.end_time,
        is_active: input.is_active !== undefined ? input.is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error("Create availability error:", error);
      return { success: false, error: "Failed to create availability" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getPSGAvailability(psgMemberId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("psg_availability")
      .select("*")
      .eq("psg_member_id", psgMemberId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Get availability error:", error);
      return { success: false, error: "Failed to fetch availability" };
    }

    return { success: true, data: data as PSGAvailability[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getAllActivePSGAvailability() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("psg_availability")
      .select(
        `
        *,
        psg_member:profiles!psg_member_id(id, full_name, avatar_url)
      `,
      )
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Get all availability error:", error);
      return { success: false, error: "Failed to fetch availability" };
    }

    return { success: true, data: data as PSGAvailabilityWithProfile[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updatePSGAvailability(
  availabilityId: string,
  updates: Partial<CreatePSGAvailabilityInput>,
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("psg_availability")
      .update(updates)
      .eq("id", availabilityId)
      .select()
      .single();

    if (error) {
      console.error("Update availability error:", error);
      return { success: false, error: "Failed to update availability" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deletePSGAvailability(availabilityId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("psg_availability")
      .delete()
      .eq("id", availabilityId);

    if (error) {
      console.error("Delete availability error:", error);
      return { success: false, error: "Failed to delete availability" };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function togglePSGAvailability(
  availabilityId: string,
  isActive: boolean,
) {
  return updatePSGAvailability(availabilityId, { is_active: isActive });
}

// =============================
// Available Time Slots Generation
// =============================

export async function getAvailableTimeSlots(
  startDate: string,
  endDate: string,
  durationMinutes: number = 60,
): Promise<{ success: boolean; data?: AvailableTimeSlot[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Get all active PSG availability records
    const { data: rawAvailabilities, error: availError } = await supabase
      .from("psg_availability")
      .select("*")
      .eq("is_active", true);

    if (availError) {
      console.error("Database error fetching availabilities:", availError);
      return { success: false, error: "Failed to fetch availabilities" };
    }

    if (!rawAvailabilities || rawAvailabilities.length === 0) {
      return { success: true, data: [] };
    }

    // Get unique PSG member IDs
    const psgMemberIds = [
      ...new Set(rawAvailabilities.map((a) => a.psg_member_id)),
    ];

    // Fetch profiles for all PSG members
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", psgMemberIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      return { success: false, error: "Failed to fetch PSG member profiles" };
    }

    if (!profiles || profiles.length === 0) {
      return { success: true, data: [] };
    }

    // Create a map of profiles for quick lookup
    const profileMap = new Map(
      profiles?.map((p) => [
        p.id,
        p as { id: string; full_name: string; avatar_url?: string },
      ]) || [],
    );

    // Map availabilities with profiles
    const availabilities: PSGAvailabilityWithProfile[] = [];

    for (const item of rawAvailabilities) {
      const profile = profileMap.get(item.psg_member_id);
      if (profile) {
        availabilities.push({
          ...(item as PSGAvailability),
          psg_member: profile,
        });
      }
    }

    if (availabilities.length === 0) {
      return { success: true, data: [] };
    }

    // Generate time slots
    const slots: AvailableTimeSlot[] = [];
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");

    // Iterate through each day in the range
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();

      // Find availabilities for this day of week
      const dayAvailabilities =
        availabilities?.filter((av) => av.day_of_week === dayOfWeek) || [];

      for (const availability of dayAvailabilities) {
        // Parse time strings (format: "HH:MM:SS")
        const [startHour, startMinute, startSecond] = availability.start_time
          .split(":")
          .map(Number);
        const [endHour, endMinute, endSecond] = availability.end_time
          .split(":")
          .map(Number);

        // Create date objects in local timezone for the current date
        const slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, startSecond || 0, 0);

        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endHour, endMinute, endSecond || 0, 0);

        const now = new Date();

        // Skip if slot is in the past
        if (slotEnd <= now) {
          continue;
        }

        // Generate slots every hour (or specified duration)
        let currentSlot = new Date(slotStart);

        // If start time is in the past, start from next available hour
        if (currentSlot < now) {
          const minutesFromNow = Math.ceil(
            (now.getTime() - currentSlot.getTime()) / (1000 * 60),
          );
          const slotsToSkip = Math.ceil(minutesFromNow / durationMinutes);
          currentSlot.setMinutes(
            currentSlot.getMinutes() + slotsToSkip * durationMinutes,
          );
        }

        while (currentSlot < slotEnd) {
          const nextSlot = new Date(currentSlot);
          nextSlot.setMinutes(currentSlot.getMinutes() + durationMinutes);

          if (nextSlot <= slotEnd) {
            // Format the date and time with explicit timezone for Asia/Manila (UTC+8)
            const year = currentSlot.getFullYear();
            const month = String(currentSlot.getMonth() + 1).padStart(2, "0");
            const day = String(currentSlot.getDate()).padStart(2, "0");
            const hours = String(currentSlot.getHours()).padStart(2, "0");
            const minutes = String(currentSlot.getMinutes()).padStart(2, "0");
            const seconds = String(currentSlot.getSeconds()).padStart(2, "0");

            // Create timestamp with Asia/Manila timezone
            const appointmentTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}+08:00`;

            // Check if this slot is available (no conflicts)
            const { data: isAvailable, error: rpcError } = await supabase.rpc(
              "is_psg_available",
              {
                p_psg_member_id: availability.psg_member_id,
                p_appointment_date: appointmentTimestamp,
                p_duration_minutes: durationMinutes,
              },
            );

            if (rpcError) {
              console.error("RPC error:", rpcError);
            }

            if (isAvailable) {
              const psgMember = availability.psg_member;

              // Check if psg_member data exists
              if (!psgMember) {
                continue;
              }

              // Store the full timestamp for accurate booking with timezone
              const appointmentTimestampForBooking = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}+08:00`;

              slots.push({
                psg_member_id: availability.psg_member_id,
                psg_member_name: psgMember.full_name,
                psg_member_avatar: psgMember.avatar_url,
                date: currentSlot.toISOString().split("T")[0],
                start_time: currentSlot
                  .toTimeString()
                  .split(" ")[0]
                  .substring(0, 5),
                end_time: nextSlot.toTimeString().split(" ")[0].substring(0, 5),
                duration_minutes: durationMinutes,
                appointment_timestamp: appointmentTimestampForBooking,
              });
            }
          }

          currentSlot = nextSlot;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { success: true, data: slots };
  } catch (error) {
    console.error("Error in getAvailableTimeSlots:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function getAvailablePSGMembers(
  date: string,
  time: string,
  durationMinutes: number = 60,
) {
  try {
    const supabase = await createClient();

    // Construct appointment date
    const appointmentDate = new Date(`${date}T${time}`);
    const dayOfWeek = appointmentDate.getDay();

    // Get PSG members who have availability for this day and time
    const { data: availabilities, error } = await supabase
      .from("psg_availability")
      .select(
        `
        *,
        psg_member:profiles!psg_member_id(id, full_name, avatar_url)
      `,
      )
      .eq("is_active", true)
      .eq("day_of_week", dayOfWeek)
      .lte("start_time", time)
      .gte("end_time", time);

    if (error) {
      console.error("Get available PSG members error:", error);
      return { success: false, error: "Failed to fetch available PSG members" };
    }

    // Filter out PSG members with conflicts
    const availableMembers = [];
    for (const availability of availabilities || []) {
      const { data: isAvailable } = await supabase.rpc("is_psg_available", {
        p_psg_member_id: availability.psg_member_id,
        p_appointment_date: appointmentDate.toISOString(),
        p_duration_minutes: durationMinutes,
      });

      if (isAvailable) {
        const psgMember = (availability as PSGAvailabilityWithProfile)
          .psg_member;
        availableMembers.push(psgMember);
      }
    }

    return { success: true, data: availableMembers };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
