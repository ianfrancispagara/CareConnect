"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "@/actions/admin";
import { useAlert } from "@/hooks/useAlert";
import type { AuditLog } from "@/types/admin";
import {
  filterAuditLogs,
  getAuditActionSummary,
  getUniqueAuditActions,
  getUniqueAuditTables,
} from "@/lib/utils/admin-audit";

const DEFAULT_LIMIT = 100;

export function useAuditLogs() {
  const { showAlert } = useAlert();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAuditLogs(limit);

      if (result.success && result.data) {
        setLogs(result.data);
      } else {
        showAlert({
          message: result.error || "Failed to load audit logs",
          type: "error",
          duration: 5000,
        });
      }
    } catch {
      showAlert({
        message: "An unexpected error occurred",
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [limit, showAlert]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(
    () => filterAuditLogs(logs, searchQuery, actionFilter, tableFilter),
    [logs, searchQuery, actionFilter, tableFilter],
  );

  const uniqueActions = useMemo(() => getUniqueAuditActions(logs), [logs]);
  const uniqueTables = useMemo(() => getUniqueAuditTables(logs), [logs]);
  const summary = useMemo(
    () => getAuditActionSummary(filteredLogs),
    [filteredLogs],
  );

  return {
    filteredLogs,
    loading,
    searchQuery,
    actionFilter,
    tableFilter,
    limit,
    uniqueActions,
    uniqueTables,
    summary,
    setSearchQuery,
    setActionFilter,
    setTableFilter,
    setLimit,
    loadLogs,
  };
}
