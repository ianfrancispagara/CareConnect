"use client";

import type { AppointmentWithProfiles } from "@/types/appointments";
import { AppointmentsEmptyState } from "./AppointmentsEmptyState";
import { AppointmentCard } from "./AppointmentCard";

type AppointmentsListProps = {
  appointments: AppointmentWithProfiles[];
};

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  if (appointments.length === 0) {
    return <AppointmentsEmptyState />;
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  );
}
