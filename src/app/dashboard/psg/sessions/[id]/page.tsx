import { getUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getSessionById } from "@/actions/sessions";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  User,
  MapPin,
} from "lucide-react";

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();

  if (!user || user.role !== "psg_member") {
    redirect("/dashboard");
  }

  const result = await getSessionById(params.id);

  if (!result.success || !result.data) {
    redirect("/dashboard/psg/sessions");
  }

  const session = result.data;
  const appointment = session.appointment;
  const student = appointment.student;

  const sessionDate = new Date(appointment.appointment_date).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard/psg/sessions"
          className="inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </Link>

        {/* Session Header */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1
                className="text-2xl font-bold mb-2"
                style={{ color: "var(--text)" }}
              >
                Session Documentation
              </h1>
              <p style={{ color: "var(--text-muted)" }}>
                Detailed record of the counseling session
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <User
                className="w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Student
                </p>
                <p className="font-semibold" style={{ color: "var(--text)" }}>
                  #{student.school_id || "Unknown"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar
                className="w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Date
                </p>
                <p className="font-semibold" style={{ color: "var(--text)" }}>
                  {sessionDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock
                className="w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Duration
                </p>
                <p className="font-semibold" style={{ color: "var(--text)" }}>
                  {session.duration_minutes || 0} minutes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin
                className="w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Location
                </p>
                <p className="font-semibold" style={{ color: "var(--text)" }}>
                  {appointment.location_type === "online"
                    ? "Online"
                    : "In-Person"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Notes */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" style={{ color: "var(--primary)" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              Session Notes
            </h2>
          </div>
          <div
            className="prose prose-sm max-w-none"
            style={{ color: "var(--text)" }}
          >
            <p className="whitespace-pre-wrap">
              {session.notes || "No notes available"}
            </p>
          </div>
        </div>

        {/* Student Feedback */}
        {session.feedback && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare
                className="w-5 h-5"
                style={{ color: "var(--info)" }}
              />
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text)" }}
              >
                Student Feedback
              </h2>
            </div>
            <div
              className="prose prose-sm max-w-none"
              style={{ color: "var(--text)" }}
            >
              <p className="whitespace-pre-wrap">{session.feedback}</p>
            </div>
          </div>
        )}

        {/* Appointment Notes */}
        {appointment.notes && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText
                className="w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text)" }}
              >
                Initial Student Notes
              </h2>
            </div>
            <div
              className="prose prose-sm max-w-none"
              style={{ color: "var(--text-muted)" }}
            >
              <p className="whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/dashboard/psg/sessions/${session.id}/edit`}
            className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
              color: "var(--text)",
            }}
          >
            Edit Documentation
          </Link>
        </div>

        {/* Metadata */}
        <div
          className="mt-6 p-4 rounded-lg text-sm"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
          }}
        >
          <p style={{ color: "var(--text-muted)" }}>
            <strong>Created:</strong>{" "}
            {new Date(session.created_at).toLocaleString("en-US")}
          </p>
          {session.updated_at !== session.created_at && (
            <p style={{ color: "var(--text-muted)" }} className="mt-1">
              <strong>Last Updated:</strong>{" "}
              {new Date(session.updated_at).toLocaleString("en-US")}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
