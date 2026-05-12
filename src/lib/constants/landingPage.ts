import { CalendarDays, MessageSquareText, ShieldCheck } from "lucide-react";

export const highlights = [
  {
    icon: ShieldCheck,
    title: "Private by default",
    description:
      "Student referrals, screening results, and session notes stay protected behind role-based access.",
  },
  {
    icon: CalendarDays,
    title: "Fast appointments",
    description:
      "Book sessions with PSG availability that updates in real time for a smoother intake flow.",
  },
  {
    icon: MessageSquareText,
    title: "Secure messaging",
    description:
      "Keep follow-ups and coordination in one place with encrypted, low-latency chat.",
  },
];

export const stats = [
  { value: "3 roles", label: "Students, PSG members, and admins" },
  { value: "<5 sec", label: "Target booking experience" },
  { value: "24/7", label: "Access to resources and support" },
];

export const steps = [
  {
    title: "Create or sign in",
    description:
      "Use your institutional account to access the right experience for your role.",
  },
  {
    title: "Submit or review referrals",
    description:
      "Students start a self-referral while PSG members triage cases and track progress.",
  },
  {
    title: "Book and continue care",
    description:
      "Appointments, messaging, and session documentation stay connected across the process.",
  },
];
