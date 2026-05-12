"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAppointmentById, cancelAppointment } from "@/actions/appointments";
import { useAlert } from "@/hooks/useAlert";
import type { AppointmentWithProfiles } from "@/types/appointments";
import { APPOINTMENT_STATUS_LABELS } from "@/types/appointments";
import { Loader } from "@/components/Loader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AppointmentDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showAlert } = useAlert();
  const [appointment, setAppointment] =
    useState<AppointmentWithProfiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    async function load() {
      await loadAppointment();
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  const loadAppointment = async () => {
    try {
      const result = await getAppointmentById(resolvedParams.id);

      if (result.success && result.data) {
        setAppointment(result.data);
      } else {
        showAlert({
          message: result.error || "Failed to load appointment",
          type: "error",
          duration: 5000,
        });
        router.push("/dashboard/appointments");
      }
    } catch {
      showAlert({
        message: "An unexpected error occurred",
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      showAlert({
        message: "Please provide a reason for cancellation",
        type: "error",
        duration: 5000,
      });
      return;
    }

    try {
      setCancelling(true);
      const result = await cancelAppointment(resolvedParams.id, cancelReason);

      if (result.success) {
        showAlert({
          message: "Appointment cancelled successfully",
          type: "success",
          duration: 5000,
        });
        await loadAppointment();
        setShowCancelDialog(false);
        setCancelReason("");
      } else {
        showAlert({
          message: result.error || "Failed to cancel appointment",
          type: "error",
          duration: 5000,
        });
      }
    } catch {
      showAlert({
        message: "An unexpected error occurred",
        type: "error",
        duration: 5000,
      });
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canCancel =
    appointment &&
    appointment.status !== "cancelled" &&
    appointment.status !== "completed" &&
    new Date(appointment.appointment_date) > new Date();

  if (loading) {
    return <Loader fullScreen text="Loading appointment details..." />;
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard/appointments"
            className="flex items-center gap-2 hover:underline"
            style={{ color: "var(--primary)" }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Appointments
          </Link>
        </div>

        <div
          className="rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)] p-8"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
          }}
        >
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              Appointment Details
            </h1>
            <span
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background:
                  appointment.status === "scheduled"
                    ? "var(--warning)"
                    : appointment.status === "confirmed"
                      ? "var(--info)"
                      : appointment.status === "completed"
                        ? "var(--success)"
                        : "var(--error)",
                color: "var(--bg-dark)",
              }}
            >
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </span>
          </div>

          {/* PSG Member Info */}
          <div className="mb-8">
            <h2
              className="text-base font-bold mb-4"
              style={{ color: "var(--text)" }}
            >
              PSG Member
            </h2>
            <div
              className="flex items-center gap-4 p-4 rounded-lg"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border-muted)",
              }}
            >
              {appointment.psg_member?.avatar_url && (
                <Image
                  src={appointment.psg_member.avatar_url}
                  alt={appointment.psg_member.full_name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                  unoptimized
                />
              )}
              <div>
                <p
                  className="font-semibold text-lg"
                  style={{ color: "var(--text)" }}
                >
                  {appointment.psg_member?.full_name}
                </p>
              </div>
            </div>
          </div>

          {/* Appointment Info */}
          <div className="mb-8">
            <h2
              className="text-base font-bold mb-4"
              style={{ color: "var(--text)" }}
            >
              Appointment Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--text-muted)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Date
                  </p>
                  <p
                    className="text-lg font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {formatDate(appointment.appointment_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--text-muted)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Time
                  </p>
                  <p
                    className="text-lg font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {formatTime(appointment.appointment_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--text-muted)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Duration
                  </p>
                  <p
                    className="text-lg font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {appointment.duration_minutes} minutes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--text-muted)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Location
                  </p>
                  <p
                    className="text-lg font-medium capitalize"
                    style={{ color: "var(--text)" }}
                  >
                    {appointment.location_type}
                  </p>
                </div>
              </div>

              {appointment.meeting_link && (
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Meeting Link
                    </p>
                    <a
                      href={appointment.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg hover:underline"
                      style={{ color: "var(--primary)" }}
                    >
                      Join Meeting
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="mb-8">
              <h2
                className="text-base font-bold mb-4"
                style={{ color: "var(--text)" }}
              >
                Notes
              </h2>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border-muted)",
                }}
              >
                <p style={{ color: "var(--text)" }}>{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Cancellation Info */}
          {appointment.cancellation_reason && (
            <div className="mb-8">
              <h2
                className="text-base font-bold mb-4"
                style={{ color: "var(--text)" }}
              >
                Cancellation Details
              </h2>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: "var(--error-bg)",
                  border: "1px solid var(--error)",
                }}
              >
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Cancelled on:{" "}
                  {appointment.cancelled_at
                    ? formatDate(appointment.cancelled_at)
                    : "N/A"}
                </p>
                <p style={{ color: "var(--error)" }}>
                  {appointment.cancellation_reason}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          {canCancel && (
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelDialog(true)}
                className="px-6 py-3 rounded-lg hover:opacity-90 transition-all"
                style={{ background: "var(--error)", color: "var(--bg-dark)" }}
              >
                Cancel Appointment
              </button>
            </div>
          )}
        </div>

        {/* Cancel Dialog */}
        {showCancelDialog && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
          >
            <div
              className="rounded-lg p-6 max-w-md w-full"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
              }}
            >
              <h3
                className="text-base font-bold mb-4"
                style={{ color: "var(--text)" }}
              >
                Cancel Appointment
              </h3>
              <p className="mb-4" style={{ color: "var(--text-muted)" }}>
                Please provide a reason for cancelling this appointment:
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg resize-none mb-4"
                style={{
                  border: "1px solid var(--border-muted)",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCancelAppointment}
                  disabled={cancelling}
                  className="flex-1 px-6 py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                  style={{
                    background: "var(--error)",
                    color: "var(--bg-dark)",
                  }}
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancel"}
                </button>
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelReason("");
                  }}
                  disabled={cancelling}
                  className="px-6 py-2 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.08)] hover:opacity-90 transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text)",
                  }}
                >
                  Keep Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
