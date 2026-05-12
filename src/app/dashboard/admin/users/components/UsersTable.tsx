"use client";

import { Edit, ShieldCheck, ShieldX, User } from "lucide-react";
import type { UserProfile } from "@/types/admin";
import {
  formatRoleChipLabel,
  getRoleColor,
  getRoleIcon,
} from "@/lib/utils/admin-users";

type UsersTableProps = {
  users: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onBlock: (user: UserProfile) => void;
};

export function UsersTable({ users, onEdit, onBlock }: UsersTableProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "var(--bg-light)",
        border: "1px solid var(--border-muted)",
      }}
    >
      {users.length === 0 ? (
        <div className="text-center py-12">
          <User
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
          />
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text)" }}
          >
            No Users Found
          </p>
          <p style={{ color: "var(--text-muted)" }}>
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  background: "var(--bg)",
                  borderBottom: "1px solid var(--border-muted)",
                }}
              >
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  User
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Email
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Student ID
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Role
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Joined
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const RoleIcon = getRoleIcon(user.role);
                const roleColor = getRoleColor(user.role);

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom:
                        idx < users.length - 1
                          ? "1px solid var(--border-muted)"
                          : "none",
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: "var(--bg)" }}
                        >
                          <User
                            className="w-5 h-5"
                            style={{ color: "var(--text-muted)" }}
                          />
                        </div>
                        <div>
                          <div
                            className="font-medium"
                            style={{ color: "var(--text)" }}
                          >
                            {user.full_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {user.email}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {user.school_id || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: roleColor.bg,
                          color: roleColor.text,
                        }}
                      >
                        <RoleIcon className="w-4 h-4" />
                        {formatRoleChipLabel(user.role)}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== "admin" && (
                          <button
                            onClick={() => onEdit(user)}
                            className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
                            style={{ background: "var(--primary-20)" }}
                            title="Edit user"
                          >
                            <Edit
                              className="w-4 h-4"
                              style={{ color: "var(--primary)" }}
                            />
                          </button>
                        )}
                        {(user.role === "psg_member" ||
                          user.role === "student") && (
                          <button
                            onClick={() => onBlock(user)}
                            className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
                            style={{
                              background: user.is_blocked
                                ? "var(--primary-20)"
                                : "var(--error-20)",
                            }}
                            title={
                              user.is_blocked
                                ? "Unblock account"
                                : "Block account"
                            }
                          >
                            {user.is_blocked ? (
                              <ShieldCheck
                                className="w-4 h-4"
                                style={{ color: "var(--primary)" }}
                              />
                            ) : (
                              <ShieldX
                                className="w-4 h-4"
                                style={{ color: "var(--error)" }}
                              />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
