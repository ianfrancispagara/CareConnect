"use client";

import {
  APPOINTMENT_FILTER_TABS,
  type AppointmentFilter,
} from "@/lib/utils/student-appointments";

type AppointmentsFilterTabsProps = {
  filter: AppointmentFilter;
  onFilterChange: (filter: AppointmentFilter) => void;
};

export function AppointmentsFilterTabs({
  filter,
  onFilterChange,
}: AppointmentsFilterTabsProps) {
  return (
    <div
      className="flex gap-2 mb-6 border-b"
      style={{ borderColor: "var(--border-muted)" }}
    >
      {APPOINTMENT_FILTER_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onFilterChange(tab)}
          className="px-6 py-3 font-medium transition-colors capitalize"
          style={{
            borderBottom: filter === tab ? "2px solid var(--primary)" : "none",
            color: filter === tab ? "var(--primary)" : "var(--text-muted)",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
