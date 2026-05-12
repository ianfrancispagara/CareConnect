"use client";

import type { AppointmentReport } from "@/types/admin";
import {
  getAppointmentStatusStyle,
  getAppointmentSummary,
} from "@/lib/utils/admin-reports";

type AppointmentsReportSectionProps = {
  appointmentReports: AppointmentReport[];
  paginatedAppointmentReports?: AppointmentReport[];
};

export function AppointmentsReportSection({
  appointmentReports,
  paginatedAppointmentReports,
}: AppointmentsReportSectionProps) {
  const summary = getAppointmentSummary(appointmentReports);
  const visibleReports = paginatedAppointmentReports ?? appointmentReports;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Total Appointments
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
            Scheduled
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {summary.scheduled}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Cancelled
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--error)" }}>
            {summary.cancelled}
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
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((appointment) => {
              const statusStyle = getAppointmentStatusStyle(appointment.status);

              return (
                <tr
                  key={appointment.id}
                  style={{ borderBottom: "1px solid var(--border-muted)" }}
                >
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {new Date(appointment.appointment_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {appointment.student_name}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {appointment.psg_member_name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={statusStyle}
                    >
                      {appointment.status.toUpperCase()}
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
