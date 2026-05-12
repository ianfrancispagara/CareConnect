type InviteLinkDialogProps = {
  inviteLink: string;
  inviteExpiresAt: string;
  onCopy: () => void;
  onClose: () => void;
};

export function InviteLinkDialog({
  inviteLink,
  inviteExpiresAt,
  onCopy,
  onClose,
}: InviteLinkDialogProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="rounded-lg p-6 max-w-lg w-full"
        style={{
          background: "var(--bg-light)",
          border: "1px solid var(--border-muted)",
        }}
      >
        <h3
          className="text-base font-bold mb-3"
          style={{ color: "var(--text)" }}
        >
          PSG Invite Link
        </h3>

        <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
          Share this link with the PSG member. It expires on{" "}
          {new Date(inviteExpiresAt).toLocaleString()}.
        </p>

        <div
          className="w-full px-3 py-2 rounded-lg mb-4 break-all text-sm"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border-muted)",
            color: "var(--text)",
          }}
        >
          {inviteLink}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCopy}
            className="flex-1 px-6 py-2 rounded-lg hover:opacity-90 transition-all"
            style={{
              background: "var(--primary)",
              color: "var(--bg-dark)",
            }}
          >
            Copy Link
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg transition-all"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border-muted)",
              color: "var(--text)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
