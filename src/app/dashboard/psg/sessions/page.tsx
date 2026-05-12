import { getUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import {
  getPSGMemberSessions,
  getPSGSessionSummary,
  getAllSessions,
  getAllSessionsSummary,
} from "@/actions/sessions";
import Link from "next/link";
import {
  FileText,
  Clock,
  Calendar,
  TrendingUp,
  ArrowLeft,
  User,
} from "lucide-react";

export default async function PSGSessionsPage() {
  const user = await getUser();

  if (!user || (user.role !== "psg_member" && user.role !== "admin")) {
    redirect("/dashboard");
  }

  // Admins see all sessions, PSG members see only their own
  const [sessionsResult, summaryResult] = await Promise.all(
    user.role === "admin"
      ? [getAllSessions(), getAllSessionsSummary()]
      : [getPSGMemberSessions(user.id), getPSGSessionSummary(user.id)],
  );

  const sessions = sessionsResult.success ? sessionsResult.data || [] : [];
  const summary = summaryResult.success ? summaryResult.data : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div
              className="p-6 rounded-lg"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: "var(--primary-20)" }}
                >
                  <FileText
                    className="w-5 h-5"
                    style={{ color: "var(--primary)" }}
                  />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {summary.total_sessions}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Total Sessions
                  </p>
                </div>
              </div>
            </div>

            <div
              className="p-6 rounded-lg"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: "var(--info-20)" }}
                >
                  <Clock className="w-5 h-5" style={{ color: "var(--info)" }} />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {summary.total_duration_minutes}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Total Minutes
                  </p>
                </div>
              </div>
            </div>

            <div
              className="p-6 rounded-lg"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: "var(--success-20)" }}
                >
                  <TrendingUp
                    className="w-5 h-5"
                    style={{ color: "var(--success)" }}
                  />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {summary.average_duration_minutes}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Avg. Minutes
                  </p>
                </div>
              </div>
            </div>

            <div
              className="p-6 rounded-lg"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: "var(--warning-20)" }}
                >
                  <Calendar
                    className="w-5 h-5"
                    style={{ color: "var(--warning)" }}
                  />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {summary.sessions_this_month}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    This Month
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <h2
            className="text-xl font-bold mb-6"
            style={{ color: "var(--text)" }}
          >
            Session History
          </h2>

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
                Session documentation will appear here after you complete
                appointments
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const appointment = session.appointment;
                const student = appointment.student;
                const sessionDate = new Date(
                  appointment.appointment_date,
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
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
                            {student.full_name}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Student ID: {student.school_id || "N/A"}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {sessionDate}
                          </p>
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

                    <div className="mb-3">
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: "var(--text)" }}
                      >
                        Session Notes:
                      </p>
                      <p
                        className="text-sm line-clamp-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {session.notes || "No notes available"}
                      </p>
                    </div>

                    {session.feedback && (
                      <div className="mb-3">
                        <p
                          className="text-sm font-semibold mb-1"
                          style={{ color: "var(--text)" }}
                        >
                          Student Feedback:
                        </p>
                        <p
                          className="text-sm line-clamp-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {session.feedback}
                        </p>
                      </div>
                    )}

                    <div
                      className="flex gap-2 pt-3 border-t"
                      style={{ borderColor: "var(--border-muted)" }}
                    >
                      <Link
                        href={`/dashboard/psg/sessions/${session.id}`}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={{
                          background: "var(--primary-20)",
                          color: "var(--primary)",
                        }}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
