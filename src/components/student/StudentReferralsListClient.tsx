"use client";

import { useState } from "react";
import { getStudentReferralAppointmentDetails } from "@/actions/referrals";
import {
  REFERRAL_STATUS_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  type ReferralStatus,
  type ReferralWithProfiles,
} from "@/types/referrals";
import { useAlert } from "@/hooks/useAlert";

type Props = {
  referrals: ReferralWithProfiles[];
};

type AppointmentDetails = {
  id: string;
  appointment_date: string;
  location_type: "online" | "in_person" | null;
  meeting_link: string | null;
  notes: string | null;
  status: string;
} | null;

const getStatusColor = (status: ReferralStatus): string => {
  const colors: Record<ReferralStatus, string> = {
    pending: "var(--warning)",
    reviewed: "var(--info)",
    assigned: "var(--primary)",
    in_progress: "var(--primary)",
    completed: "var(--success)",
    escalated: "var(--error)",
  };
  return colors[status];
};

export function StudentReferralsListClient({ referrals }: Props) {
  const { showAlert } = useAlert();
  const [selectedReferral, setSelectedReferral] =
    useState<ReferralWithProfiles | null>(null);
  const [details, setDetails] = useState<AppointmentDetails>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleViewDetails = async (referral: ReferralWithProfiles) => {
    setSelectedReferral(referral);
    setDetails(null);
    setIsLoadingDetails(true);

    const result = await getStudentReferralAppointmentDetails(referral.id);
    setIsLoadingDetails(false);

    if (!result.success) {
      showAlert({
        type: "error",
        message: result.error || "Failed to load referral details",
        duration: 5000,
      });
      return;
    }

    setDetails(result.data ?? null);
  };

  const closeDialog = () => {
    setSelectedReferral(null);
    setDetails(null);
    setIsLoadingDetails(false);
  };

  return (
    <>
      <div className="space-y-4">
        {referrals.map((referral) => {
          const statusColor = getStatusColor(referral.status);
          const severityColor = referral.severity
            ? SEVERITY_COLORS[referral.severity]
            : null;

          return (
            <div
              key={referral.id}
              className="rounded-lg p-6"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)",
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        background: `${statusColor}20`,
                        color: statusColor,
                      }}
                    >
                      {REFERRAL_STATUS_LABELS[referral.status]}
                    </span>
                    {severityColor && referral.severity && (
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded"
                        style={{
                          background: `${severityColor}20`,
                          color: severityColor,
                        }}
                      >
                        {SEVERITY_LABELS[referral.severity]}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    {referral.reason}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Submitted on{" "}
                    {new Date(referral.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleViewDetails(referral)}
                  className="shrink-0 px-3 py-2 rounded-md text-xs font-semibold"
                  style={{
                    background: "var(--primary)",
                    color: "white",
                  }}
                >
                  View Details
                </button>
              </div>

              {referral.assigned_psg_member && (
                <div
                  className="pt-4 mt-4 text-xs"
                  style={{
                    borderTop: "1px solid var(--border-muted)",
                    color: "var(--text-muted)",
                  }}
                >
                  <strong>Assigned PSG Member:</strong>{" "}
                  {referral.assigned_psg_member.codename?.trim() || "N/A"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedReferral && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.65)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="referral-details-title"
        >
          <div
            className="w-full max-w-lg rounded-lg p-5"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2
                id="referral-details-title"
                className="text-base font-semibold"
                style={{ color: "var(--text)" }}
              >
                Referral Details
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                className="px-2 py-1 rounded text-sm"
                style={{
                  background: "var(--bg)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-muted)",
                }}
                aria-label="Close details dialog"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm" style={{ color: "var(--text)" }}>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Referral Reason
                </p>
                <p>{selectedReferral.reason || "No reason provided"}</p>
              </div>

              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Assigned PSG Member
                </p>
                <p>
                  {selectedReferral.assigned_psg_member?.codename?.trim() ||
                    "N/A"}
                </p>
              </div>

              {isLoadingDetails ? (
                <p style={{ color: "var(--text-muted)" }}>
                  Loading appointment details...
                </p>
              ) : details ? (
                <>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Date and Time
                    </p>
                    <p>
                      {new Date(details.appointment_date).toLocaleString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Session Type
                    </p>
                    <p>
                      {details.location_type === "online"
                        ? "Online"
                        : details.location_type === "in_person"
                          ? "Face-to-Face"
                          : "Not specified"}
                    </p>
                  </div>

                  {details.location_type === "online" && (
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Meeting Link
                      </p>
                      {details.meeting_link ? (
                        <a
                          href={details.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline break-all"
                          style={{ color: "var(--primary)" }}
                        >
                          {details.meeting_link}
                        </a>
                      ) : (
                        <p>No meeting link provided</p>
                      )}
                    </div>
                  )}

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Admin Notes
                    </p>
                    <p>{details.notes?.trim() || "No notes provided"}</p>
                  </div>
                </>
              ) : (
                <p style={{ color: "var(--text-muted)" }}>
                  No appointment details available yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
