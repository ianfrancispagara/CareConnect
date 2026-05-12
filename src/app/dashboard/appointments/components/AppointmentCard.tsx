"use client";

import Link from "next/link";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import type { AppointmentWithProfiles } from "@/types/appointments";
import { APPOINTMENT_STATUS_LABELS } from "@/types/appointments";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getAppointmentLocationLabel,
  getAppointmentStatusStyle,
} from "@/lib/utils/student-appointments";

type AppointmentCardProps = {
  appointment: AppointmentWithProfiles;
};

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const statusStyle = getAppointmentStatusStyle(appointment.status);

  return (
    <div
      className="rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)] p-6 hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.02)] transition-shadow"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-2">
            <h3
              className="text-base font-bold"
              style={{ color: "var(--text)" }}
            >
              {appointment.psg_member?.full_name || "PSG Member"}
            </h3>
            <span
              className="px-3 py-1 rounded-full text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
              style={{
                background: statusStyle.background,
                color: statusStyle.color,
              }}
            >
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </span>
          </div>

          <div className="space-y-1" style={{ color: "var(--text-muted)" }}>
            <p className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {formatAppointmentDate(appointment.appointment_date)}
            </p>
            <p className="flex items-center gap-2">
              <Clock3 className="w-5 h-5" />
              {formatAppointmentTime(appointment.appointment_date)} (
              {appointment.duration_minutes} minutes)
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {getAppointmentLocationLabel(appointment.location_type)}
            </p>
          </div>

          {appointment.notes && (
            <div
              className="mt-3 p-3 rounded-lg"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border-muted)",
              }}
            >
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text)" }}
              >
                Notes:
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {appointment.notes}
              </p>
            </div>
          )}

          {appointment.cancellation_reason && (
            <div
              className="mt-3 p-3 rounded-lg"
              style={{
                background: "var(--error-bg)",
                border: "1px solid var(--error)",
              }}
            >
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--error)" }}
              >
                Cancellation Reason:
              </p>
              <p className="text-sm" style={{ color: "var(--error)" }}>
                {appointment.cancellation_reason}
              </p>
            </div>
          )}
        </div>

        <Link
          href={`/dashboard/appointments/${appointment.id}`}
          className="px-4 py-2 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.08)] hover:opacity-90 transition-all"
          style={{
            background: "var(--info)",
            color: "var(--bg-dark)",
          }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
