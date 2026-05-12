import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AuditLog } from "@/types/admin";

type ActionBadgeStyle = {
  bg: string;
  text: string;
};

export type AuditActionSummary = {
  total: number;
  inserts: number;
  updates: number;
  deletes: number;
};

export const AUDIT_LIMIT_OPTIONS = [
  { value: 50, label: "Last 50" },
  { value: 100, label: "Last 100" },
  { value: 250, label: "Last 250" },
  { value: 500, label: "Last 500" },
] as const;

export function filterAuditLogs(
  logs: AuditLog[],
  searchQuery: string,
  actionFilter: string,
  tableFilter: string,
): AuditLog[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return logs.filter((log) => {
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesTable =
      tableFilter === "all" || log.table_name === tableFilter;

    if (!normalizedQuery) {
      return matchesAction && matchesTable;
    }

    const matchesQuery =
      log.user_name.toLowerCase().includes(normalizedQuery) ||
      log.user_email.toLowerCase().includes(normalizedQuery) ||
      log.action.toLowerCase().includes(normalizedQuery) ||
      log.table_name.toLowerCase().includes(normalizedQuery);

    return matchesAction && matchesTable && matchesQuery;
  });
}

export function getUniqueAuditActions(logs: AuditLog[]): string[] {
  return Array.from(new Set(logs.map((log) => log.action)));
}

export function getUniqueAuditTables(logs: AuditLog[]): string[] {
  return Array.from(new Set(logs.map((log) => log.table_name)));
}

export function getActionColor(action: string): ActionBadgeStyle {
  switch (action.toUpperCase()) {
    case "INSERT":
      return { bg: "var(--success-20)", text: "var(--success)" };
    case "UPDATE":
      return { bg: "var(--primary-20)", text: "var(--primary)" };
    case "DELETE":
      return { bg: "var(--error-20)", text: "var(--error)" };
    default:
      return { bg: "var(--text-muted)", text: "var(--text)" };
  }
}

export function getAuditActionSummary(logs: AuditLog[]): AuditActionSummary {
  return {
    total: logs.length,
    inserts: logs.filter((log) => log.action === "INSERT").length,
    updates: logs.filter((log) => log.action === "UPDATE").length,
    deletes: logs.filter((log) => log.action === "DELETE").length,
  };
}

export function formatAuditRecordId(recordId?: string): string {
  return recordId ? recordId.substring(0, 8) : "N/A";
}

export function stringifyAuditDetails(
  details?: Record<string, unknown>,
  pretty = false,
): string {
  if (!details) {
    return "N/A";
  }

  return JSON.stringify(details, null, pretty ? 2 : undefined);
}

type AuditPdfFilters = {
  searchQuery: string;
  actionFilter: string;
  tableFilter: string;
};

export function downloadAuditLogsPdf(
  logs: AuditLog[],
  filters: AuditPdfFilters,
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setTextColor(40, 150, 80);
  doc.text("CareConnect", 14, 15);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("System Audit Logs", 14, 22);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Audit Log Report", 14, 35);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);
  doc.text(`Records: ${logs.length}`, 14, 48);
  doc.text(
    `Filters: query=${filters.searchQuery || "none"}, action=${filters.actionFilter}, table=${filters.tableFilter}`,
    14,
    54,
  );

  autoTable(doc, {
    startY: 62,
    head: [["Timestamp", "User", "Action", "Table"]],
    body: logs.map((log) => [
      new Date(log.created_at).toLocaleString(),
      `${log.user_name} (${log.user_email})`,
      log.action,
      log.table_name,
    ]),
    theme: "grid",
    headStyles: { fillColor: [40, 150, 80] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 68 },
      2: { cellWidth: 30 },
      3: { cellWidth: 44 },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    doc.setPage(pageIndex);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${pageIndex} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
  }

  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  doc.save(`audit_logs_${datePart}_${timePart}.pdf`);
}
