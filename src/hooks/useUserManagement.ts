"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllUsers,
  updateUser,
  blockPsgMember,
  unblockPsgMember,
  generatePsgInviteLink,
} from "@/actions/admin";
import { useAlert } from "@/hooks/useAlert";
import { filterUsers } from "@/lib/utils/admin-users";
import type { UserProfile, UserRole } from "@/types/admin";
import type { RoleFilter } from "@/lib/utils/admin-users";

type EditFormData = {
  full_name: string;
  school_id: string;
  role: UserRole;
};

const EMPTY_EDIT_FORM_DATA: EditFormData = {
  full_name: "",
  school_id: "",
  role: "student",
};

export function useUserManagement() {
  const { showAlert } = useAlert();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] =
    useState<EditFormData>(EMPTY_EDIT_FORM_DATA);

  const filteredUsers = useMemo(
    () => filterUsers(users, searchQuery, roleFilter),
    [users, searchQuery, roleFilter],
  );

  const resetSelection = useCallback(() => {
    setSelectedUser(null);
    setEditFormData(EMPTY_EDIT_FORM_DATA);
  }, []);

  const closeEditDialog = useCallback(() => {
    setShowEditDialog(false);
    resetSelection();
  }, [resetSelection]);

  const closeBlockDialog = useCallback(() => {
    setShowBlockDialog(false);
    setSelectedUser(null);
  }, []);

  const closeInviteDialog = useCallback(() => {
    setShowInviteDialog(false);
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const result = await getAllUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        showAlert({
          message: result.error || "Failed to load users",
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
  }, [showAlert]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleEditClick = useCallback(
    (user: UserProfile) => {
      if (user.role === "admin") {
        showAlert({
          message: "Admin accounts are SQL-managed and cannot be edited",
          type: "error",
          duration: 5000,
        });
        return;
      }

      setSelectedUser(user);
      setEditFormData({
        full_name: user.full_name,
        school_id: user.school_id || "",
        role: user.role,
      });
      setShowEditDialog(true);
    },
    [showAlert],
  );

  const handleEditSubmit = useCallback(async () => {
    if (!selectedUser) return;

    if (!editFormData.full_name.trim()) {
      showAlert({
        message: "Full name is required",
        type: "error",
        duration: 5000,
      });
      return;
    }

    try {
      setProcessing(true);
      const updates = {
        full_name: editFormData.full_name,
        school_id: editFormData.school_id || undefined,
      } as const;

      const result = await updateUser(selectedUser.id, {
        ...updates,
        ...(selectedUser.role !== "admin" ? { role: editFormData.role } : {}),
      });

      if (result.success) {
        showAlert({
          message: "User updated successfully!",
          type: "success",
          duration: 5000,
        });
        setShowEditDialog(false);
        resetSelection();
        await loadUsers();
      } else {
        showAlert({
          message: result.error || "Failed to update user",
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
      setProcessing(false);
    }
  }, [editFormData, loadUsers, resetSelection, selectedUser, showAlert]);

  const handleBlockClick = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    setShowBlockDialog(true);
  }, []);

  const handleBlockConfirm = useCallback(async () => {
    if (!selectedUser) return;

    if (selectedUser.role !== "psg_member" && selectedUser.role !== "student") {
      showAlert({
        message: "Only student and PSG accounts can be blocked",
        type: "error",
        duration: 5000,
      });
      return;
    }

    try {
      setProcessing(true);
      const result = selectedUser.is_blocked
        ? await unblockPsgMember(selectedUser.id)
        : await blockPsgMember(selectedUser.id);

      if (result.success) {
        showAlert({
          message: selectedUser.is_blocked
            ? "Account unblocked successfully!"
            : "Account blocked successfully!",
          type: "success",
          duration: 5000,
        });
        closeBlockDialog();
        await loadUsers();
      } else {
        showAlert({
          message:
            result.error ||
            (selectedUser.is_blocked
              ? "Failed to unblock account"
              : "Failed to block account"),
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
      setProcessing(false);
    }
  }, [closeBlockDialog, loadUsers, selectedUser, showAlert]);

  const handleGeneratePsgInvite = useCallback(async () => {
    try {
      setGeneratingInvite(true);
      const result = await generatePsgInviteLink();

      if (!result.success || !result.data) {
        showAlert({
          message: result.error || "Failed to generate PSG invite link",
          type: "error",
          duration: 5000,
        });
        return;
      }

      const { inviteLink, expiresAt } = result.data;
      setInviteLink(inviteLink);
      setInviteExpiresAt(expiresAt);
      setShowInviteDialog(true);
    } catch {
      showAlert({
        message: "An unexpected error occurred",
        type: "error",
        duration: 5000,
      });
    } finally {
      setGeneratingInvite(false);
    }
  }, [showAlert]);

  const handleCopyInviteLink = useCallback(async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      showAlert({
        message: "Invite link copied to clipboard",
        type: "success",
        duration: 4000,
      });
    } catch {
      showAlert({
        message: "Failed to copy invite link",
        type: "error",
        duration: 4000,
      });
    }
  }, [inviteLink, showAlert]);

  return {
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
  };
}
