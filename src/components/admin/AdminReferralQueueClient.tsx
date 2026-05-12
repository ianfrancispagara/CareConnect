"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveReferralAndSchedule,
  rejectReferralByAdmin,
} from "@/actions/referrals";
import { useAlert } from "@/hooks/useAlert";
import {
  REFERRAL_SOURCE_LABELS,
  REFERRAL_STATUS_LABELS,
  SEVERITY_COLORS,
  type ReferralStatus,
  type ReferralWithProfiles,
} from "@/types/referrals";
import { TimePicker } from "@/components/TimePicker";
import { Calendar, ShieldCheck, User } from "lucide-react";

function getStatusColor(status: ReferralStatus): string {
  const colors: Record<ReferralStatus, string> = {
    pending: "var(--warning)",
    reviewed: "var(--info)",
    assigned: "var(--primary)",
    in_progress: "var(--info)",
    completed: "var(--success)",
    escalated: "var(--error)",
  };
  return colors[status];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Props = {
  referrals: ReferralWithProfiles[];
};

type ScheduleState = {
  appointment_date: string;
  location_type: "online" | "in_person";
  meeting_link: string;
  notes: string;
};

export function AdminReferralQueueClient({ referrals }: Props) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [expandedReferralId, setExpandedReferralId] = useState<string | null>(
    null,
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleState>({
    appointment_date: "",
    location_type: "online",
    meeting_link: "",
    notes: "",
  });

  if (referrals.length === 0) {
    return (
      <div
        className="rounded-lg p-12 text-center"
        style={{
          background: "var(--bg-light)",
          border: "1px solid var(--border-muted)",
        }}
      >
        <h2
          className="text-base font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          No Forwarded Referrals Yet
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Only referrals moved forward by PSG members will appear here.
        </p>
      </div>
    );
  }

  const handleReject = async (referralId: string) => {
    const shouldReject = window.confirm(
      "Reject this referral? It will be marked as escalated.",
    );
    if (!shouldReject) return;

    setProcessingId(referralId);
    const result = await rejectReferralByAdmin(referralId, "Rejected by admin");
    setProcessingId(null);

    if (!result.success) {
      showAlert({
        type: "error",
        message: result.error || "Failed to reject referral",
        duration: 5000,
      });
      return;
    }

    showAlert({
      type: "success",
      message: "Referral rejected successfully",
      duration: 4000,
    });
    router.refresh();
  };

  const handleApprove = async (referral: ReferralWithProfiles) => {
    if (!scheduleForm.appointment_date) {
      showAlert({
        type: "error",
        message: "Please select appointment date and time",
        duration: 5000,
      });
      return;
    }

    if (
      scheduleForm.location_type === "online" &&
      !scheduleForm.meeting_link.trim()
    ) {
      showAlert({
        type: "error",
        message: "Meeting link is required for online sessions",
        duration: 5000,
      });
      return;
    }

    const psgMemberId = referral.assigned_psg_member_id || referral.reviewed_by;
    if (!psgMemberId) {
      showAlert({
        type: "error",
        message: "No PSG member is associated with this referral",
        duration: 5000,
      });
      return;
    }

    setProcessingId(referral.id);

    const result = await approveReferralAndSchedule(referral.id, {
      appointment_date: new Date(scheduleForm.appointment_date).toISOString(),
      location_type: scheduleForm.location_type,
      meeting_link:
        scheduleForm.location_type === "online"
          ? scheduleForm.meeting_link
          : undefined,
      notes: scheduleForm.notes,
      psg_member_id: psgMemberId,
    });

    setProcessingId(null);

    if (!result.success) {
      showAlert({
        type: "error",
        message: result.error || "Failed to approve and schedule referral",
        duration: 5000,
      });
      return;
    }

    showAlert({
      type: "success",
      message: "Referral approved and scheduled",
      duration: 4000,
    });

    setExpandedReferralId(null);
    setScheduleForm({
      appointment_date: "",
      location_type: "online",
      meeting_link: "",
      notes: "",
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {referrals.map((referral) => {
        const isExpanded = expandedReferralId === referral.id;
        const isProcessing = processingId === referral.id;
        const canTakeAction =
          referral.status === "pending" || referral.status === "reviewed";
        const psgDisplayName =
          referral.reviewed_by_profile?.codename?.trim() ||
          referral.reviewed_by_profile?.full_name ||
          "PSG Member";

        return (
          <div
            key={referral.id}
            className="rounded-lg p-5"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="space-y-1">
                <p className="font-semibold" style={{ color: "var(--text)" }}>
                  {referral.student.full_name}
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {REFERRAL_SOURCE_LABELS[referral.source]}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {referral.severity && (
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      background: `${SEVERITY_COLORS[referral.severity]}20`,
                      color: SEVERITY_COLORS[referral.severity],
                    }}
                  >
                    {referral.severity.toUpperCase()}
                  </span>
                )}
                {(() => {
                  const statusColor = getStatusColor(referral.status);
                  return (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: `${statusColor}20`,
                        color: statusColor,
                      }}
                    >
                      {REFERRAL_STATUS_LABELS[referral.status]}
                    </span>
                  );
                })()}
              </div>
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--text)" }}>
              {referral.reason || "No reason provided"}
            </p>

            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Forwarded by {psgDisplayName}
                </div>
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Calendar className="w-4 h-4" />
                  {formatDate(referral.reviewed_at)}
                </div>
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <User className="w-4 h-4" />
                  Student ID: {referral.student.school_id || "N/A"}
                </div>
              </div>

              {canTakeAction && (
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedReferralId(isExpanded ? null : referral.id);
                    }}
                    disabled={isProcessing}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--primary)",
                      color: "var(--bg-dark)",
                    }}
                  >
                    {isExpanded ? "Cancel" : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(referral.id)}
                    disabled={isProcessing}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--error)",
                      color: "var(--bg-dark)",
                    }}
                  >
                    {isProcessing ? "Processing..." : "Reject"}
                  </button>
                </div>
              )}
            </div>

            {isExpanded && canTakeAction && (
              <div
                className="mt-4 p-4 rounded-lg space-y-3"
                style={{
                  border: "1px solid var(--border-muted)",
                  background: "var(--bg)",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text)" }}
                >
                  Schedule Session After Approval
                </p>

                <div>
                  <label
                    className="block text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Date and Time
                  </label>
                  <TimePicker
                    value={scheduleForm.appointment_date}
                    onChange={(value) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        appointment_date: value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label
                    className="block text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Session Type
                  </label>
                  <select
                    value={scheduleForm.location_type}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        location_type: e.target.value as "online" | "in_person",
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      background: "var(--bg-light)",
                      border: "1px solid var(--border-muted)",
                      color: "var(--text)",
                    }}
                  >
                    <option value="online">Online</option>
                    <option value="in_person">Face-to-Face</option>
                  </select>
                </div>

                {scheduleForm.location_type === "online" && (
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={scheduleForm.meeting_link}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          meeting_link: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg"
                      style={{
                        background: "var(--bg-light)",
                        border: "1px solid var(--border-muted)",
                        color: "var(--text)",
                      }}
                      placeholder="https://meet.google.com/..."
                    />
                    <p
                      className="mt-2 text-xs leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Request the meeting link from RGC or coordinate with the
                      Head of the Guidance Office before confirming the session.
                    </p>
                  </div>
                )}

                <div>
                  <label
                    className="block text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      background: "var(--bg-light)",
                      border: "1px solid var(--border-muted)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleApprove(referral)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--success)",
                      color: "var(--bg-dark)",
                    }}
                  >
                    {isProcessing
                      ? "Scheduling..."
                      : "Confirm Approval & Schedule"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
