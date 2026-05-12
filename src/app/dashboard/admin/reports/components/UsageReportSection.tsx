"use client";

import type { UsageReport } from "@/types/admin";
import {
  getPeriodLabel,
  getUsageInteractions,
  type DateRange,
} from "@/lib/utils/admin-reports";

type UsageReportSectionProps = {
  usageReport: UsageReport;
  dateRange: DateRange;
};

export function UsageReportSection({
  usageReport,
  dateRange,
}: UsageReportSectionProps) {
  const periodLabel = getPeriodLabel(dateRange);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Active Students
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {usageReport.active_students}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Active PSG Members
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {usageReport.active_psg_members}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Total Interactions
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>
            {getUsageInteractions(usageReport)}
          </p>
        </div>
      </div>

      <div className="p-6 rounded-lg" style={{ background: "var(--bg)" }}>
        <h4 className="font-semibold mb-4" style={{ color: "var(--text)" }}>
          Detailed Metrics
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              Total Appointments
            </p>
            <p
              className="text-xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              {usageReport.total_appointments}
            </p>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              Total Referrals
            </p>
            <p
              className="text-xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              {usageReport.total_referrals}
            </p>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              Total Sessions
            </p>
            <p
              className="text-xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              {usageReport.total_sessions}
            </p>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              Report Period
            </p>
            <p
              className="text-xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              {periodLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
