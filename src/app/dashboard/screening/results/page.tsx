"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardClientWrapper } from "@/components/DashboardClientWrapper";
import { ScreeningResultDisplay } from "@/components/screening/ScreeningResultDisplay";
import { ScreeningResult } from "@/lib/types/screening";
import { getLatestScreeningResult } from "@/lib/actions/screening";
import { MessageSquare, Calendar, RotateCcw } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

export default function ScreeningResultsPage() {
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCaseAssessment, setHasCaseAssessment] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    async function fetchScreeningResult() {
      try {
        const response = await getLatestScreeningResult();

        if (response.error || !response.data) {
          setError(response.error || "Failed to load screening result");
          setIsLoading(false);
          // Redirect to take screening if no results found
          setTimeout(() => {
            router.push("/dashboard/screening/take");
          }, 2000);
          return;
        }

        setResult(response.data);

        // Check if case assessment was already started (from sessionStorage for now)
        const caseAssessmentStatus =
          sessionStorage.getItem("hasCaseAssessment");
        if (caseAssessmentStatus === "true") {
          setHasCaseAssessment(true);
        }
      } catch (err) {
        console.error("Error fetching screening result:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchScreeningResult();
  }, [router]);
  const handleStartCaseAssessment = async () => {
    if (!result?.id) return;

    setIsCreatingAssessment(true);
    try {
      // Mark that user has started case assessment
      setHasCaseAssessment(true);
      sessionStorage.setItem("hasCaseAssessment", "true");
      sessionStorage.setItem("startAssessmentFlow", "true");
      // Dispatch event to update chat widget
      window.dispatchEvent(new Event("caseAssessmentChanged"));

      showAlert({
        type: "success",
        message:
          "Opening chat for case assessment. Please answer the questions to help us understand your situation better.",
        duration: 5000,
      });

      // Small delay to ensure chat widget is enabled before opening
      setTimeout(() => {
        window.dispatchEvent(new Event("openChatForAssessment"));
      }, 100);
    } catch (error) {
      console.error("Error starting case assessment:", error);
      showAlert({
        type: "error",
        message: "Failed to start case assessment. Please try again.",
      });
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  const handleTakeAnother = () => {
    // Clear the stored result and case assessment flag
    sessionStorage.removeItem("screeningResult");
    sessionStorage.removeItem("hasCaseAssessment");
    router.push("/dashboard/screening/take");
  };

  if (isLoading) {
    return (
      <DashboardClientWrapper>
        <div className="min-h-screen" style={{ background: "var(--bg)" }}>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div
              className="p-8 text-center rounded-xl border shadow"
              style={{
                background: "var(--bg-light)",
                borderColor: "var(--border-muted)",
              }}
            >
              <p style={{ color: "var(--text-muted)" }}>
                Loading your results...
              </p>
            </div>
          </main>
        </div>
      </DashboardClientWrapper>
    );
  }

  if (error) {
    return (
      <DashboardClientWrapper>
        <div className="min-h-screen" style={{ background: "var(--bg)" }}>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div
              className="p-8 text-center rounded-xl border shadow"
              style={{
                background: "var(--bg-light)",
                borderColor: "var(--border-muted)",
              }}
            >
              <p style={{ color: "var(--error)" }}>{error}</p>
              <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
                Redirecting to screening form...
              </p>
            </div>
          </main>
        </div>
      </DashboardClientWrapper>
    );
  }

  if (!result) {
    return null; // Will redirect in useEffect
  }

  return (
    <DashboardClientWrapper>
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Centered Header Above Card */}
            <div className="flex flex-col items-center mb-2">
              <h1
                className="text-base font-bold tracking-tight text-center"
                style={{ color: "var(--text)" }}
              >
                Screening Results
              </h1>
              <p
                className="text-sm text-center mb-10"
                style={{ color: "var(--text-muted)" }}
              >
                Your mental health screening has been completed
              </p>
            </div>

            <ScreeningResultDisplay result={result} />

            {/* Next Steps and Info Cards Container */}
            <div className="space-y-6">
              <div
                className="rounded-lg border p-6 space-y-4"
                style={{
                  background: "var(--bg-light)",
                  borderColor: "var(--border-muted)",
                }}
              >
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    Next Steps
                  </h2>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    What would you like to do next?
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Based on your screening results, you must:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span
                        style={{ color: "var(--primary)" }}
                        className="mt-0.5"
                      >
                        1.
                      </span>
                      <span style={{ color: "var(--text)" }}>
                        <strong>Start a case assessment</strong> - Connect with
                        a PSG member who can provide personalized support and
                        guidance (Required first)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span
                        style={{ color: "var(--text-muted)" }}
                        className="mt-0.5"
                      >
                        2.
                      </span>
                      <span style={{ color: "var(--text)" }}>
                        <strong>Book an appointment</strong> - Schedule a
                        one-on-one session with a peer support specialist
                        (Available after case assessment)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span
                        style={{ color: "var(--text-muted)" }}
                        className="mt-0.5"
                      >
                        •
                      </span>
                      <span style={{ color: "var(--text)" }}>
                        <strong>Access resources</strong> - Explore mental
                        health resources and self-help materials
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleStartCaseAssessment}
                    disabled={hasCaseAssessment || isCreatingAssessment}
                    className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium text-sm transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: hasCaseAssessment
                        ? "var(--bg-secondary)"
                        : "var(--primary)",
                      color: hasCaseAssessment
                        ? "var(--text-muted)"
                        : "var(--bg-dark)",
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {isCreatingAssessment
                      ? "Starting..."
                      : hasCaseAssessment
                        ? "Case Assessment Started"
                        : "Start Case Assessment"}
                  </button>
                  <button
                    onClick={() => {
                      if (!hasCaseAssessment) {
                        showAlert({
                          type: "warning",
                          message:
                            "Please start a case assessment first before booking an appointment.",
                        });
                        return;
                      }
                      router.push("/dashboard/appointments");
                    }}
                    disabled={!hasCaseAssessment}
                    className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium text-sm transition border disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.03)]"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                    }}
                    onMouseEnter={(e) => {
                      if (!hasCaseAssessment) return;
                      e.currentTarget.style.background = "var(--primary)";
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.color = "var(--bg-dark)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg)";
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text)";
                    }}
                    title={
                      !hasCaseAssessment
                        ? "Please start a case assessment first"
                        : ""
                    }
                  >
                    <Calendar className="h-4 w-4" />
                    Book Appointment
                  </button>
                  <button
                    onClick={handleTakeAnother}
                    className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium text-sm transition shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.03)]"
                    style={{
                      color: "var(--text)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary)";
                      e.currentTarget.style.color = "var(--bg-dark)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text)";
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Take Another Screening
                  </button>
                </div>
              </div>

              <div
                className="py-4 px-6 rounded-lg"
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                  background: "var(--bg-light)",
                  border: "1px solid var(--border-muted)",
                  textAlign: "justify",
                }}
              >
                <p>
                  Your screening result is <strong>anonymous</strong> and{" "}
                  <strong>confidential</strong>.<br />
                  Only authorized PSG members can review your responses to
                  provide support. Your identity will never be shared outside
                  the support team.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardClientWrapper>
  );
}
