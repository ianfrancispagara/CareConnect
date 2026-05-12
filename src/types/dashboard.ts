import type { LucideIcon } from "lucide-react";

export type DashboardRole = "student" | "psg_member";

export interface QuickAction {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface BannerContent {
  title: string;
  description: string;
}

export interface StudentTip {
  emoji: string;
  title: string;
  description: string;
}
