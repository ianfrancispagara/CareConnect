"use client";

import type { SessionReport } from "@/types/admin";
import { getSessionSummary } from "@/lib/utils/admin-reports";

type SessionsReportSectionProps = {
  sessionReports: SessionReport[];
  paginatedSessionReports?: SessionReport[];
};

export function SessionsReportSection({
  sessionReports,
  paginatedSessionReports,
}: SessionsReportSectionProps) {
  const summary = getSessionSummary(sessionReports);
  const visibleReports = paginatedSessionReports ?? sessionReports;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Total Sessions
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {summary.total}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Total Duration
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {summary.totalDuration} min
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Avg Duration
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>
            {summary.averageDuration} min
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
                PSG Member
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((session) => (
              <tr
                key={session.id}
                style={{ borderBottom: "1px solid var(--border-muted)" }}
              >
                <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                  {new Date(session.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                  {session.student_name}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                  {session.psg_member_name}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                  {session.duration_minutes || "N/A"} min
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
