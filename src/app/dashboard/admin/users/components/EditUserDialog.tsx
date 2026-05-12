import type { UserProfile, UserRole } from "@/types/admin";

type EditFormData = {
  full_name: string;
  school_id: string;
  role: UserRole;
};

type EditUserDialogProps = {
  selectedUser: UserProfile;
  editFormData: EditFormData;
  processing: boolean;
  setEditFormData: (data: EditFormData) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function EditUserDialog({
  selectedUser,
  editFormData,
  processing,
  setEditFormData,
  onSubmit,
  onClose,
}: EditUserDialogProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="rounded-lg p-6 max-w-md w-full"
        style={{
          background: "var(--bg-light)",
          border: "1px solid var(--border-muted)",
        }}
      >
        <h3
          className="text-base font-bold mb-4"
          style={{ color: "var(--text)" }}
        >
          Edit User
        </h3>
        <div className="space-y-4">
          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={editFormData.full_name}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  full_name: e.target.value,
                })
              }
              className="w-full px-4 py-2 rounded-lg"
              style={{
                border: "1px solid var(--border-muted)",
                background: "var(--bg)",
                color: "var(--text)",
              }}
            />
          </div>
          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Student ID (optional)
            </label>
            <input
              type="text"
              value={editFormData.school_id}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  school_id: e.target.value,
                })
              }
              className="w-full px-4 py-2 rounded-lg"
              style={{
                border: "1px solid var(--border-muted)",
                background: "var(--bg)",
                color: "var(--text)",
              }}
            />
          </div>
          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Role
            </label>
            {selectedUser.role === "admin" ? (
              <div
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  border: "1px solid var(--border-muted)",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              >
                Admin (SQL-managed)
              </div>
            ) : (
              <select
                value={editFormData.role}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    role: e.target.value as UserRole,
                  })
                }
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  border: "1px solid var(--border-muted)",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              >
                <option value="student">Student</option>
                <option value="psg_member">PSG Member</option>
              </select>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSubmit}
            disabled={processing}
            className="flex-1 px-6 py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
            style={{
              background: "var(--primary)",
              color: "var(--bg-dark)",
            }}
          >
            {processing ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            disabled={processing}
            className="px-6 py-2 rounded-lg transition-all"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border-muted)",
              color: "var(--text)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
