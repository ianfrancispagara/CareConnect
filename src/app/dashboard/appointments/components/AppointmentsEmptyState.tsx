"use client";

import Link from "next/link";

export function AppointmentsEmptyState() {
  return (
    <div
      className="rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)] p-8 text-center"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      <p className="mb-4" style={{ color: "var(--text-muted)" }}>
        No appointments found
      </p>
      <Link
        href="/dashboard/appointments/book"
        className="inline-block px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
        style={{
          background: "var(--primary)",
          color: "var(--bg-dark)",
        }}
      >
        Book Your First Appointment
      </Link>
    </div>
  );
}
