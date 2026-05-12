import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Shield, Users, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserProfile, UserRole } from "@/types/admin";

export type RoleFilter = UserRole | "all";

type RoleBadgeColor = {
  bg: string;
  text: string;
};

export function filterUsers(
  users: UserProfile[],
  searchQuery: string,
  roleFilter: RoleFilter,
): UserProfile[] {
  const roleFilteredUsers =
    roleFilter === "all"
      ? users
      : users.filter((user) => user.role === roleFilter);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    return roleFilteredUsers;
  }

  return roleFilteredUsers.filter((user) => {
    return (
      user.full_name.toLowerCase().includes(normalizedQuery) ||
      user.email.toLowerCase().includes(normalizedQuery) ||
      user.school_id?.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getRoleIcon(role: UserRole): LucideIcon {
  switch (role) {
    case "admin":
      return Shield;
    case "psg_member":
      return Users;
    default:
      return GraduationCap;
  }
}

export function getRoleColor(role: UserRole): RoleBadgeColor {
  switch (role) {
    case "admin":
      return { bg: "var(--error-20)", text: "var(--error)" };
    case "psg_member":
      return { bg: "var(--primary-20)", text: "var(--primary)" };
    default:
      return { bg: "var(--success-20)", text: "var(--success)" };
  }
}

export function formatRoleChipLabel(role: UserRole): string {
  return role.replace("_", " ").toUpperCase();
}

type UsersPdfFilters = {
  searchQuery: string;
  roleFilter: RoleFilter;
};

export function downloadUsersPdf(
  users: UserProfile[],
  filters: UsersPdfFilters,
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setTextColor(40, 150, 80);
  doc.text("CareConnect", 14, 15);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("User Account Management", 14, 22);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("User Directory Report", 14, 35);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);
  doc.text(`Records: ${users.length}`, 14, 48);
  doc.text(
    `Filters: query=${filters.searchQuery || "none"}, role=${filters.roleFilter}`,
    14,
    54,
  );

  autoTable(doc, {
    startY: 62,
    head: [["Name", "Email", "Student ID", "Role", "Joined"]],
    body: users.map((user) => [
      user.full_name,
      user.email,
      user.school_id || "N/A",
      formatRoleChipLabel(user.role),
      new Date(user.created_at).toLocaleDateString(),
    ]),
    theme: "grid",
    headStyles: { fillColor: [40, 150, 80] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 62 },
      2: { cellWidth: 28 },
      3: { cellWidth: 24 },
      4: { cellWidth: 24 },
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
  doc.save(`users_${datePart}_${timePart}.pdf`);
}
