"use client";

import { FileText } from "lucide-react";
import type { AuditLog } from "@/types/admin";
import { getActionColor } from "@/lib/utils/admin-audit";

type AuditLogsTableProps = {
  logs: AuditLog[];
};

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <FileText
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
          />
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text)" }}
          >
            No Audit Logs Found
          </p>
          <p style={{ color: "var(--text-muted)" }}>
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  background: "var(--bg)",
                  borderBottom: "1px solid var(--border-muted)",
                }}
              >
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Timestamp
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  User
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Action
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Table
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                const actionColor = getActionColor(log.action);

                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom:
                        idx < logs.length - 1
                          ? "1px solid var(--border-muted)"
                          : "none",
                    }}
                  >
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div
                          className="font-medium text-sm"
                          style={{ color: "var(--text)" }}
                        >
                          {log.user_name}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {log.user_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: actionColor.bg,
                          color: actionColor.text,
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-mono"
                      style={{ color: "var(--text)" }}
                    >
                      {log.table_name}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
