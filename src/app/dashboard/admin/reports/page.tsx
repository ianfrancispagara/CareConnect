"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Loader } from "@/components/Loader";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAdminReports } from "@/hooks/useAdminReports";
import { ReportsTabs } from "./components/ReportsTabs";
import { ReportsFilters } from "./components/ReportsFilters";
import { ReportResults } from "./components/ReportResults";
import { ReportsEmptyState } from "./components/ReportsEmptyState";

const PAGE_SIZE = 10;

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ] as const;
}

export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const {
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
  } = useAdminReports();

  const totalRecords = useMemo(() => {
    if (activeTab === "appointments") return appointmentReports.length;
    if (activeTab === "referrals") return referralReports.length;
    if (activeTab === "sessions") return sessionReports.length;
    return usageReport ? 1 : 0;
  }, [
    activeTab,
    appointmentReports.length,
    referralReports.length,
    sessionReports.length,
    usageReport,
  ]);

  const shouldPaginate = activeTab !== "usage" && totalRecords > 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedAppointmentReports = useMemo(() => {
    if (activeTab !== "appointments") return appointmentReports;
    const start = (effectivePage - 1) * PAGE_SIZE;
    return appointmentReports.slice(start, start + PAGE_SIZE);
  }, [activeTab, appointmentReports, effectivePage]);

  const paginatedReferralReports = useMemo(() => {
    if (activeTab !== "referrals") return referralReports;
    const start = (effectivePage - 1) * PAGE_SIZE;
    return referralReports.slice(start, start + PAGE_SIZE);
  }, [activeTab, referralReports, effectivePage]);

  const paginatedSessionReports = useMemo(() => {
    if (activeTab !== "sessions") return sessionReports;
    const start = (effectivePage - 1) * PAGE_SIZE;
    return sessionReports.slice(start, start + PAGE_SIZE);
  }, [activeTab, sessionReports, effectivePage]);

  const pageItems = useMemo(
    () => getPaginationItems(effectivePage, totalPages),
    [effectivePage, totalPages],
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--text)" }}
          >
            Reports & Analytics
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Generate and export system reports
          </p>
        </div>

        <ReportsTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            setCurrentPage(1);
            setActiveTab(tab);
          }}
        />

        <ReportsFilters
          activeTab={activeTab}
          dateRange={dateRange}
          statusFilter={statusFilter}
          loading={loading}
          onDateRangeChange={(value) => {
            setCurrentPage(1);
            setDateRange(value);
          }}
          onStatusFilterChange={(value) => {
            setCurrentPage(1);
            setStatusFilter(value);
          }}
          onGenerateReport={() => {
            setCurrentPage(1);
            void handleGenerateReport();
          }}
        />

        {loading ? (
          <Loader text="Loading..." />
        ) : hasData ? (
          <ReportResults
            activeTab={activeTab}
            dateRange={dateRange}
            appointmentReports={appointmentReports}
            paginatedAppointmentReports={paginatedAppointmentReports}
            referralReports={referralReports}
            paginatedReferralReports={paginatedReferralReports}
            sessionReports={sessionReports}
            paginatedSessionReports={paginatedSessionReports}
            usageReport={usageReport}
            onDownloadPDF={handleDownloadPDF}
            onExportJSON={handleExport}
          />
        ) : (
          <ReportsEmptyState />
        )}

        {hasData && shouldPaginate && (
          <div className="mt-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Showing {(effectivePage - 1) * PAGE_SIZE + 1}-
              {Math.min(effectivePage * PAGE_SIZE, totalRecords)} of{" "}
              {totalRecords} records
            </p>

            <Pagination className="justify-end mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    className={
                      effectivePage === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>

                {pageItems.map((item, idx) => (
                  <PaginationItem key={`${item}-${idx}`}>
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={item === effectivePage}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    }}
                    className={
                      effectivePage === totalPages
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>
    </div>
  );
}
