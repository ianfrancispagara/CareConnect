"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardClientWrapper } from "@/components/DashboardClientWrapper";
import { ScreeningForm } from "@/components/screening/ScreeningForm";
import {
  ScreeningQuestion,
  QuestionResponse,
} from "@/lib/validations/screening";
import {
  submitScreening,
  getScreeningQuestions,
} from "@/lib/actions/screening";
import { useAlert } from "@/hooks/useAlert";
import { Loader } from "@/components/Loader";

export default function TakeScreeningPage() {
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    async function loadQuestions() {
      try {
        const response = await getScreeningQuestions();

        if (response.error || !response.data) {
          setError(response.error || "Failed to load questions");
          return;
        }

        setQuestions(response.data);
      } catch (err) {
        console.error("Error loading questions:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, []);

  const handleSubmit = async (responses: QuestionResponse[]) => {
    try {
      // Submit to Supabase
      const response = await submitScreening(responses);

      if (response.error) {
        showAlert({
          type: "error",
          message: `Failed to submit screening: ${response.error}`,
        });
        return;
      }

      // Clear any old sessionStorage data
      sessionStorage.removeItem("screeningResult");
      sessionStorage.removeItem("hasCaseAssessment");

      // Navigate to results page
      router.push("/dashboard/screening/results");
    } catch (error) {
      console.error("Error submitting screening:", error);
      showAlert({
        type: "error",
        message: "Failed to submit screening. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardClientWrapper>
        <div className="min-h-screen" style={{ background: "var(--bg)" }}>
          <div className="flex items-center justify-center py-12">
            <Loader text="Loading screening questions..." />
          </div>
        </div>
      </DashboardClientWrapper>
    );
  }

  if (error) {
    return (
      <DashboardClientWrapper>
        <div className="min-h-screen" style={{ background: "var(--bg)" }}>
          <div className="flex items-center justify-center py-12">
            <div
              className="p-6 rounded-lg border text-center max-w-md"
              style={{
                background: "var(--bg-light)",
                borderColor: "var(--border-muted)",
              }}
            >
              <p style={{ color: "var(--error)" }} className="mb-4">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-md font-medium text-sm transition hover:bg-success"
                style={{
                  background: "var(--primary)",
                  color: "var(--bg-dark)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--success)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--primary)";
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </DashboardClientWrapper>
    );
  }

  return (
    <DashboardClientWrapper>
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="py-12 px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto mb-8">
            <h1
              className="text-base font-bold mb-2"
              style={{ color: "var(--text)" }}
            >
              Mental Health Screening
            </h1>
            <p style={{ color: "var(--text-muted)" }}>
              This confidential screening will help us understand how
              you&apos;ve been feeling recently. Please answer honestly - there
              are no right or wrong answers.
            </p>
          </div>

          {/* Screening Form */}
          <ScreeningForm questions={questions} onSubmit={handleSubmit} />
        </div>
      </div>
    </DashboardClientWrapper>
  );
}
