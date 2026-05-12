// Administrative Functions Types

export type UserRole = "student" | "psg_member" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  school_id?: string;
  role: UserRole;
  is_blocked: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  school_id?: string;
  role: UserRole;
}

export interface UpdateUserInput {
  full_name?: string;
  school_id?: string;
  role?: UserRole;
  avatar_url?: string;
}

export interface SystemStats {
  total_users: number;
  total_students: number;
  total_psg_members: number;
  total_admins: number;
  total_appointments: number;
  total_referrals: number;
  total_sessions: number;
  appointments_this_month: number;
  referrals_this_month: number;
  sessions_this_month: number;
}

export interface AppointmentReport {
  id: string;
  student_name: string;
  student_id: string;
  psg_member_name: string;
  appointment_date: string;
  status: string;
  duration_minutes: number;
  location_type: string;
  created_at: string;
}

export interface ReferralReport {
  id: string;
  student_name: string;
  student_id: string;
  source: string;
  status: string;
  severity: string;
  assigned_psg_member?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionReport {
  id: string;
  student_name: string;
  student_id: string;
  psg_member_name: string;
  appointment_date: string;
  duration_minutes: number;
  has_notes: boolean;
  has_feedback: boolean;
  created_at: string;
}

export interface UsageReport {
  period: string;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  total_referrals: number;
  total_sessions: number;
  total_users: number;
  active_students: number;
  active_psg_members: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: UserRole;
  action: string;
  table_name: string;
  record_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  role?: UserRole;
  psg_member_id?: string;
  student_id?: string;
}
