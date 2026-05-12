import { getUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getStudentSessions } from "@/actions/sessions";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Clock, User } from "lucide-react";

export default async function StudentSessionHistoryPage() {
  const user = await getUser();

  if (!user || user.role !== "student") {
    redirect("/dashboard");
  }

  const result = await getStudentSessions(user.id);
  const sessions = result.success ? result.data || [] : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Appointments
        </Link>

        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--text)" }}
          >
            Session History
          </h1>
          <p className="mb-6" style={{ color: "var(--text-muted)" }}>
            View your completed counseling sessions and progress
          </p>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <FileText
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text)" }}
              >
                No Sessions Yet
              </p>
              <p style={{ color: "var(--text-muted)" }}>
                Your completed session records will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const appointment = session.appointment;
                const sessionDate = new Date(
                  appointment.appointment_date,
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
                const sessionTime = new Date(
                  appointment.appointment_date,
                ).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg transition-all hover:shadow-md"
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border-muted)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ background: "var(--bg-light)" }}
                        >
                          <User
                            className="w-5 h-5"
                            style={{ color: "var(--text-muted)" }}
                          />
                        </div>
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text)" }}
                          >
                            PSG Member
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar
                                className="w-4 h-4"
                                style={{ color: "var(--text-muted)" }}
                              />
                              <span style={{ color: "var(--text-muted)" }}>
                                {sessionDate}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock
                                className="w-4 h-4"
                                style={{ color: "var(--text-muted)" }}
                              />
                              <span style={{ color: "var(--text-muted)" }}>
                                {sessionTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock
                          className="w-4 h-4"
                          style={{ color: "var(--text-muted)" }}
                        />
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          {session.duration_minutes || 0} min
                        </span>
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-lg mb-3"
                      style={{
                        background: "var(--info-20)",
                        border: "1px solid var(--info)",
                      }}
                    >
                      <p className="text-sm" style={{ color: "var(--text)" }}>
                        <strong>Session completed successfully.</strong> Your
                        counselor has documented this session for your records.
                      </p>
                    </div>

                    {appointment.notes && (
                      <div className="mb-3">
                        <p
                          className="text-sm font-semibold mb-1"
                          style={{ color: "var(--text)" }}
                        >
                          Your Initial Notes:
                        </p>
                        <p
                          className="text-sm line-clamp-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {appointment.notes}
                        </p>
                      </div>
                    )}

                    <div
                      className="flex gap-2 pt-3 border-t"
                      style={{ borderColor: "var(--border-muted)" }}
                    >
                      <Link
                        href={`/dashboard/appointments/${appointment.id}`}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={{
                          background: "var(--primary-20)",
                          color: "var(--primary)",
                        }}
                      >
                        View Appointment
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div
          className="mt-6 p-4 rounded-lg text-sm"
          style={{
            background: "var(--info-20)",
            border: "1px solid var(--info)",
          }}
        >
          <p style={{ color: "var(--text)" }}>
            <strong>Privacy Notice:</strong> Detailed session notes are kept
            confidential by your counselors. Only general session information
            (date, duration) is visible to you. For questions about your
            sessions, please contact your assigned PSG member.
          </p>
        </div>
      </main>
    </div>
  );
}
