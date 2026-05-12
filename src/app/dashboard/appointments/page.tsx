"use client";

import Link from "next/link";
import { useStudentAppointments } from "@/hooks/useStudentAppointments";
import { Loader } from "@/components/Loader";
import { AppointmentsFilterTabs } from "./components/AppointmentsFilterTabs";
import { AppointmentsList } from "./components/AppointmentsList";

export default function StudentAppointmentsPage() {
  const { filteredAppointments, loading, filter, setFilter } =
    useStudentAppointments();

  if (loading) {
    return <Loader fullScreen text="Loading appointments..." />;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            My Appointments
          </h1>
          <Link
            href="/dashboard/appointments/book"
            className="px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors w-full sm:w-auto text-center"
            style={{
              background: "var(--primary)",
              color: "var(--bg-dark)",
            }}
          >
            Book New Appointment
          </Link>
        </div>

        <AppointmentsFilterTabs
          filter={filter}
          onFilterChange={(nextFilter) => setFilter(nextFilter)}
        />

        <AppointmentsList appointments={filteredAppointments} />
      </div>
    </div>
  );
}
