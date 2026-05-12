import { z } from "zod";

// Severity levels with color codes
export const SeverityLevel = {
  LOW: "low", // Green
  MODERATE: "moderate", // Yellow
  HIGH: "high", // Red
} as const;

export type SeverityLevelType =
  (typeof SeverityLevel)[keyof typeof SeverityLevel];

// Question types
export const QuestionType = {
  MULTIPLE_CHOICE: "multiple_choice",
  SCALE: "scale", // 1-10 scale
  YES_NO: "yes_no",
  TEXT: "text",
} as const;

// Screening question schema
export const screeningQuestionSchema = z.object({
  id: z.string().optional(),
  question_text: z.string().min(5, "Question must be at least 5 characters"),
  question_type: z.enum([
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.SCALE,
    QuestionType.YES_NO,
    QuestionType.TEXT,
  ]),
  options: z.array(z.string()).optional(), // For multiple choice
  weight: z.number().min(1).max(10).default(5), // Importance of question for severity calculation
  is_preset: z.boolean().default(true), // Preset vs custom questions
  created_by: z.string().optional(), // User ID who created custom question
  order: z.number().optional(),
});

export type ScreeningQuestion = z.infer<typeof screeningQuestionSchema>;

// Response schema for a single question
export const questionResponseSchema = z.object({
  question_id: z.string(),
  answer: z.union([z.string(), z.number(), z.boolean()]),
  score: z.number().min(0).max(10).optional(), // Calculated score for this answer
});

export type QuestionResponse = z.infer<typeof questionResponseSchema>;

// Complete screening submission schema
export const screeningSubmissionSchema = z.object({
  student_id: z.string(),
  responses: z
    .array(questionResponseSchema)
    .min(1, "At least one response is required"),
  notes: z.string().optional(),
});

export type ScreeningSubmission = z.infer<typeof screeningSubmissionSchema>;

// Screening result schema
export const screeningResultSchema = z.object({
  id: z.string().optional(),
  student_id: z.string(),
  total_score: z.number(),
  severity_level: z.enum([
    SeverityLevel.LOW,
    SeverityLevel.MODERATE,
    SeverityLevel.HIGH,
  ]),
  color_code: z.enum(["green", "yellow", "red"]),
  responses: z.array(questionResponseSchema),
  recommendations: z.string().optional(),
  requires_immediate_attention: z.boolean().default(false),
  reviewed_by: z.string().optional(), // PSG member who reviewed
  reviewed_at: z.date().optional(),
  created_at: z.date().optional(),
});

export type ScreeningResult = z.infer<typeof screeningResultSchema>;

// Preset mental health screening questions (PHQ-9 inspired)
export const PRESET_SCREENING_QUESTIONS: Omit<ScreeningQuestion, "id">[] = [
  {
    question_text:
      "Over the last 2 weeks, how often have you felt down, depressed, or hopeless?",
    question_type: QuestionType.SCALE,
    weight: 8,
    is_preset: true,
    order: 1,
  },
  {
    question_text:
      "Over the last 2 weeks, how often have you had little interest or pleasure in doing things?",
    question_type: QuestionType.SCALE,
    weight: 8,
    is_preset: true,
    order: 2,
  },
  {
    question_text:
      "Over the last 2 weeks, how often have you had trouble falling or staying asleep, or sleeping too much?",
    question_type: QuestionType.SCALE,
    weight: 6,
    is_preset: true,
    order: 3,
  },
  {
    question_text:
      "Over the last 2 weeks, how often have you felt tired or had little energy?",
    question_type: QuestionType.SCALE,
    weight: 5,
    is_preset: true,
    order: 4,
  },
  {
    question_text:
      "Over the last 2 weeks, how often have you had a poor appetite or been overeating?",
    question_type: QuestionType.SCALE,
    weight: 5,
    is_preset: true,
    order: 5,
  },
  {
    question_text:
      "Over the last 2 weeks, how often have you felt bad about yourself or that you are a failure?",
    question_type: QuestionType.SCALE,
    weight: 7,
    is_preset: true,
    order: 6,
  },
  {
    question_text:
      "Over the last 2 weeks, how often have you had trouble concentrating on things?",
    question_type: QuestionType.SCALE,
    weight: 6,
    is_preset: true,
    order: 7,
  },
  {
    question_text:
      "Have you been experiencing thoughts of self-harm or suicide?",
    question_type: QuestionType.YES_NO,
    weight: 10,
    is_preset: true,
    order: 8,
  },
  {
    question_text: "Do you feel you need immediate support or intervention?",
    question_type: QuestionType.YES_NO,
    weight: 9,
    is_preset: true,
    order: 9,
  },
  {
    question_text:
      "Is there anything else you would like to share about how you've been feeling?",
    question_type: QuestionType.TEXT,
    weight: 3,
    is_preset: true,
    order: 10,
  },
];

// Helper function to calculate severity based on responses
export function calculateSeverity(responses: QuestionResponse[]): {
  severity: SeverityLevelType;
  color: "green" | "yellow" | "red";
  totalScore: number;
  percentage: number;
  requiresImmediateAttention: boolean;
} {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let requiresImmediateAttention = false;

  responses.forEach((response) => {
    const score = response.score || 0;
    totalScore += score;
    maxPossibleScore += 10; // Assuming max score per question is 10

    // Check for immediate attention flags (e.g., suicidal thoughts)
    if (typeof response.answer === "boolean" && response.answer === true) {
      // Check if this is a critical yes/no question
      requiresImmediateAttention = true;
    }
  });

  const percentage = (totalScore / maxPossibleScore) * 100;

  let severity: SeverityLevelType;
  let color: "green" | "yellow" | "red";

  if (percentage >= 70 || requiresImmediateAttention) {
    severity = SeverityLevel.HIGH;
    color = "red";
  } else if (percentage >= 40) {
    severity = SeverityLevel.MODERATE;
    color = "yellow";
  } else {
    severity = SeverityLevel.LOW;
    color = "green";
  }

  return {
    severity,
    color,
    totalScore,
    percentage,
    requiresImmediateAttention,
  };
}
