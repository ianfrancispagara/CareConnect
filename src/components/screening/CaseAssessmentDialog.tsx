"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CaseAssessmentFormValues = {
  primaryConcern: string;
  currentFeelings: string;
  supportNeeded: string;
  additionalDetails: string;
};

type CaseAssessmentDialogProps = {
  open: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CaseAssessmentFormValues) => Promise<void> | void;
};

const initialValues: CaseAssessmentFormValues = {
  primaryConcern: "",
  currentFeelings: "",
  supportNeeded: "",
  additionalDetails: "",
};

export function CaseAssessmentDialog({
  open,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CaseAssessmentDialogProps) {
  const [values, setValues] = useState<CaseAssessmentFormValues>(initialValues);

  useEffect(() => {
    if (open) {
      setValues(initialValues);
    }
  }, [open]);

  if (!open) return null;

  const updateField = (
    field: keyof CaseAssessmentFormValues,
    value: string,
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border p-6 shadow-2xl"
        style={{ background: "var(--bg-light)", borderColor: "var(--border)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2
              className="text-base font-bold"
              style={{ color: "var(--text)" }}
            >
              Case Assessment
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Share what is happening so the PSG member can review it below the
              screening questions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 transition hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close case assessment dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryConcern">What is your main concern?</Label>
            <Input
              id="primaryConcern"
              value={values.primaryConcern}
              onChange={(event) =>
                updateField("primaryConcern", event.target.value)
              }
              placeholder="Describe the main issue you want help with"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentFeelings">
              How are you feeling right now?
            </Label>
            <Textarea
              id="currentFeelings"
              value={values.currentFeelings}
              onChange={(event) =>
                updateField("currentFeelings", event.target.value)
              }
              placeholder="Tell us about your current emotions or symptoms"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportNeeded">
              What support do you need today?
            </Label>
            <Textarea
              id="supportNeeded"
              value={values.supportNeeded}
              onChange={(event) =>
                updateField("supportNeeded", event.target.value)
              }
              placeholder="Describe the support or help you are looking for"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalDetails">
              Anything else the PSG should know?
            </Label>
            <Textarea
              id="additionalDetails"
              value={values.additionalDetails}
              onChange={(event) =>
                updateField("additionalDetails", event.target.value)
              }
              placeholder="Add any extra context, triggers, or urgent concerns"
              rows={4}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Submitting..." : "Submit Case Assessment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
