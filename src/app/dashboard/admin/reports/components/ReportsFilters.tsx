"use client";

import { Filter } from "lucide-react";
import {
  APPOINTMENT_STATUS_OPTIONS,
  REFERRAL_STATUS_OPTIONS,
  shouldShowStatusFilter,
  type DateRange,
  type ReportTab,
} from "@/lib/utils/admin-reports";

type ReportsFiltersProps = {
  activeTab: ReportTab;
  dateRange: DateRange;
  statusFilter: string;
  loading: boolean;
  onDateRangeChange: (dateRange: DateRange) => void;
  onStatusFilterChange: (statusFilter: string) => void;
  onGenerateReport: () => void;
};

export function ReportsFilters({
  activeTab,
  dateRange,
  statusFilter,
  loading,
  onDateRangeChange,
  onStatusFilterChange,
  onGenerateReport,
}: ReportsFiltersProps) {
  return (
    <div
      className="p-6 rounded-lg mb-6"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5" style={{ color: "var(--primary)" }} />
        <h3 className="font-semibold" style={{ color: "var(--text)" }}>
          Report Filters
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label
            className="block mb-2 text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              onDateRangeChange({
                ...dateRange,
                startDate: e.target.value,
              })
            }
            className="w-full px-4 py-2 rounded-lg"
            style={{
              border: "1px solid var(--border-muted)",
              background: "var(--bg)",
              color: "var(--text)",
            }}
          />
        </div>

        <div>
          <label
            className="block mb-2 text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            End Date
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              onDateRangeChange({
                ...dateRange,
                endDate: e.target.value,
              })
            }
            className="w-full px-4 py-2 rounded-lg"
            style={{
              border: "1px solid var(--border-muted)",
              background: "var(--bg)",
              color: "var(--text)",
            }}
          />
        </div>

        {shouldShowStatusFilter(activeTab) && (
          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                border: "1px solid var(--border-muted)",
                background: "var(--bg)",
                color: "var(--text)",
              }}
            >
              <option value="all">All Statuses</option>
              {activeTab === "appointments" &&
                APPOINTMENT_STATUS_OPTIONS.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              {activeTab === "referrals" &&
                REFERRAL_STATUS_OPTIONS.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      <button
        onClick={onGenerateReport}
        disabled={loading}
        className="px-6 py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
        style={{
          background: "var(--primary)",
          color: "var(--bg-dark)",
        }}
      >
        {loading ? "Generating..." : "Generate Report"}
      </button>
    </div>
  );
}
