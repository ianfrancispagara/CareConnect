"use client";

import { REPORT_TABS, type ReportTab } from "@/lib/utils/admin-reports";

type ReportsTabsProps = {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
};

export function ReportsTabs({ activeTab, onTabChange }: ReportsTabsProps) {
  return (
    <div
      className="flex flex-wrap gap-2 mb-6 p-1 rounded-lg"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      {REPORT_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              background: isActive ? "var(--primary)" : "transparent",
              color: isActive ? "var(--bg-dark)" : "var(--text-muted)",
            }}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
