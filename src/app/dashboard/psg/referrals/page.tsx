"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardClientWrapper } from "@/components/DashboardClientWrapper";
import { Loader } from "@/components/Loader";
import { useAlert } from "@/hooks/useAlert";
import { getCurrentUserReferralsView } from "@/actions/referrals";
import {
  ReferralWithProfiles,
  ReferralStatus,
  REFERRAL_STATUS_LABELS,
  REFERRAL_SOURCE_LABELS,
  SEVERITY_COLORS,
} from "@/types/referrals";
import { User, Calendar, FileText, Filter } from "lucide-react";

async function withTimeout<T>(
  promiseLike: PromiseLike<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promiseLike),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export default function PSGReferralsPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [referrals, setReferrals] = useState<ReferralWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [loadPhase, setLoadPhase] = useState<"idle" | "loading" | "done">(
    "idle",
  );
  const [diagnostics, setDiagnostics] = useState<{
    referralsMs: number;
    authMs: number;
    profileMs: number;
    fallbackMs: number;
    totalMs: number;
    failedPhase?: string;
  } | null>(null);
  const [filter, setFilter] = useState<"all" | ReferralStatus>("all");

  const loadUserAndReferrals = async () => {
    setLoading(true);
    setLoadTimedOut(false);
    setLoadPhase("loading");

    const runStart = performance.now();
    let fallbackMs = 0;

    try {
      const fallbackStart = performance.now();
      const result = await withTimeout(
        Promise.resolve(getCurrentUserReferralsView()),
        10000,
        "Server fallback timed out",
      );
      fallbackMs = Math.round(performance.now() - fallbackStart);

      if (result.success && result.data) {
        setReferrals(result.data);
        const totalMs = Math.round(performance.now() - runStart);
        setDiagnostics({
          referralsMs: 0,
          authMs: 0,
          profileMs: 0,
          fallbackMs,
          totalMs,
        });
        setLoadPhase("done");
        if (process.env.NODE_ENV !== "production") {
          console.info("[PSG Referrals] Load timings", {
            source: "server_action_primary",
            fallbackMs,
            totalMs,
            count: result.data.length,
          });
        }
      } else {
        if (result.error === "Please login first") {
          showAlert({
            message: "Please login first",
            type: "error",
            duration: 5000,
          });
          router.push("/login");
          return;
        }

        if (result.error === "Unauthorized access") {
          showAlert({
            message: "Unauthorized access",
            type: "error",
            duration: 5000,
          });
          router.push("/dashboard");
          return;
        }

        throw new Error(result.error || "Failed to load referrals");
      }
    } catch (error) {
      const totalMs = Math.round(performance.now() - runStart);
      setDiagnostics({
        referralsMs: 0,
        authMs: 0,
        profileMs: 0,
        fallbackMs,
        totalMs,
        failedPhase: "loading",
      });

      console.error("Error loading referrals:", error);
      if (process.env.NODE_ENV !== "production") {
        console.error("[PSG Referrals] Load failed", {
          error,
          fallbackMs,
          totalMs,
        });
      }

      showAlert({
        message: "An unexpected error occurred",
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndReferrals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const watchdogId = setTimeout(() => {
      setLoadTimedOut(true);
      setLoading(false);
      showAlert({
        message: `Loading took too long during ${loadPhase}. Please try again.`,
        type: "error",
        duration: 5000,
      });
    }, 12000);

    return () => clearTimeout(watchdogId);
  }, [loading, showAlert, loadPhase]);

  const filteredReferrals =
    filter === "all"
      ? referrals
      : referrals.filter((ref) => ref.status === filter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: ReferralStatus) => {
    const colors: Record<ReferralStatus, string> = {
      pending: "var(--warning)",
      reviewed: "var(--info)",
      assigned: "var(--primary)",
      in_progress: "var(--info)",
      completed: "var(--success)",
      escalated: "var(--error)",
    };
    return colors[status];
  };

  const statusCounts = {
    pending: referrals.filter((r) => r.status === "pending").length,
    reviewed: referrals.filter((r) => r.status === "reviewed").length,
    assigned: referrals.filter((r) => r.status === "assigned").length,
    in_progress: referrals.filter((r) => r.status === "in_progress").length,
  };

  if (loading) {
    return (
      <DashboardClientWrapper>
        <div className="min-h-screen" style={{ background: "var(--bg)" }}>
          <div className="flex items-center justify-center py-12">
            <Loader text="Loading referrals..." />
          </div>
        </div>
      </DashboardClientWrapper>
    );
  }

  return (
    <DashboardClientWrapper>
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1
              className="text-lg font-bold mb-2"
              style={{ color: "var(--text)" }}
            >
              Referral Reviews
            </h1>
            <p style={{ color: "var(--text-muted)" }}>
              Review referrals and forward triage decisions to admin
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div
              className="rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)]"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
              }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Pending Review
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--warning)" }}
              >
                {statusCounts.pending}
              </p>
            </div>
            <div
              className="rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)]"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
              }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Reviewed
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--info)" }}
              >
                {statusCounts.reviewed}
              </p>
            </div>
            <div
              className="rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)]"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
              }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Assigned
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--primary)" }}
              >
                {statusCounts.assigned}
              </p>
            </div>
            <div
              className="rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)]"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
              }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                In Progress
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--info)" }}
              >
                {statusCounts.in_progress}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: "all" as const, label: "All" },
              { key: "pending" as const, label: "Pending" },
              { key: "reviewed" as const, label: "Reviewed" },
              { key: "assigned" as const, label: "Assigned" },
              { key: "in_progress" as const, label: "In Progress" },
              { key: "completed" as const, label: "Completed" },
              { key: "escalated" as const, label: "Escalated" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="px-4 py-2 rounded-md text-sm font-medium transition"
                style={{
                  background:
                    filter === tab.key ? "var(--primary)" : "var(--bg-light)",
                  color:
                    filter === tab.key ? "var(--bg-dark)" : "var(--text-muted)",
                  border:
                    filter === tab.key
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border-muted)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Referrals List */}
          <div className="space-y-4">
            {filteredReferrals.length === 0 ? (
              <div
                className="text-center py-12 rounded-lg"
                style={{
                  background: "var(--bg-light)",
                  border: "1px solid var(--border-muted)",
                }}
              >
                <Filter
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <p style={{ color: "var(--text-muted)" }}>
                  {loadTimedOut
                    ? "Could not finish loading referrals"
                    : "No referrals found"}
                </p>
                {loadTimedOut && (
                  <>
                    {diagnostics && (
                      <p
                        className="mt-2 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Slow phase: {diagnostics.failedPhase || loadPhase} •
                        query {diagnostics.referralsMs}ms • auth{" "}
                        {diagnostics.authMs}ms • profile {diagnostics.profileMs}
                        ms • fallback {diagnostics.fallbackMs}ms • total{" "}
                        {diagnostics.totalMs}ms
                      </p>
                    )}
                    <button
                      onClick={loadUserAndReferrals}
                      className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition"
                      style={{
                        background: "var(--primary)",
                        color: "var(--bg-dark)",
                      }}
                    >
                      Retry Loading
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredReferrals.map((referral) => (
                <div
                  key={referral.id}
                  onClick={() =>
                    router.push(`/dashboard/psg/referrals/${referral.id}`)
                  }
                  className="rounded-lg p-6 shadow-[0_2px_4px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
                  style={{
                    background: "var(--bg-light)",
                    border: "1px solid var(--border-muted)",
                  }}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ background: "var(--primary-20)" }}
                      >
                        <User size={20} style={{ color: "var(--primary)" }} />
                      </div>
                      <div>
                        <h3
                          className="text-base font-bold"
                          style={{ color: "var(--text)" }}
                        >
                          {referral.student.full_name}
                        </h3>
                        {referral.student.school_id && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            ID: {referral.student.school_id}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {referral.severity && (
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            background: SEVERITY_COLORS[referral.severity],
                            color: "var(--bg-dark)",
                          }}
                        >
                          {referral.severity.toUpperCase()}
                        </span>
                      )}
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                        style={{
                          background: getStatusColor(referral.status),
                          color: "var(--bg-dark)",
                        }}
                      >
                        {REFERRAL_STATUS_LABELS[referral.status]}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)]"
                      style={{
                        background: "var(--bg-dark)",
                        border: "1px solid var(--border-muted)",
                      }}
                    >
                      <Calendar
                        size={16}
                        style={{ color: "var(--text-muted)" }}
                      />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Created
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          {formatDate(referral.created_at)}
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)]"
                      style={{
                        background: "var(--bg-dark)",
                        border: "1px solid var(--border-muted)",
                      }}
                    >
                      <FileText
                        size={16}
                        style={{ color: "var(--text-muted)" }}
                      />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Source
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          {REFERRAL_SOURCE_LABELS[referral.source]}
                        </p>
                      </div>
                    </div>
                    {referral.assigned_psg_member && (
                      <div
                        className="flex items-center gap-2 p-3 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)]"
                        style={{
                          background: "var(--bg-dark)",
                          border: "1px solid var(--border-muted)",
                        }}
                      >
                        <User
                          size={16}
                          style={{ color: "var(--text-muted)" }}
                        />
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Assigned to
                          </p>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text)" }}
                          >
                            {referral.assigned_psg_member.full_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  {referral.reason && (
                    <p
                      className="text-sm line-clamp-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {referral.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardClientWrapper>
  );
}
