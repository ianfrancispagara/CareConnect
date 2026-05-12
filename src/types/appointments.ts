// Database types for Appointment Scheduling System

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type LocationType = "online" | "in_person";

export interface PSGAvailability {
  id: string;
  psg_member_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // Format: "HH:MM:SS"
  end_time: string; // Format: "HH:MM:SS"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  student_id: string;
  psg_member_id: string;
  appointment_date: string; // ISO 8601 timestamp
  status: AppointmentStatus;
  duration_minutes: number;
  location_type: LocationType;
  meeting_link?: string;
  notes?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with profile information
export interface AppointmentWithProfiles extends Appointment {
  student: {
    id: string;
    full_name: string;
    school_id: string;
    avatar_url?: string;
  };
  psg_member?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface PSGAvailabilityWithProfile extends PSGAvailability {
  psg_member: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

// For creating new appointments
export interface CreateAppointmentInput {
  student_id: string;
  psg_member_id: string;
  appointment_date: string;
  duration_minutes?: number;
  location_type?: LocationType;
  meeting_link?: string;
  notes?: string;
}

// For creating PSG availability
export interface CreatePSGAvailabilityInput {
  psg_member_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

// For updating appointments
export interface UpdateAppointmentInput {
  status?: AppointmentStatus;
  appointment_date?: string;
  duration_minutes?: number;
  location_type?: LocationType;
  meeting_link?: string;
  notes?: string;
  cancellation_reason?: string;
}

// For availability checking
export interface AvailabilityCheckInput {
  psg_member_id: string;
  appointment_date: string;
  duration_minutes: number;
}

// Available time slots for booking
export interface AvailableTimeSlot {
  psg_member_id: string;
  psg_member_name: string;
  psg_member_avatar?: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  appointment_timestamp: string; // Full timestamp in format "YYYY-MM-DD HH:MM:SS" for accurate booking
}

// Day name helper
export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

// Status display helpers
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-500",
  confirmed: "bg-green-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
  no_show: "bg-orange-500",
};
