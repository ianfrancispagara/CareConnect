"use client";

import { Download } from "lucide-react";
import type {
  AppointmentReport,
  ReferralReport,
  SessionReport,
  UsageReport,
} from "@/types/admin";
import type { DateRange, ReportTab } from "@/lib/utils/admin-reports";
import { AppointmentsReportSection } from "./AppointmentsReportSection";
import { ReferralsReportSection } from "./ReferralsReportSection";
import { SessionsReportSection } from "./SessionsReportSection";
import { UsageReportSection } from "./UsageReportSection";

type ReportResultsProps = {
  activeTab: ReportTab;
  dateRange: DateRange;
  appointmentReports: AppointmentReport[];
  paginatedAppointmentReports: AppointmentReport[];
  referralReports: ReferralReport[];
  paginatedReferralReports: ReferralReport[];
  sessionReports: SessionReport[];
  paginatedSessionReports: SessionReport[];
  usageReport: UsageReport | null;
  onDownloadPDF: () => void;
  onExportJSON: () => void;
};

export function ReportResults({
  activeTab,
  dateRange,
  appointmentReports,
  paginatedAppointmentReports,
  referralReports,
  paginatedReferralReports,
  sessionReports,
  paginatedSessionReports,
  usageReport,
  onDownloadPDF,
  onExportJSON,
}: ReportResultsProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      <div
        className="flex items-center justify-between p-4"
        style={{
          borderBottom: "1px solid var(--border-muted)",
        }}
      >
        <h3 className="font-semibold" style={{ color: "var(--text)" }}>
          Report Results
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all"
            style={{
              background: "var(--primary-20)",
              color: "var(--primary)",
            }}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={onExportJSON}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all"
            style={{
              background: "var(--success-20)",
              color: "var(--success)",
            }}
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === "appointments" && (
          <AppointmentsReportSection
            appointmentReports={appointmentReports}
            paginatedAppointmentReports={paginatedAppointmentReports}
          />
        )}

        {activeTab === "referrals" && (
          <ReferralsReportSection
            referralReports={referralReports}
            paginatedReferralReports={paginatedReferralReports}
          />
        )}

        {activeTab === "sessions" && (
          <SessionsReportSection
            sessionReports={sessionReports}
            paginatedSessionReports={paginatedSessionReports}
          />
        )}

        {activeTab === "usage" && usageReport && (
          <UsageReportSection usageReport={usageReport} dateRange={dateRange} />
        )}
      </div>
    </div>
  );
}
