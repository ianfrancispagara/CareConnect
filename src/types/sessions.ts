// Session Management Types

export interface Session {
  id: string;
  appointment_id: string;
  notes: string | null;
  duration_minutes: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionWithAppointment extends Session {
  appointment: {
    id: string;
    appointment_date: string;
    status: string;
    duration_minutes: number;
    location_type: string;
    meeting_link?: string;
    notes?: string;
    student: {
      id: string;
      full_name: string;
      school_id?: string;
      avatar_url?: string;
    };
    psg_member: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
  };
}

export interface CreateSessionInput {
  appointment_id: string;
  notes?: string;
  duration_minutes?: number;
  feedback?: string;
}

export interface UpdateSessionInput {
  notes?: string;
  duration_minutes?: number;
  feedback?: string;
}

export interface SessionFormData {
  notes: string;
  duration_minutes: number;
  feedback: string;
}

export interface SessionSummary {
  total_sessions: number;
  total_duration_minutes: number;
  average_duration_minutes: number;
  sessions_this_month: number;
  sessions_this_week: number;
}
