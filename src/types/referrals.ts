export type ReferralSource = "self" | "peer" | "faculty" | "screening";
export type ReferralStatus =
  | "pending"
  | "reviewed"
  | "assigned"
  | "in_progress"
  | "completed"
  | "escalated";
export type ReferralSeverity = "low" | "moderate" | "high" | "critical";
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type PsgTriageLevel = "needs_immediate_help" | "moderate" | "good";

export interface Referral {
  id: string;
  student_id: string;
  source: ReferralSource;
  status: ReferralStatus;
  severity: ReferralSeverity | null;
  assigned_psg_member_id: string | null;
  notes: string | null;
  reason: string | null;
  screening_result_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  escalated_to: string | null;
  escalation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralWithProfiles extends Referral {
  student: {
    id: string;
    full_name: string;
    email: string;
    school_id: string | null;
  };
  assigned_psg_member: {
    id: string;
    full_name: string;
    codename?: string | null;
    email: string;
  } | null;
  reviewed_by_profile: {
    id: string;
    full_name: string;
    codename?: string | null;
  } | null;
}

// Case assessment for referrals
export interface ReferralAssessment {
  id: string;
  referral_id: string;
  assessed_by: string; // PSG member ID
  risk_level: ReferralSeverity;
  assessment_notes: string;
  intervention_plan?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralUpdate {
  id: string;
  referral_id: string;
  updated_by: string;
  update_type:
    | "status_change"
    | "note"
    | "assessment"
    | "escalation"
    | "completion";
  previous_status: string | null;
  new_status: string | null;
  content: string;
  created_at: string;
}

export interface ReferralUpdateWithProfile extends ReferralUpdate {
  updated_by_profile: {
    id: string;
    full_name: string;
    role: string;
  };
}

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  self: "Self-Referral",
  peer: "Peer Referral",
  faculty: "Faculty Referral",
  screening: "Screening Result",
};

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: "Pending Review",
  reviewed: "Reviewed",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  escalated: "Escalated to OCCS",
};

export const SEVERITY_LABELS: Record<ReferralSeverity, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

export const SEVERITY_COLORS: Record<ReferralSeverity, string> = {
  low: "var(--success)",
  moderate: "var(--warning)",
  high: "var(--error)",
  critical: "var(--danger)",
};

export const PSG_TRIAGE_LABELS: Record<PsgTriageLevel, string> = {
  needs_immediate_help: "Needs Immediate Help",
  moderate: "Moderate",
  good: "Good",
};
