"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardClientWrapper } from "@/components/DashboardClientWrapper";
import { Loader } from "@/components/Loader";
import { AlertCircle, CheckCircle, Clock, Eye } from "lucide-react";
import { ScreeningResult } from "@/lib/types/screening";
import { getScreeningResults } from "@/lib/actions/screening";

export default function PSGScreeningsPage() {
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("all");
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function fetchScreenings() {
      try {
        const response = await getScreeningResults();

        if (response.error || !response.data) {
          console.error("Error fetching screenings:", response.error);
          setScreenings([]);
        } else {
          setScreenings(response.data);
        }
      } catch (error) {
        console.error("Unexpected error fetching screenings:", error);
        setScreenings([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchScreenings();
  }, []);

  const filteredScreenings = screenings.filter((s) => {
    if (filter === "pending") return !s.reviewed_at;
    if (filter === "reviewed") return !!s.reviewed_at;
    return true;
  });

  // Create a map of screening ID to student number (based on creation date, oldest = 1)
  const screeningNumbers = new Map<string, number>();
  const allScreeningsSortedByDate = [...screenings].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  allScreeningsSortedByDate.forEach((screening, index) => {
    screeningNumbers.set(screening.id, index + 1);
  });

  const sortedScreenings = [...filteredScreenings].sort((a, b) => {
    // Sort by: date (newest first) - most recent at the top
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pendingCount = screenings.filter((s) => !s.reviewed_at).length;
  const highRiskCount = screenings.filter(
    (s) => s.color_code === "red" && !s.reviewed_at,
  ).length;
  const reviewedCount = screenings.filter((s) => !!s.reviewed_at).length;

  const getSeverityBadge = (colorCode: string) => {
    const getSeverityLabel = (code: string) => {
      if (code === "red") return "HIGH";
      if (code === "yellow") return "MODERATE";
      return "LOW";
    };

    const getBadgeColor = (code: string) => {
      switch (code) {
        case "red":
          return {
            bg: "var(--danger-20)",
            color: "var(--danger)",
            border: "var(--danger)",
          };
        case "yellow":
          return {
            bg: "var(--warning-20)",
            color: "var(--warning)",
            border: "var(--warning)",
          };
        default:
          return {
            bg: "var(--success-20)",
            color: "var(--success)",
            border: "var(--success)",
          };
      }
    };

    const colors = getBadgeColor(colorCode);

    return (
      <span
        className="inline-block text-xs font-semibold px-2 py-1 rounded"
        style={{
          background: colors.bg,
          color: colors.color,
          border: `1px solid ${colors.border}`,
        }}
      >
        {getSeverityLabel(colorCode)}
      </span>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const date = new Date(dateString).getTime();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <DashboardClientWrapper>
        <div className="min-h-screen" style={{ background: "var(--bg)" }}>
          <div className="flex items-center justify-center py-12">
            <Loader text="Loading screenings..." />
          </div>
        </div>
      </DashboardClientWrapper>
    );
  }

  return (
    <DashboardClientWrapper>
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--text)" }}
              >
                Student Screenings
              </h1>
              <p style={{ color: "var(--text-muted)" }}>
                Review and manage student mental health screening results
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <div
                className="rounded-lg p-6 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)]"
                style={{
                  background: "var(--bg-light)",
                  border: "1px solid var(--border-muted)",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)",
                }}
              >
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3
                    className="text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    Pending Reviews
                  </h3>
                  <Clock
                    className="h-4 w-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
                <div>
                  <div
                    className="text-base font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {pendingCount}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Awaiting your review
                  </p>
                </div>
              </div>

              <div
                className="rounded-lg p-6 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)]"
                style={{
                  background: "var(--bg-light)",
                  border: "1px solid var(--border-muted)",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)",
                }}
              >
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3
                    className="text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    High Risk Cases
                  </h3>
                  <AlertCircle
                    className="h-4 w-4"
                    style={{ color: "var(--danger)" }}
                  />
                </div>
                <div>
                  <div
                    className="text-base font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {highRiskCount}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Require immediate attention
                  </p>
                </div>
              </div>

              <div
                className="rounded-lg p-6 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)]"
                style={{
                  background: "var(--bg-light)",
                  border: "1px solid var(--border-muted)",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)",
                }}
              >
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3
                    className="text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    Total Reviewed
                  </h3>
                  <CheckCircle
                    className="h-4 w-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
                <div>
                  <div
                    className="text-base font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {reviewedCount}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Completed reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Screenings List */}
            <div
              className="rounded-lg"
              style={{
                background: "var(--bg-light)",
                border: "1px solid var(--border-muted)",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)",
              }}
            >
              <div
                className="p-6 border-b"
                style={{ borderColor: "var(--border-muted)" }}
              >
                <h2
                  className="text-base font-bold"
                  style={{ color: "var(--text)" }}
                >
                  Screening Results
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Click on a screening to view details and take action
                </p>
              </div>

              <div className="p-6">
                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setFilter("all")}
                    className="px-4 py-2 rounded-md text-sm font-medium transition"
                    style={{
                      background:
                        filter === "all"
                          ? "var(--primary)"
                          : "var(--bg-secondary)",
                      color:
                        filter === "all"
                          ? "var(--bg-dark)"
                          : "var(--text-muted)",
                    }}
                  >
                    All ({screenings.length})
                  </button>
                  <button
                    onClick={() => setFilter("pending")}
                    className="px-4 py-2 rounded-md text-sm font-medium transition"
                    style={{
                      background:
                        filter === "pending"
                          ? "var(--primary)"
                          : "var(--bg-secondary)",
                      color:
                        filter === "pending"
                          ? "var(--bg-dark)"
                          : "var(--text-muted)",
                    }}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setFilter("reviewed")}
                    className="px-4 py-2 rounded-md text-sm font-medium transition"
                    style={{
                      background:
                        filter === "reviewed"
                          ? "var(--primary)"
                          : "var(--bg-secondary)",
                      color:
                        filter === "reviewed"
                          ? "var(--bg-dark)"
                          : "var(--text-muted)",
                    }}
                  >
                    Reviewed ({reviewedCount})
                  </button>
                </div>

                {/* Screenings List */}
                <div className="space-y-3">
                  {sortedScreenings.length === 0 ? (
                    <div
                      className="text-center py-12"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No screenings found
                    </div>
                  ) : (
                    sortedScreenings.map((screening) => (
                      <div
                        key={screening.id}
                        className="rounded-lg p-4 border transition hover:bg-accent"
                        style={{
                          background: "var(--bg)",
                          borderColor: "var(--border-muted)",
                        }}
                      >
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex-1 space-y-1 w-full">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="font-medium"
                                style={{ color: "var(--text)" }}
                              >
                                Student {screeningNumbers.get(screening.id)}
                              </span>
                              {getSeverityBadge(screening.color_code)}
                              {!screening.reviewed_at && (
                                <span
                                  className="inline-block text-xs font-semibold px-2 py-1 rounded border"
                                  style={{
                                    background: "var(--primary-20)",
                                    color: "var(--primary)",
                                    borderColor: "var(--primary)",
                                  }}
                                >
                                  NEW
                                </span>
                              )}
                            </div>
                            <div
                              className="flex items-center gap-4 text-sm flex-wrap"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <span>Score: {screening.total_score}%</span>
                              {isMounted && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {formatTimeAgo(screening.created_at)}
                                  </span>
                                </>
                              )}
                              {screening.reviewed_at && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Reviewed
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/psg/screenings/${screening.id}`,
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition border shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.03)] w-full sm:w-auto"
                            style={{
                              borderColor: "var(--border)",
                              color: "var(--text)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "var(--primary)";
                              e.currentTarget.style.borderColor =
                                "var(--primary)";
                              e.currentTarget.style.color = "var(--bg-dark)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderColor =
                                "var(--border)";
                              e.currentTarget.style.color = "var(--text)";
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardClientWrapper>
  );
}
