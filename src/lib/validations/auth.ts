import { z } from "zod";

// Email validation for institutional email only
const carsuEmailRegex = /@carsu\.edu\.ph$/i;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .regex(
      carsuEmailRegex,
      "Must use a Caraga State University email (@carsu.edu.ph)",
    ),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .regex(
        carsuEmailRegex,
        "Must use a Caraga State University email (@carsu.edu.ph)",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    fullName: z.string().optional(),
    codename: z.string().optional(),
    schoolId: z
      .string()
      .min(1, "School ID is required")
      .regex(/^[0-9]{3}-[0-9]{5}$/, "School ID must be in format: XXX-XXXXX"),
    inviteToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.inviteToken) {
      if (!data.codename || data.codename.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Codename is required and must be at least 2 characters",
          path: ["codename"],
        });
      }
      return;
    }

    if (!data.fullName || data.fullName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Full name must be at least 2 characters",
        path: ["fullName"],
      });
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
