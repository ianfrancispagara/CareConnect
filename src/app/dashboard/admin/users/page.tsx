"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useUserManagement } from "@/hooks/useUserManagement";
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
import { downloadUsersPdf } from "@/lib/utils/admin-users";
import { UsersFilters } from "./components/UsersFilters";
import { UsersTable } from "./components/UsersTable";
import { EditUserDialog } from "./components/EditUserDialog";
import { BlockPsgDialog } from "./components/BlockPsgDialog";
import { InviteLinkDialog } from "./components/InviteLinkDialog";
import { ArrowLeft, Download, Link as LinkIcon } from "lucide-react";

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

export default function UserManagementPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    filteredUsers,
    loading,
    processing,
    generatingInvite,
    showInviteDialog,
    inviteLink,
    inviteExpiresAt,
    searchQuery,
    roleFilter,
    showEditDialog,
    showBlockDialog,
    selectedUser,
    editFormData,
    setSearchQuery,
    setRoleFilter,
    setEditFormData,
    handleEditClick,
    handleEditSubmit,
    handleBlockClick,
    handleBlockConfirm,
    handleGeneratePsgInvite,
    handleCopyInviteLink,
    closeEditDialog,
    closeBlockDialog,
    closeInviteDialog,
  } = useUserManagement();

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (effectivePage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [effectivePage, filteredUsers]);

  const pageItems = useMemo(
    () => getPaginationItems(effectivePage, totalPages),
    [effectivePage, totalPages],
  );

  const handleExportPdf = () => {
    downloadUsersPdf(filteredUsers, {
      searchQuery,
      roleFilter,
    });
  };

  if (loading) {
    return <Loader fullScreen text="Loading..." />;
  }

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

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1
              className="text-lg font-bold mb-2"
              style={{ color: "var(--text)" }}
            >
              User Management
            </h1>
            <p style={{ color: "var(--text-muted)" }}>
              Manage system users, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePsgInvite}
              disabled={generatingInvite}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "var(--success-20)",
                color: "var(--success)",
              }}
            >
              <LinkIcon className="w-4 h-4" />
              {generatingInvite ? "Generating..." : "Generate PSG Invite"}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={filteredUsers.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "var(--primary-20)",
                color: "var(--primary)",
              }}
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        <UsersFilters
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setCurrentPage(1);
            setSearchQuery(value);
          }}
          roleFilter={roleFilter}
          onRoleFilterChange={(value) => {
            setCurrentPage(1);
            setRoleFilter(value);
          }}
          filteredUsers={filteredUsers}
        />

        <UsersTable
          users={paginatedUsers}
          onEdit={handleEditClick}
          onBlock={handleBlockClick}
        />

        {filteredUsers.length > 0 && (
          <div className="mt-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Showing {(effectivePage - 1) * PAGE_SIZE + 1}-
              {Math.min(effectivePage * PAGE_SIZE, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
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

        {showEditDialog && selectedUser && (
          <EditUserDialog
            selectedUser={selectedUser}
            editFormData={editFormData}
            processing={processing}
            setEditFormData={setEditFormData}
            onSubmit={handleEditSubmit}
            onClose={closeEditDialog}
          />
        )}

        {showBlockDialog && selectedUser && (
          <BlockPsgDialog
            selectedUser={selectedUser}
            processing={processing}
            onConfirm={handleBlockConfirm}
            onClose={closeBlockDialog}
          />
        )}

        {showInviteDialog && (
          <InviteLinkDialog
            inviteLink={inviteLink}
            inviteExpiresAt={inviteExpiresAt}
            onCopy={handleCopyInviteLink}
            onClose={closeInviteDialog}
          />
        )}
      </main>
    </div>
  );
}
