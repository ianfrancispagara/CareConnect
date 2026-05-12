"use client";

import { Filter, RefreshCw, Search } from "lucide-react";
import {
  AUDIT_LIMIT_OPTIONS,
  type AuditActionSummary,
} from "@/lib/utils/admin-audit";

type AuditFiltersProps = {
  searchQuery: string;
  actionFilter: string;
  tableFilter: string;
  limit: number;
  uniqueActions: string[];
  uniqueTables: string[];
  summary: AuditActionSummary;
  onSearchChange: (value: string) => void;
  onActionFilterChange: (value: string) => void;
  onTableFilterChange: (value: string) => void;
  onLimitChange: (value: number) => void;
  onRefresh: () => void;
};

export function AuditFilters({
  searchQuery,
  actionFilter,
  tableFilter,
  limit,
  uniqueActions,
  uniqueTables,
  summary,
  onSearchChange,
  onActionFilterChange,
  onTableFilterChange,
  onLimitChange,
  onRefresh,
}: AuditFiltersProps) {
  return (
    <div
      className="p-4 rounded-lg mb-6"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5" style={{ color: "var(--primary)" }} />
        <h3 className="font-semibold" style={{ color: "var(--text)" }}>
          Filters
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border-muted)",
              color: "var(--text)",
            }}
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => onActionFilterChange(e.target.value)}
          className="px-4 py-2 rounded-lg"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border-muted)",
            color: "var(--text)",
          }}
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>

        <select
          value={tableFilter}
          onChange={(e) => onTableFilterChange(e.target.value)}
          className="px-4 py-2 rounded-lg"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border-muted)",
            color: "var(--text)",
          }}
        >
          <option value="all">All Tables</option>
          {uniqueTables.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>

        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="px-4 py-2 rounded-lg"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border-muted)",
            color: "var(--text)",
          }}
        >
          {AUDIT_LIMIT_OPTIONS.map((limitOption) => (
            <option key={limitOption.value} value={limitOption.value}>
              {limitOption.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          className="flex flex-wrap items-center gap-4 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <span>Total: {summary.total}</span>
          <span>Inserts: {summary.inserts}</span>
          <span>Updates: {summary.updates}</span>
          <span>Deletes: {summary.deletes}</span>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all"
          style={{
            background: "var(--primary-20)",
            color: "var(--primary)",
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>
  );
}
