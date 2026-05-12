"use client";

import { Shield } from "lucide-react";

export function AuditInfoPanel() {
  return (
    <div
      className="mt-6 p-4 rounded-lg"
      style={{
        background: "var(--primary-20)",
        border: "1px solid var(--primary)",
      }}
    >
      <div className="flex items-start gap-3">
        <Shield
          className="w-5 h-5 mt-0.5"
          style={{ color: "var(--primary)" }}
        />
        <div>
          <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>
            About Audit Logs
          </h4>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Audit logs automatically track all database changes including
            inserts, updates, and deletes. Each entry records the user who made
            the change, the affected table and record, and details about the
            modification. This provides a complete audit trail for compliance
            and security purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
