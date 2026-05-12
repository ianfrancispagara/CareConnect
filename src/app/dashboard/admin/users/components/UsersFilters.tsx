"use client";

import { Search } from "lucide-react";
import type { UserProfile } from "@/types/admin";
import type { RoleFilter } from "@/lib/utils/admin-users";

type UsersFiltersProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (value: RoleFilter) => void;
  filteredUsers: UserProfile[];
};

export function UsersFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  filteredUsers,
}: UsersFiltersProps) {
  return (
    <div
      className="p-4 rounded-lg mb-6"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
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
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value as RoleFilter)}
          className="px-4 py-2 rounded-lg"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border-muted)",
            color: "var(--text)",
          }}
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="psg_member">PSG Members</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-4 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        <span>Total: {filteredUsers.length}</span>
        <span>
          Students: {filteredUsers.filter((u) => u.role === "student").length}
        </span>
        <span>
          PSG Members:{" "}
          {filteredUsers.filter((u) => u.role === "psg_member").length}
        </span>
        <span>
          Admins: {filteredUsers.filter((u) => u.role === "admin").length}
        </span>
      </div>
    </div>
  );
}
