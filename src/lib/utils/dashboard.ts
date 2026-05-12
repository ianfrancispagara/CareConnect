import type { CSSProperties } from "react";
import { ClipboardList, FileText, TrendingUp, Users } from "lucide-react";
import type { BannerContent, QuickAction, StudentTip } from "@/types/dashboard";

export const ACTION_CARD_CLASS =
  "group rounded-lg p-6 transition-all hover:scale-105 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)]";

export const ACTION_CARD_STYLE: CSSProperties = {
  background: "var(--bg-light)",
  border: "2px solid var(--primary)",
  boxShadow:
    "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)",
};

export const PANEL_STYLE: CSSProperties = {
  background: "var(--bg-light)",
  border: "1px solid var(--border-muted)",
};

export const BANNER_STYLE: CSSProperties = {
  background:
    "linear-gradient(135deg, var(--primary-20) 0%, var(--primary-10) 100%)",
  border: "1px solid var(--primary-30)",
};

export const STUDENT_BANNER: BannerContent = {
  title: "Your Mental Health Matters",
  description:
    "We're here to support you with confidential screenings, peer support, and professional guidance.",
};

export const PSG_BANNER: BannerContent = {
  title: "Welcome, PSG Member",
  description:
    "Your role is to review student screenings and referrals, then forward your triage decision to admin so each case receives the right level of support.",
};

export const STUDENT_ACTIONS: QuickAction[] = [
  {
    href: "/dashboard/screening/take",
    title: "Mental Health Screening",
    description: "Take a confidential mental health assessment",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/screening/results",
    title: "View Results",
    description: "Check your screening results and recommendations",
    icon: TrendingUp,
  },
  {
    href: "/dashboard/referrals/create",
    title: "Self-Referral Form",
    description: "Submit a referral request for support",
    icon: FileText,
  },
];

export const PSG_ACTIONS: QuickAction[] = [
  {
    href: "/dashboard/psg/screenings",
    title: "Review Screenings",
    description: "Review screenings and forward triage decisions to admin",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/psg/referrals",
    title: "View Referrals",
    description: "Review referrals and forward as immediate, moderate, or good",
    icon: Users,
  },
  {
    href: "/dashboard/psg/sessions",
    title: "Session Documentation",
    description: "Document and review session records",
    icon: FileText,
  },
];

export const STUDENT_TIPS: StudentTip[] = [
  {
    emoji: "🧘",
    title: "Practice Mindfulness",
    description: "Take 5 minutes daily for deep breathing or meditation",
  },
  {
    emoji: "🏃",
    title: "Stay Active",
    description: "Regular exercise boosts mood and reduces stress",
  },
  {
    emoji: "💬",
    title: "Talk It Out",
    description: "Share your feelings with trusted friends or counselors",
  },
  {
    emoji: "😴",
    title: "Prioritize Sleep",
    description: "Aim for 7-9 hours of quality sleep each night",
  },
];
