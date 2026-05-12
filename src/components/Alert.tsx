"use client";

import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

type AlertProps = {
  type: "success" | "error" | "info" | "warning";
  message: string;
  onClose?: () => void;
};

export function Alert({ type, message, onClose }: AlertProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  };

  const backgrounds = {
    success: "var(--success)",
    error: "var(--danger)",
    info: "var(--info)",
    warning: "var(--warning)",
  };

  const Icon = icons[type];

  return (
    <div
      className="mb-6 p-4 rounded-lg flex items-start gap-3"
      style={{
        background: backgrounds[type],
        border: "1px solid var(--border)",
      }}
    >
      <Icon
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        style={{ color: "var(--bg-dark)" }}
      />
      <p className="text-sm flex-1" style={{ color: "var(--bg-dark)" }}>
        {message}
      </p>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2"
          style={{ color: "var(--bg-dark)" }}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
