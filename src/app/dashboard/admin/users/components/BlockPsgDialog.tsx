import type { UserProfile } from "@/types/admin";

type BlockPsgDialogProps = {
  selectedUser: UserProfile;
  processing: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function BlockPsgDialog({
  selectedUser,
  processing,
  onConfirm,
  onClose,
}: BlockPsgDialogProps) {
  const isBlocked = selectedUser.is_blocked;
  const roleLabel = selectedUser.role === "student" ? "Student" : "PSG Member";

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
          {isBlocked ? `Unblock ${roleLabel}` : `Block ${roleLabel}`}
        </h3>
        <p className="mb-4" style={{ color: "var(--text-muted)" }}>
          {isBlocked ? (
            <>
              Are you sure you want to unblock{" "}
              <strong>{selectedUser.full_name}</strong>? This will allow the{" "}
              {roleLabel.toLowerCase()} to sign in again.
            </>
          ) : (
            <>
              Are you sure you want to block{" "}
              <strong>{selectedUser.full_name}</strong>? This will prevent sign
              in and deactivate all active availability slots.
            </>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 px-6 py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
            style={{
              background: isBlocked ? "var(--primary)" : "var(--error)",
              color: "var(--bg-dark)",
            }}
          >
            {processing
              ? isBlocked
                ? "Unblocking..."
                : "Blocking..."
              : isBlocked
                ? `Unblock ${roleLabel}`
                : `Block ${roleLabel}`}
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
