import { type Database } from "@/lib/supabase/types";

// Type aliases for convenience
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type ReferralStatus = Database["public"]["Enums"]["referral_status"];
export type AppointmentStatus =
  Database["public"]["Enums"]["appointment_status"];
export type SeverityColor = Database["public"]["Enums"]["severity_color"];

// Role checking helpers
export function isStudent(role: UserRole): boolean {
  return role === "student";
}

export function isPSGMember(role: UserRole): boolean {
  return role === "psg_member";
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

// Format role display name
export function formatRole(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    student: "Student",
    psg_member: "PSG Member",
    admin: "Administrator",
  };
  return roleMap[role];
}

// Check if user has required role
export function hasRole(
  userRole: UserRole,
  requiredRoles: UserRole[]
): boolean {
  return requiredRoles.includes(userRole);
}
