export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "psg_member" | "admin";
export type ReferralStatus =
  | "pending"
  | "reviewed"
  | "assigned"
  | "in_progress"
  | "completed"
  | "escalated";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";
export type SeverityColor = "green" | "yellow" | "red";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          is_blocked: boolean;
          full_name: string;
          codename: string | null;
          school_id: string | null;
          avatar_url: string | null;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          is_blocked?: boolean;
          full_name: string;
          codename?: string | null;
          school_id?: string | null;
          avatar_url?: string | null;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          is_blocked?: boolean;
          full_name?: string;
          codename?: string | null;
          school_id?: string | null;
          avatar_url?: string | null;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          student_id: string;
          source: string;
          status: ReferralStatus;
          severity: SeverityColor;
          assigned_psg_member_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          source: string;
          status?: ReferralStatus;
          severity: SeverityColor;
          assigned_psg_member_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          source?: string;
          status?: ReferralStatus;
          severity?: SeverityColor;
          assigned_psg_member_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          student_id: string;
          psg_member_id: string;
          appointment_date: string;
          status: AppointmentStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          psg_member_id: string;
          appointment_date: string;
          status?: AppointmentStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          psg_member_id?: string;
          appointment_date?: string;
          status?: AppointmentStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      screening_results: {
        Row: {
          id: string;
          user_id: string;
          responses: Json;
          severity_score: number;
          color_code: SeverityColor;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          responses: Json;
          severity_score: number;
          color_code: SeverityColor;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          responses?: Json;
          severity_score?: number;
          color_code?: SeverityColor;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id?: string | null;
          content: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string | null;
          content?: string;
          read_at?: string | null;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          appointment_id: string;
          notes: string | null;
          duration_minutes: number | null;
          feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          notes?: string | null;
          duration_minutes?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          notes?: string | null;
          duration_minutes?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          table_name?: string;
          record_id?: string;
          details?: Json | null;
          created_at?: string;
        };
      };
      psg_invites: {
        Row: {
          id: string;
          token_hash: string;
          created_by: string | null;
          used_by_email: string | null;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token_hash: string;
          created_by?: string | null;
          used_by_email?: string | null;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token_hash?: string;
          created_by?: string | null;
          used_by_email?: string | null;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_psg_invite: {
        Args: {
          p_token_hash: string;
          p_used_email: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      referral_status: ReferralStatus;
      appointment_status: AppointmentStatus;
      severity_color: SeverityColor;
    };
  };
}
