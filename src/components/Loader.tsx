import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
}

export function Loader({
  size = 48,
  text = "Loading...",
  fullScreen = false,
}: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2
        size={size}
        className="animate-spin"
        style={{ color: "var(--primary)" }}
      />
      {text && (
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        {content}
      </div>
    );
  }

  return content;
}
