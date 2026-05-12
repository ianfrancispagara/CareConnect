import type {
  AppointmentStatus,
  AppointmentWithProfiles,
  LocationType,
} from "@/types/appointments";

type StatusBadgeStyle = {
  background: string;
  color: string;
};

export type AppointmentFilter = "all" | "upcoming" | "past";

export const APPOINTMENT_FILTER_TABS: AppointmentFilter[] = [
  "all",
  "upcoming",
  "past",
];

export const DEFAULT_APPOINTMENT_FILTER: AppointmentFilter = "upcoming";

export function filterAndSortAppointments(
  appointments: AppointmentWithProfiles[],
  filter: AppointmentFilter,
): AppointmentWithProfiles[] {
  return [...appointments]
    .filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_date);
      const now = new Date();

      if (filter === "upcoming") {
        return (
          appointmentDate >= now &&
          appointment.status !== "completed" &&
          appointment.status !== "cancelled"
        );
      }

      if (filter === "past") {
        return (
          appointmentDate < now ||
          appointment.status === "completed" ||
          appointment.status === "cancelled"
        );
      }

      return true;
    })
    .sort((a, b) => {
      return (
        new Date(b.appointment_date).getTime() -
        new Date(a.appointment_date).getTime()
      );
    });
}

export function formatAppointmentDate(dateStr: string): string {
  const date = new Date(dateStr);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatAppointmentTime(dateStr: string): string {
  const date = new Date(dateStr);

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getAppointmentStatusStyle(
  status: AppointmentStatus,
): StatusBadgeStyle {
  if (status === "scheduled") {
    return {
      background: "var(--warning)",
      color: "var(--bg-dark)",
    };
  }

  if (status === "confirmed") {
    return {
      background: "var(--info)",
      color: "var(--bg-dark)",
    };
  }

  if (status === "completed") {
    return {
      background: "var(--success)",
      color: "var(--bg-dark)",
    };
  }

  return {
    background: "var(--error)",
    color: "var(--bg-dark)",
  };
}

export function getAppointmentLocationLabel(
  locationType: LocationType | string,
): string {
  return locationType === "online" ? "Online" : "In Person";
}
