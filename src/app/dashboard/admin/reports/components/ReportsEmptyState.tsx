"use client";

import { FileText } from "lucide-react";

export function ReportsEmptyState() {
  return (
    <div
      className="rounded-lg p-12 text-center"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      <FileText
        className="w-12 h-12 mx-auto mb-4"
        style={{ color: "var(--text-muted)" }}
      />
      <p
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--text)" }}
      >
        No Data Found
      </p>
      <p style={{ color: "var(--text-muted)" }}>
        No records match the current filters. Adjust filters and generate the
        report again.
      </p>
    </div>
  );
}
