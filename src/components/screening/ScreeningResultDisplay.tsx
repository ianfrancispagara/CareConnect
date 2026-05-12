"use client";

import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import type { ScreeningResult } from "@/lib/types/screening";

type ScreeningResultDisplayProps = {
  result: ScreeningResult;
  onStartAssessment?: () => void;
};

export function ScreeningResultDisplay({
  result,
  onStartAssessment,
}: ScreeningResultDisplayProps) {
  const getSeverityConfig = () => {
    switch (result.color_code) {
      case "green":
        return {
          icon: CheckCircle2,
          color: "#10B981",
          bgColor: "#D1FAE5",
          title: "Low Risk",
          message:
            "Your screening indicates low levels of distress. Continue practicing self-care and reach out if you need support.",
        };
      case "yellow":
        return {
          icon: AlertTriangle,
          color: "#F59E0B",
          bgColor: "#FEF3C7",
          title: "Moderate Risk",
          message:
            "Your screening indicates moderate levels of distress. We recommend scheduling a session with a PSG member for further support.",
        };
      case "red":
        return {
          icon: AlertCircle,
          color: "#EF4444",
          bgColor: "#FEE2E2",
          title: "High Risk",
          message:
            "Your screening indicates high levels of distress. We strongly recommend immediate support. A PSG member will reach out to you soon.",
        };
      default:
        return {
          icon: AlertCircle,
          color: "#6B7280",
          bgColor: "#F3F4F6",
          title: "Unknown",
          message: "Unable to determine severity level.",
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <div className="w-full">
      {/* Result Card */}
      <div
        className="p-8 rounded-lg mb-6"
        style={{
          background: "var(--bg-light)",
          boxShadow: "0 2px 16px 0 var(--border-muted)",
        }}
      >
        {/* Severity Indicator */}
        <div
          className="p-6 rounded-lg mb-6 text-center"
          style={{ background: config.bgColor }}
        >
          <Icon
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: config.color }}
          />
          <h2
            className="text-3xl font-bold mb-2"
            style={{ color: config.color }}
          >
            {config.title}
          </h2>
          <p className="text-lg" style={{ color: "#374151" }}>
            {config.message}
          </p>
        </div>

        {/* Score Details */}
        <div className="mb-6">
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: "var(--text)" }}
          >
            Assessment Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Total Score
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--text)" }}
              >
                {result.total_score.toFixed(1)}
              </p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Severity Level
              </p>
              <p
                className="text-2xl font-bold capitalize"
                style={{ color: config.color }}
              >
                {result.color_code === "red"
                  ? "High"
                  : result.color_code === "yellow"
                  ? "Moderate"
                  : "Low"}
              </p>
            </div>
          </div>
        </div>

        {/* Immediate Attention Warning */}
        {result.requires_immediate_attention && (
          <div
            className="p-4 rounded-lg mb-6 flex items-start gap-3"
            style={{ background: "#FEE2E2", border: "1px solid #EF4444" }}
          >
            <AlertCircle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: "#EF4444" }}
            />
            <div>
              <p className="font-semibold" style={{ color: "#991B1B" }}>
                Immediate Attention Required
              </p>
              <p className="text-sm mt-1" style={{ color: "#991B1B" }}>
                Based on your responses, we recommend immediate support. Please
                reach out to the OCCS or contact emergency services if
                you&apos;re in crisis.
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations && (
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text)" }}
            >
              Recommendations
            </h3>
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <p style={{ color: "var(--text)" }}>{result.recommendations}</p>
            </div>
          </div>
        )}

        {/* Review Status */}
        {result.reviewed_by && result.reviewed_at && (
          <div
            className="p-4 rounded-lg flex items-center gap-2"
            style={{ background: "#D1FAE5", border: "1px solid #10B981" }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: "#10B981" }} />
            <p className="text-sm" style={{ color: "#065F46" }}>
              Reviewed by PSG member on{" "}
              {new Date(result.reviewed_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onStartAssessment && (
          <button
            onClick={onStartAssessment}
            className="flex-1 py-3 px-6 rounded-lg font-medium transition flex items-center justify-center gap-2"
            style={{
              background: "var(--primary)",
              color: "var(--bg-dark)",
            }}
          >
            <MessageSquare className="w-5 h-5" />
            Start Case Assessment
          </button>
        )}
      </div>

      {/* Support Resources */}
      <div
        className="mt-6 p-6 rounded-lg"
        style={{
          background: "var(--bg-light)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text)" }}
        >
          Support Resources
        </h3>
        <ul className="space-y-2" style={{ color: "var(--text-muted)" }}>
          <li>• CSU Office of Counseling and Career Services (OCCS)</li>
          <li>• National Mental Health Crisis Hotline: 1553</li>
          <li>• In Touch Community Services: 09178001123</li>
          <li>• Emergency Services: 911</li>
        </ul>
      </div>
    </div>
  );
}
