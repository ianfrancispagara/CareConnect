"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Clock, FileText, MessageSquare } from "lucide-react";
import { createSession, updateSession } from "@/actions/sessions";
import { useAlert } from "@/hooks/useAlert";
import type { Session } from "@/types/sessions";

const sessionSchema = z.object({
  notes: z.string().min(10, "Notes must be at least 10 characters"),
  duration_minutes: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(240, "Duration cannot exceed 4 hours"),
  feedback: z.string().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionDocumentationFormProps {
  appointmentId: string;
  existingSession?: Session;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SessionDocumentationForm({
  appointmentId,
  existingSession,
  onSuccess,
  onCancel,
}: SessionDocumentationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showAlert } = useAlert();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      notes: existingSession?.notes || "",
      duration_minutes: existingSession?.duration_minutes || 60,
      feedback: existingSession?.feedback || "",
    },
  });

  const onSubmit = async (data: SessionFormData) => {
    setIsSubmitting(true);

    try {
      let result;

      if (existingSession) {
        // Update existing session
        result = await updateSession(existingSession.id, {
          notes: data.notes,
          duration_minutes: data.duration_minutes,
          feedback: data.feedback || undefined,
        });
      } else {
        // Create new session
        result = await createSession({
          appointment_id: appointmentId,
          notes: data.notes,
          duration_minutes: data.duration_minutes,
          feedback: data.feedback || undefined,
        });
      }

      if (result.success) {
        showAlert({
          type: "success",
          message: existingSession
            ? "Session documentation has been updated successfully."
            : "Session has been documented successfully.",
        });
        onSuccess?.();
      } else {
        showAlert({
          type: "error",
          message: result.error || "Failed to save session documentation",
        });
      }
    } catch {
      showAlert({
        type: "error",
        message: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Duration */}
      <div>
        <label
          htmlFor="duration_minutes"
          className="flex items-center gap-2 text-sm font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          <Clock className="w-4 h-4" />
          Session Duration (minutes)
        </label>
        <input
          id="duration_minutes"
          type="number"
          {...register("duration_minutes", { valueAsNumber: true })}
          className="w-full px-4 py-3 rounded-lg transition-colors"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
            color: "var(--text)",
          }}
          placeholder="60"
          min="15"
          max="240"
          step="15"
        />
        {errors.duration_minutes && (
          <p className="text-sm mt-1" style={{ color: "var(--error)" }}>
            {errors.duration_minutes.message}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Enter the actual duration of the session (15-240 minutes)
        </p>
      </div>

      {/* Session Notes */}
      <div>
        <label
          htmlFor="notes"
          className="flex items-center gap-2 text-sm font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          <FileText className="w-4 h-4" />
          Session Notes <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={8}
          className="w-full px-4 py-3 rounded-lg transition-colors resize-none"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
            color: "var(--text)",
          }}
          placeholder="Document the key points discussed, progress made, and any concerns identified during the session..."
        />
        {errors.notes && (
          <p className="text-sm mt-1" style={{ color: "var(--error)" }}>
            {errors.notes.message}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Detailed notes help track student progress and inform future sessions
        </p>
      </div>

      {/* Student Feedback */}
      <div>
        <label
          htmlFor="feedback"
          className="flex items-center gap-2 text-sm font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          <MessageSquare className="w-4 h-4" />
          Student Feedback (Optional)
        </label>
        <textarea
          id="feedback"
          {...register("feedback")}
          rows={4}
          className="w-full px-4 py-3 rounded-lg transition-colors resize-none"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
            color: "var(--text)",
          }}
          placeholder="Any feedback or comments from the student about the session..."
        />
        {errors.feedback && (
          <p className="text-sm mt-1" style={{ color: "var(--error)" }}>
            {errors.feedback.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          style={{
            background: isSubmitting ? "var(--bg-secondary)" : "var(--primary)",
            color: "var(--text-inverse)",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {existingSession ? "Update Documentation" : "Save Documentation"}
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
              color: "var(--text)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Privacy Notice */}
      <div
        className="p-4 rounded-lg text-sm"
        style={{
          background: "var(--info-20)",
          border: "1px solid var(--info)",
        }}
      >
        <p style={{ color: "var(--text)" }}>
          <strong>Privacy Notice:</strong> Session documentation is confidential
          and will only be accessible to authorized PSG members and
          administrators. Students can view their session history but not the
          detailed notes.
        </p>
      </div>
    </form>
  );
}
