// Columbia-Suicide Severity Rating Scale Questions for Chat Assessment

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: "yes_no" | "scale";
  skipLogic?: {
    answer: string;
    skipTo: string;
  };
  riskLevel?: "low" | "moderate" | "high";
}

export const CASE_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1",
    question:
      "Have you wished you were dead or wished you could go to sleep and not wake up?",
    type: "yes_no",
    riskLevel: "low",
  },
  {
    id: "q2",
    question: "Have you actually had any thoughts of killing yourself?",
    type: "yes_no",
    skipLogic: {
      answer: "no",
      skipTo: "q6",
    },
    riskLevel: "low",
  },
  {
    id: "q3",
    question:
      'Have you been thinking about how you might do this? (e.g., "I thought about taking an overdose but I never made a specific plan as to when, where, or how I would actually do it...and I would never go through with it.")',
    type: "yes_no",
    riskLevel: "moderate",
  },
  {
    id: "q4",
    question:
      'Have you had these thoughts and had some intention of acting on them? (As opposed to "I have the thoughts but I definitely will not do anything about them.")',
    type: "yes_no",
    riskLevel: "high",
  },
  {
    id: "q5",
    question:
      "Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?",
    type: "yes_no",
    riskLevel: "high",
  },
  {
    id: "q6",
    question:
      "Have you ever done anything, started to do anything, or prepared to do anything to end your life?\n\nExamples: Collected pills, obtained a gun, gave away valuables, wrote a will or suicide note, took out pills but didn't swallow any, held a gun but changed your mind or it was grabbed from your hand, went to the roof but didn't jump; or actually took pills, tried to shoot yourself, cut yourself, tried to hang yourself, etc.\n\nWas this within the past three months?",
    type: "yes_no",
    riskLevel: "high",
  },
];

export interface AssessmentResponse {
  questionId: string;
  answer: string;
  timestamp: string;
}

export function calculateSeverity(responses: AssessmentResponse[]): {
  level: "low" | "moderate" | "high";
  color: string;
  requiresImmediateAttention: boolean;
} {
  // Check for high-risk answers (q4, q5, q6 = yes)
  const hasHighRiskAnswer = responses.some(
    (r) =>
      ["q4", "q5", "q6"].includes(r.questionId) &&
      r.answer.toLowerCase() === "yes"
  );

  if (hasHighRiskAnswer) {
    return {
      level: "high",
      color: "red",
      requiresImmediateAttention: true,
    };
  }

  // Check for moderate risk (q3 = yes)
  const hasModerateRiskAnswer = responses.some(
    (r) => r.questionId === "q3" && r.answer.toLowerCase() === "yes"
  );

  if (hasModerateRiskAnswer) {
    return {
      level: "moderate",
      color: "yellow",
      requiresImmediateAttention: false,
    };
  }

  // Low risk (only q1 or q2 = yes, or all no)
  return {
    level: "low",
    color: "green",
    requiresImmediateAttention: false,
  };
}
