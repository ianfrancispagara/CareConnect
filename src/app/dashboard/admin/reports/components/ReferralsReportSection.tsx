"use client";

import type { ReferralReport } from "@/types/admin";
import {
  getReferralSeverityStyle,
  getReferralStatusStyle,
  getReferralSummary,
  normalizeReportValue,
} from "@/lib/utils/admin-reports";

type ReferralsReportSectionProps = {
  referralReports: ReferralReport[];
  paginatedReferralReports?: ReferralReport[];
};

export function ReferralsReportSection({
  referralReports,
  paginatedReferralReports,
}: ReferralsReportSectionProps) {
  const summary = getReferralSummary(referralReports);
  const visibleReports = paginatedReferralReports ?? referralReports;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Total Referrals
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {summary.total}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Completed
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>
            {summary.completed}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            In Progress
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {summary.inProgress}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Escalated
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--error)" }}>
            {summary.escalated}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-muted)" }}>
              <th
                className="px-4 py-2 text-left text-xs font-medium uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Date
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Student
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Source
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Severity
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((referral) => {
              const source = normalizeReportValue(referral.source);
              const status = normalizeReportValue(referral.status);
              const severity = normalizeReportValue(referral.severity);
              const severityStyle = getReferralSeverityStyle(severity);
              const statusStyle = getReferralStatusStyle(status);

              return (
                <tr
                  key={referral.id}
                  style={{ borderBottom: "1px solid var(--border-muted)" }}
                >
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {referral.student_name}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {source.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={severityStyle}
                    >
                      {severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={statusStyle}
                    >
                      {status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
