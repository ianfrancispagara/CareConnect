"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Calendar,
  MessageSquareText,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type OnboardingStep = {
  title: string;
  description: string;
  highlights: string[];
  icon: ComponentType<{ className?: string }>;
};

const STUDENT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Start with your screening",
    description:
      "Take the mental health screening to get a quick picture of how you are doing right now.",
    highlights: [
      "Answer honestly so the recommendations fit your situation.",
      "Your screening results stay private and guide the next steps.",
    ],
    icon: ClipboardList,
  },
  {
    title: "Review your results",
    description:
      "Check the results page for your color-coded severity level and the suggested support path.",
    highlights: [
      "Green means things look stable.",
      "Yellow means you should monitor your well-being and follow the guidance.",
      "Red means reach out for support as soon as possible.",
    ],
    icon: FileText,
  },
  {
    title: "Book help when you need it",
    description:
      "Use appointments or self-referral when you want to talk with a PSG member or ask for support.",
    highlights: [
      "Open My Appointments to see upcoming sessions.",
      "Book an appointment if you need a support slot.",
      "Create a referral if you want to start a support request.",
    ],
    icon: Calendar,
  },
  {
    title: "Communicate with a PSG member",
    description:
      "Click the chat button on the dashboard to send a message to your PSG support team. ",
    highlights: [
      "Check back for new instructions or appointment changes.",
      "Use chat for quick follow-ups when communication is needed.",
    ],
    icon: MessageSquareText,
  },
];

type StudentOnboardingDialogProps = {
  open: boolean;
  loginToken?: string | null;
  studentName?: string | null;
};

function getDismissedStorageKey(loginToken: string | null | undefined) {
  return loginToken ? `student-onboarding-dismissed-${loginToken}` : null;
}

export function StudentOnboardingDialog({
  open,
  loginToken,
  studentName,
}: StudentOnboardingDialogProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const storageKey = getDismissedStorageKey(loginToken);
    return storageKey
      ? window.sessionStorage.getItem(storageKey) === "true"
      : false;
  });
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!open || isDismissed) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDismissed, open]);

  const currentStep = STUDENT_ONBOARDING_STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STUDENT_ONBOARDING_STEPS.length - 1;
  const isOpen = open && !isDismissed;

  const closeDialog = () => {
    setIsDismissed(true);

    if (typeof window !== "undefined") {
      const storageKey = getDismissedStorageKey(loginToken);
      if (storageKey) {
        window.sessionStorage.setItem(storageKey, "true");
      }
    }
  };

  const goToPreviousStep = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const goToNextStep = () => {
    if (isLastStep) {
      closeDialog();
      return;
    }

    setStepIndex((current) =>
      Math.min(current + 1, STUDENT_ONBOARDING_STEPS.length - 1),
    );
  };

  if (!isOpen) {
    return null;
  }

  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
        onClick={closeDialog}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-onboarding-title"
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          background: "var(--bg-light)",
          borderColor: "var(--border-muted)",
        }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-6 py-5"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--primary)" }}
            >
              Student onboarding
            </p>
            <div>
              <h2
                id="student-onboarding-title"
                className="text-2xl font-bold"
                style={{ color: "var(--text)" }}
              >
                Welcome{studentName ? `, ${studentName}` : ""}
              </h2>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                Follow these steps to get the most out of CareConnect.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={closeDialog}
            className="shrink-0"
            aria-label="Close onboarding dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: "var(--primary-20)" }}
                >
                  <StepIcon className="h-6 w-6 text-[color:var(--primary)]" />
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Step {stepIndex + 1} of {STUDENT_ONBOARDING_STEPS.length}
                  </p>
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {currentStep.title}
                  </h3>
                </div>
              </div>
            </div>

            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--text)" }}
            >
              {currentStep.description}
            </p>

            <div className="mt-6 space-y-3">
              {currentStep.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-xl border px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: "var(--bg)",
                    borderColor: "var(--border-muted)",
                    color: "var(--text)",
                  }}
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex flex-col justify-between border-t px-6 py-6 lg:border-l lg:border-t-0"
            style={{
              borderColor: "var(--border-muted)",
              background:
                "linear-gradient(180deg, var(--primary-10) 0%, transparent 100%)",
            }}
          >
            <div className="space-y-4">
              <div
                className="rounded-2xl border p-5"
                style={{
                  background: "var(--bg)",
                  borderColor: "var(--border-muted)",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  What you can do from here
                </p>
                <ul
                  className="mt-3 space-y-2 text-sm leading-relaxed"
                  style={{ color: "var(--text)" }}
                >
                  <li>• Complete screenings and review results.</li>
                  <li>• Book appointments and track support progress.</li>
                  <li>• Create referrals when you need more help.</li>
                  <li>• Stay in touch with your PSG support team.</li>
                </ul>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{
                  background: "var(--bg)",
                  borderColor: "var(--border-muted)",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  Quick navigation
                </p>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  Use Previous and Next to move through the guide. Close it any
                  time with the X button in the top right corner.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isFirstStep}
                className="sm:min-w-36 text-background"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2 self-center sm:self-auto">
                {STUDENT_ONBOARDING_STEPS.map((_, index) => (
                  <span
                    key={index}
                    className="h-2.5 w-2.5 rounded-full transition-all"
                    style={{
                      background:
                        index === stepIndex
                          ? "var(--primary)"
                          : "var(--border-muted)",
                    }}
                  />
                ))}
              </div>

              <Button
                type="button"
                onClick={goToNextStep}
                className="sm:min-w-36"
              >
                {isLastStep ? "Finish" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
