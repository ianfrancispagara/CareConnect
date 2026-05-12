"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAppointmentReports,
  getReferralReports,
  getSessionReports,
  getUsageReport,
} from "@/actions/admin";
import { useAlert } from "@/hooks/useAlert";
import type {
  AppointmentReport,
  ReferralReport,
  SessionReport,
  UsageReport,
} from "@/types/admin";
import {
  buildReportFilters,
  downloadReportPdf,
  exportReportAsJson,
  hasReportData,
  INITIAL_DATE_RANGE,
  INITIAL_HAS_LOADED_DEFAULTS,
  type DateRange,
  type ReportCollections,
  type ReportTab,
} from "@/lib/utils/admin-reports";

export function useAdminReports() {
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<ReportTab>("appointments");
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE);
  const [statusFilter, setStatusFilter] = useState("all");

  const [appointmentReports, setAppointmentReports] = useState<
    AppointmentReport[]
  >([]);
  const [referralReports, setReferralReports] = useState<ReferralReport[]>([]);
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [usageReport, setUsageReport] = useState<UsageReport | null>(null);
  const [hasLoadedDefaults, setHasLoadedDefaults] = useState<
    Record<ReportTab, boolean>
  >(() => ({ ...INITIAL_HAS_LOADED_DEFAULTS }));

  const reports = useMemo<ReportCollections>(
    () => ({
      appointmentReports,
      referralReports,
      sessionReports,
      usageReport,
    }),
    [appointmentReports, referralReports, sessionReports, usageReport],
  );

  useEffect(() => {
    const loadDefaultReports = async () => {
      setLoading(true);
      try {
        const [appointmentsResult, referralsResult, sessionsResult] =
          await Promise.all([
            getAppointmentReports(),
            getReferralReports(),
            getSessionReports(),
          ]);

        if (appointmentsResult.success && appointmentsResult.data) {
          setAppointmentReports(appointmentsResult.data);
          setHasLoadedDefaults((prev) => ({ ...prev, appointments: true }));
        } else {
          showAlert({
            message: appointmentsResult.error || "Failed to load appointments",
            type: "error",
            duration: 5000,
          });
        }

        if (referralsResult.success && referralsResult.data) {
          setReferralReports(referralsResult.data);
          setHasLoadedDefaults((prev) => ({ ...prev, referrals: true }));
        } else {
          showAlert({
            message: referralsResult.error || "Failed to load referrals",
            type: "error",
            duration: 5000,
          });
        }

        if (sessionsResult.success && sessionsResult.data) {
          setSessionReports(sessionsResult.data);
          setHasLoadedDefaults((prev) => ({ ...prev, sessions: true }));
        } else {
          showAlert({
            message: sessionsResult.error || "Failed to load sessions",
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
    };

    void loadDefaultReports();
  }, [showAlert]);

  useEffect(() => {
    if (activeTab === "sessions" || activeTab === "usage") {
      setStatusFilter("all");
    }
  }, [activeTab]);

  useEffect(() => {
    const loadActiveTabDefaults = async () => {
      if (activeTab === "appointments" || hasLoadedDefaults[activeTab]) {
        return;
      }

      setLoading(true);
      try {
        if (activeTab === "usage") {
          const result = await getUsageReport();
          if (result.success && result.data) {
            setUsageReport(result.data);
            setHasLoadedDefaults((prev) => ({ ...prev, usage: true }));
          } else {
            showAlert({
              message: result.error || "Failed to load usage report",
              type: "error",
              duration: 5000,
            });
          }
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
    };

    void loadActiveTabDefaults();
  }, [activeTab, hasLoadedDefaults, showAlert]);

  const handleGenerateReport = useCallback(async () => {
    setLoading(true);

    try {
      const filters = buildReportFilters(activeTab, dateRange, statusFilter);
      let success = false;
      let errorMessage = "Failed to generate report";

      if (activeTab === "appointments") {
        const result = await getAppointmentReports(filters);
        if (result.success && result.data) {
          setAppointmentReports(result.data);
          success = true;
        } else {
          errorMessage = result.error || errorMessage;
        }
      } else if (activeTab === "referrals") {
        const result = await getReferralReports(filters);
        if (result.success && result.data) {
          setReferralReports(result.data);
          success = true;
        } else {
          errorMessage = result.error || errorMessage;
        }
      } else if (activeTab === "sessions") {
        const result = await getSessionReports(filters);
        if (result.success && result.data) {
          setSessionReports(result.data);
          success = true;
        } else {
          errorMessage = result.error || errorMessage;
        }
      } else {
        const result = await getUsageReport(
          dateRange.startDate || undefined,
          dateRange.endDate || undefined,
        );
        if (result.success && result.data) {
          setUsageReport(result.data);
          success = true;
          setHasLoadedDefaults((prev) => ({ ...prev, usage: true }));
        } else {
          errorMessage = result.error || errorMessage;
        }
      }

      if (success) {
        showAlert({
          message: "Report generated successfully!",
          type: "success",
          duration: 5000,
        });
      } else {
        showAlert({
          message: errorMessage,
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
  }, [activeTab, dateRange, showAlert, statusFilter]);

  const handleExport = useCallback(() => {
    exportReportAsJson(activeTab, reports, dateRange);

    showAlert({
      message: "Report exported successfully!",
      type: "success",
      duration: 5000,
    });
  }, [activeTab, dateRange, reports, showAlert]);

  const handleDownloadPDF = useCallback(() => {
    downloadReportPdf(activeTab, reports, dateRange);

    showAlert({
      message: "PDF downloaded successfully!",
      type: "success",
      duration: 5000,
    });
  }, [activeTab, dateRange, reports, showAlert]);

  const hasData = useMemo(
    () => hasReportData(activeTab, reports),
    [activeTab, reports],
  );

  return {
    activeTab,
    loading,
    dateRange,
    statusFilter,
    appointmentReports,
    referralReports,
    sessionReports,
    usageReport,
    hasData,
    setActiveTab,
    setDateRange,
    setStatusFilter,
    handleGenerateReport,
    handleExport,
    handleDownloadPDF,
  };
}
