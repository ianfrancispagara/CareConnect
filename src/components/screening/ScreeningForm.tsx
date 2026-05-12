"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";
import type {
  ScreeningQuestion,
  QuestionResponse,
} from "@/lib/validations/screening";
import { QuestionType } from "@/lib/validations/screening";

type ScreeningFormProps = {
  questions: ScreeningQuestion[];
  onSubmit: (responses: QuestionResponse[]) => Promise<void>;
};

export function ScreeningForm({ questions, onSubmit }: ScreeningFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Map<string, QuestionResponse>>(
    new Map()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showAlert } = useAlert();

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (
    questionId: string,
    answer: string | number | boolean
  ) => {
    // Calculate score based on question type and answer
    let score = 0;
    const question = questions.find((q) => q.id === questionId);

    if (!question) return;

    if (question.question_type === QuestionType.SCALE) {
      // Scale 0-10, normalize to score
      score = typeof answer === "number" ? answer : 0;
    } else if (question.question_type === QuestionType.YES_NO) {
      // Yes = high score, No = low score for negative questions
      score = answer === true ? 10 : 0;
    } else if (question.question_type === QuestionType.TEXT) {
      // Text responses don't contribute to score
      score = 0;
    }

    // Apply weight and round to avoid floating-point precision issues
    const weightedScore = Number(((score * question.weight) / 10).toFixed(2));

    const response: QuestionResponse = {
      question_id: questionId,
      answer,
      score: weightedScore,
    };

    setResponses((prev) => new Map(prev).set(questionId, response));
  };

  const handleNext = () => {
    if (!currentQuestion.id || !responses.has(currentQuestion.id)) {
      showAlert({
        type: "warning",
        message: "Please answer the current question before proceeding.",
        duration: 3000,
      });
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (responses.size !== questions.length) {
      showAlert({
        type: "warning",
        message: "Please answer all questions before submitting.",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(Array.from(responses.values()));
      showAlert({
        type: "success",
        message: "Screening submitted successfully!",
        duration: 4000,
      });
    } catch {
      showAlert({
        type: "error",
        message: "Failed to submit screening. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  const currentResponse = currentQuestion.id
    ? responses.get(currentQuestion.id)
    : undefined;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            Question {currentStep + 1} of {questions.length}
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--border-muted)" }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: "var(--primary)",
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div
        className="p-8 rounded-lg mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)]"
        style={{
          background: "var(--bg-light)",
          border: "1px solid var(--border-muted)",
        }}
      >
        <h3
          className="text-xl font-semibold mb-6"
          style={{ color: "var(--text)" }}
        >
          {currentQuestion.question_text}
        </h3>

        {/* Answer Input Based on Question Type */}
        <div className="space-y-4">
          {currentQuestion.question_type === QuestionType.SCALE && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  Not at all (0)
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  Extremely (10)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={
                  typeof currentResponse?.answer === "number"
                    ? currentResponse.answer
                    : 0
                }
                onChange={(e) =>
                  currentQuestion.id &&
                  handleAnswer(currentQuestion.id, parseInt(e.target.value))
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: "var(--border-muted)",
                }}
              />
              <div className="text-center mt-2">
                <span
                  className="text-2xl font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {typeof currentResponse?.answer === "number"
                    ? currentResponse.answer
                    : 0}
                </span>
              </div>
            </div>
          )}

          {currentQuestion.question_type === QuestionType.YES_NO && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  currentQuestion.id && handleAnswer(currentQuestion.id, true)
                }
                className="p-4 rounded-lg border-2 transition"
                style={{
                  borderColor:
                    currentResponse?.answer === true
                      ? "var(--primary)"
                      : "var(--border)",
                  background:
                    currentResponse?.answer === true
                      ? "var(--primary)"
                      : "var(--bg)",
                  color:
                    currentResponse?.answer === true
                      ? "var(--bg-dark)"
                      : "var(--text)",
                }}
              >
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
                Yes
              </button>
              <button
                onClick={() =>
                  currentQuestion.id && handleAnswer(currentQuestion.id, false)
                }
                className="p-4 rounded-lg border-2 transition"
                style={{
                  borderColor:
                    currentResponse?.answer === false
                      ? "var(--primary)"
                      : "var(--border)",
                  background:
                    currentResponse?.answer === false
                      ? "var(--primary)"
                      : "var(--bg)",
                  color:
                    currentResponse?.answer === false
                      ? "var(--bg-dark)"
                      : "var(--text)",
                }}
              >
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                No
              </button>
            </div>
          )}

          {currentQuestion.question_type === QuestionType.TEXT && (
            <textarea
              value={
                typeof currentResponse?.answer === "string"
                  ? currentResponse.answer
                  : ""
              }
              onChange={(e) =>
                currentQuestion.id &&
                handleAnswer(currentQuestion.id, e.target.value)
              }
              placeholder="Type your response here..."
              rows={5}
              className="w-full p-4 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                borderColor: "var(--border)",
              }}
            />
          )}

          {currentQuestion.question_type === QuestionType.MULTIPLE_CHOICE &&
            currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      currentQuestion.id &&
                      handleAnswer(currentQuestion.id, option)
                    }
                    className="w-full p-4 rounded-lg border-2 text-left transition"
                    style={{
                      borderColor:
                        currentResponse?.answer === option
                          ? "var(--primary)"
                          : "var(--border)",
                      background:
                        currentResponse?.answer === option
                          ? "var(--primary)"
                          : "var(--bg)",
                      color:
                        currentResponse?.answer === option
                          ? "var(--bg-dark)"
                          : "var(--text)",
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          style={{
            background: "var(--bg-light)",
            color: "var(--text)",
            border: "1px solid var(--border-muted)",
          }}
        >
          Previous
        </button>

        {currentStep === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.08)]"
            style={{
              background: "var(--primary)",
              color: "var(--bg-dark)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Screening"
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-lg font-medium transition shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.08)]"
            style={{
              background: "var(--primary)",
              color: "var(--bg-dark)",
            }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
