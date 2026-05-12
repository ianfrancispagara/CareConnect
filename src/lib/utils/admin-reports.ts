import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Activity, Calendar, FileText, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  AppointmentReport,
  ReferralReport,
  ReportFilters,
  SessionReport,
  UsageReport,
} from "@/types/admin";

export type ReportTab = "appointments" | "referrals" | "sessions" | "usage";

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type ReportCollections = {
  appointmentReports: AppointmentReport[];
  referralReports: ReferralReport[];
  sessionReports: SessionReport[];
  usageReport: UsageReport | null;
};

export type ReportTabItem = {
  id: ReportTab;
  label: string;
  icon: LucideIcon;
};

export const INITIAL_DATE_RANGE: DateRange = {
  startDate: "",
  endDate: "",
};

export const INITIAL_HAS_LOADED_DEFAULTS: Record<ReportTab, boolean> = {
  appointments: false,
  referrals: false,
  sessions: false,
  usage: false,
};

export const REPORT_TABS: ReportTabItem[] = [
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "referrals", label: "Referrals", icon: FileText },
  { id: "sessions", label: "Sessions", icon: Users },
  { id: "usage", label: "Usage", icon: Activity },
];

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
] as const;

export const REFERRAL_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "escalated", label: "Escalated" },
] as const;

type BadgeStyle = {
  background: string;
  color: string;
};

export function shouldShowStatusFilter(activeTab: ReportTab): boolean {
  return activeTab === "appointments" || activeTab === "referrals";
}

export function buildReportFilters(
  activeTab: ReportTab,
  dateRange: DateRange,
  statusFilter: string,
): ReportFilters {
  return {
    ...(dateRange.startDate ? { start_date: dateRange.startDate } : {}),
    ...(dateRange.endDate ? { end_date: dateRange.endDate } : {}),
    ...(statusFilter !== "all" && shouldShowStatusFilter(activeTab)
      ? { status: statusFilter }
      : {}),
  };
}

export function getRangeSuffix(dateRange: DateRange): string {
  return dateRange.startDate && dateRange.endDate
    ? `${dateRange.startDate}_to_${dateRange.endDate}`
    : "all_time";
}

export function getPeriodLabel(dateRange: DateRange): string {
  return dateRange.startDate && dateRange.endDate
    ? `${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(
        dateRange.endDate,
      ).toLocaleDateString()}`
    : "All time";
}

export function normalizeReportValue(value: string | null | undefined): string {
  return (value || "unknown").replace(/_/g, " ");
}

export function hasReportData(
  activeTab: ReportTab,
  reports: ReportCollections,
): boolean {
  return (
    (activeTab === "appointments" && reports.appointmentReports.length > 0) ||
    (activeTab === "referrals" && reports.referralReports.length > 0) ||
    (activeTab === "sessions" && reports.sessionReports.length > 0) ||
    (activeTab === "usage" && reports.usageReport !== null)
  );
}

export function getAppointmentSummary(appointmentReports: AppointmentReport[]) {
  return {
    total: appointmentReports.length,
    completed: appointmentReports.filter((a) => a.status === "completed")
      .length,
    scheduled: appointmentReports.filter((a) => a.status === "scheduled")
      .length,
    cancelled: appointmentReports.filter((a) => a.status === "cancelled")
      .length,
  };
}

export function getReferralSummary(referralReports: ReferralReport[]) {
  return {
    total: referralReports.length,
    completed: referralReports.filter((r) => r.status === "completed").length,
    inProgress: referralReports.filter((r) => r.status === "in_progress")
      .length,
    escalated: referralReports.filter((r) => r.status === "escalated").length,
  };
}

export function getSessionSummary(sessionReports: SessionReport[]) {
  const totalDuration = sessionReports.reduce(
    (sum, report) => sum + (report.duration_minutes || 0),
    0,
  );

  return {
    total: sessionReports.length,
    totalDuration,
    averageDuration:
      sessionReports.length > 0
        ? Math.round(totalDuration / sessionReports.length)
        : 0,
  };
}

export function getUsageInteractions(usageReport: UsageReport): number {
  return usageReport.total_appointments + usageReport.total_referrals;
}

export function getAppointmentStatusStyle(status: string): BadgeStyle {
  if (status === "completed") {
    return {
      background: "var(--success-20)",
      color: "var(--success)",
    };
  }

  if (status === "scheduled") {
    return {
      background: "var(--primary-20)",
      color: "var(--primary)",
    };
  }

  return {
    background: "var(--error-20)",
    color: "var(--error)",
  };
}

export function getReferralSeverityStyle(severity: string): BadgeStyle {
  const normalized = severity.toLowerCase();

  if (normalized === "high" || normalized === "critical") {
    return {
      background: "var(--error-20)",
      color: "var(--error)",
    };
  }

  if (normalized === "moderate" || normalized === "medium") {
    return {
      background: "var(--warning-20)",
      color: "var(--warning)",
    };
  }

  return {
    background: "var(--success-20)",
    color: "var(--success)",
  };
}

export function getReferralStatusStyle(status: string): BadgeStyle {
  const normalized = status.toLowerCase();

  if (normalized === "completed") {
    return {
      background: "var(--success-20)",
      color: "var(--success)",
    };
  }

  if (normalized === "in progress" || normalized === "in_progress") {
    return {
      background: "var(--primary-20)",
      color: "var(--primary)",
    };
  }

  if (normalized === "pending") {
    return {
      background: "var(--warning-20)",
      color: "var(--warning)",
    };
  }

  if (normalized === "reviewed") {
    return {
      background: "var(--info-20)",
      color: "var(--info)",
    };
  }

  if (normalized === "assigned") {
    return {
      background: "var(--primary-20)",
      color: "var(--primary)",
    };
  }

  if (normalized === "escalated") {
    return {
      background: "var(--error-20)",
      color: "var(--error)",
    };
  }

  return {
    background: "var(--text-muted)",
    color: "var(--text)",
  };
}

function getReportExportData(
  activeTab: ReportTab,
  reports: ReportCollections,
  dateRange: DateRange,
): { data: unknown[]; filename: string } {
  const rangeSuffix = getRangeSuffix(dateRange);

  if (activeTab === "appointments") {
    return {
      data: reports.appointmentReports,
      filename: `appointments_report_${rangeSuffix}.json`,
    };
  }

  if (activeTab === "referrals") {
    return {
      data: reports.referralReports,
      filename: `referrals_report_${rangeSuffix}.json`,
    };
  }

  if (activeTab === "sessions") {
    return {
      data: reports.sessionReports,
      filename: `sessions_report_${rangeSuffix}.json`,
    };
  }

  return {
    data: reports.usageReport ? [reports.usageReport] : [],
    filename: `usage_report_${rangeSuffix}.json`,
  };
}

export function exportReportAsJson(
  activeTab: ReportTab,
  reports: ReportCollections,
  dateRange: DateRange,
): void {
  const { data, filename } = getReportExportData(activeTab, reports, dateRange);

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadReportPdf(
  activeTab: ReportTab,
  reports: ReportCollections,
  dateRange: DateRange,
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setTextColor(40, 150, 80);
  doc.text("CareConnect", 14, 15);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Mental Health Referral System", 14, 22);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  const reportTitle = `${
    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
  } Report`;
  doc.text(reportTitle, 14, 35);

  const periodLabel = getPeriodLabel(dateRange);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Period: ${periodLabel}`, 14, 42);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 48);

  let startY = 55;

  if (activeTab === "appointments" && reports.appointmentReports.length > 0) {
    const summary = getAppointmentSummary(reports.appointmentReports);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Summary", 14, startY);
    startY += 7;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total: ${summary.total}`, 14, startY);
    doc.text(`Completed: ${summary.completed}`, 60, startY);
    doc.text(`Scheduled: ${summary.scheduled}`, 110, startY);
    doc.text(`Cancelled: ${summary.cancelled}`, 160, startY);
    startY += 10;

    autoTable(doc, {
      startY,
      head: [["Date", "Student", "PSG Member", "Status"]],
      body: reports.appointmentReports.map((appointment) => [
        new Date(appointment.appointment_date).toLocaleString(),
        appointment.student_name,
        appointment.psg_member_name,
        appointment.status.toUpperCase(),
      ]),
      theme: "grid",
      headStyles: { fillColor: [40, 150, 80] },
      styles: { fontSize: 9 },
    });
  } else if (activeTab === "referrals" && reports.referralReports.length > 0) {
    const summary = getReferralSummary(reports.referralReports);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Summary", 14, startY);
    startY += 7;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total: ${summary.total}`, 14, startY);
    doc.text(`Completed: ${summary.completed}`, 60, startY);
    doc.text(`In Progress: ${summary.inProgress}`, 110, startY);
    doc.text(`Escalated: ${summary.escalated}`, 160, startY);
    startY += 10;

    autoTable(doc, {
      startY,
      head: [["Date", "Student", "Source", "Severity", "Status"]],
      body: reports.referralReports.map((referral) => {
        const source = normalizeReportValue(referral.source);
        const severity = normalizeReportValue(referral.severity);
        const status = normalizeReportValue(referral.status);

        return [
          new Date(referral.created_at).toLocaleDateString(),
          referral.student_name,
          source.toUpperCase(),
          severity.toUpperCase(),
          status.toUpperCase(),
        ];
      }),
      theme: "grid",
      headStyles: { fillColor: [40, 150, 80] },
      styles: { fontSize: 9 },
    });
  } else if (activeTab === "sessions" && reports.sessionReports.length > 0) {
    const summary = getSessionSummary(reports.sessionReports);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Summary", 14, startY);
    startY += 7;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total Sessions: ${summary.total}`, 14, startY);
    doc.text(`Total Duration: ${summary.totalDuration} min`, 80, startY);
    doc.text(`Avg Duration: ${summary.averageDuration} min`, 150, startY);
    startY += 10;

    autoTable(doc, {
      startY,
      head: [["Date", "Student", "PSG Member", "Duration (min)"]],
      body: reports.sessionReports.map((session) => [
        new Date(session.created_at).toLocaleDateString(),
        session.student_name,
        session.psg_member_name,
        (session.duration_minutes || "N/A").toString(),
      ]),
      theme: "grid",
      headStyles: { fillColor: [40, 150, 80] },
      styles: { fontSize: 9 },
    });
  } else if (activeTab === "usage" && reports.usageReport) {
    const usageStats = [
      ["Active Students", reports.usageReport.active_students.toString()],
      ["Active PSG Members", reports.usageReport.active_psg_members.toString()],
      ["Total Appointments", reports.usageReport.total_appointments.toString()],
      [
        "Completed Appointments",
        reports.usageReport.completed_appointments.toString(),
      ],
      [
        "Cancelled Appointments",
        reports.usageReport.cancelled_appointments.toString(),
      ],
      ["Total Referrals", reports.usageReport.total_referrals.toString()],
      ["Total Sessions", reports.usageReport.total_sessions.toString()],
      ["Total Users (New)", reports.usageReport.total_users.toString()],
    ];

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Usage Statistics", 14, startY);
    startY += 10;

    autoTable(doc, {
      startY,
      head: [["Metric", "Value"]],
      body: usageStats,
      theme: "grid",
      headStyles: { fillColor: [40, 150, 80] },
      styles: { fontSize: 10 },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    doc.setPage(pageIndex);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${pageIndex} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
    doc.text(
      "CareConnect - Confidential Report",
      14,
      doc.internal.pageSize.getHeight() - 10,
    );
  }

  const filename = `${activeTab}_report_${getRangeSuffix(dateRange)}.pdf`;
  doc.save(filename);
}
