"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { register as registerAction } from "@/lib/actions/auth";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegistrationForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const isPsgInvite = Boolean(inviteToken);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      inviteToken,
    },
  });

  const password = watch("password");

  // Password strength indicators
  const hasMinLength = password?.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password || "");
  const hasLowerCase = /[a-z]/.test(password || "");
  const hasNumber = /[0-9]/.test(password || "");

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    const result = await registerAction({
      ...data,
      ...(inviteToken ? { inviteToken } : {}),
    });
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // If no error, redirect will happen automatically from server action
  };

  return (
    <div
      className="w-full max-w-md p-8"
      style={{
        background: "var(--bg-light)",
        borderRadius: "1rem",
        boxShadow:
          "0 2px 16px 0 var(--border-muted), 0 1px 3px 0 rgba(0,0,0,0.08)",
        transition: "box-shadow 0.3s, background 0.3s, border-radius 0.3s",
      }}
    >
      <div className="text-center mb-8">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--text)" }}
        >
          Create Account
        </h2>
        <p className="text-base" style={{ color: "var(--text-muted)" }}>
          Join CareConnect to access mental health support
        </p>
      </div>

      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex items-start gap-3"
          style={{
            background: "var(--danger)",
            border: "1px solid var(--border)",
          }}
        >
          <AlertCircle
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            style={{ color: "var(--text)" }}
          />
          <p className="text-sm" style={{ color: "var(--text)" }}>
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {isPsgInvite ? (
          <div>
            <label
              htmlFor="codename"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text)" }}
            >
              Codename
            </label>
            <input
              id="codename"
              type="text"
              {...register("codename")}
              placeholder="Falcon"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                borderColor: "var(--border)",
              }}
              disabled={isLoading}
            />
            {errors.codename && (
              <p className="mt-1 text-sm" style={{ color: "var(--danger)" }}>
                {errors.codename.message}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text)" }}
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              {...register("fullName")}
              placeholder="Juan Dela Cruz"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                borderColor: "var(--border)",
              }}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm" style={{ color: "var(--danger)" }}>
                {errors.fullName.message}
              </p>
            )}
          </div>
        )}

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text)" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            placeholder="your.name@carsu.edu.ph"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition"
            style={{
              background: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm" style={{ color: "var(--danger)" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* School ID */}
        <div>
          <label
            htmlFor="schoolId"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text)" }}
          >
            School ID
          </label>
          <input
            id="schoolId"
            type="text"
            {...register("schoolId")}
            placeholder="221-00761"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition"
            style={{
              background: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            disabled={isLoading}
          />
          {errors.schoolId && (
            <p className="mt-1 text-sm" style={{ color: "var(--danger)" }}>
              {errors.schoolId.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text)" }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="Create a strong password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition pr-12"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                borderColor: "var(--border)",
              }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--highlight)" }}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {/* Password Requirements */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasMinLength ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span
                  className={hasMinLength ? "text-green-700" : "text-gray-500"}
                >
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasUpperCase ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span
                  className={hasUpperCase ? "text-green-700" : "text-gray-500"}
                >
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasLowerCase ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span
                  className={hasLowerCase ? "text-green-700" : "text-gray-500"}
                >
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasNumber ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span
                  className={hasNumber ? "text-green-700" : "text-gray-500"}
                >
                  One number
                </span>
              </div>
            </div>
          )}
          {errors.password && (
            <p className="mt-1 text-sm" style={{ color: "var(--danger)" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text)" }}
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="Re-enter your password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition pr-12"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                borderColor: "var(--border)",
              }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--highlight)" }}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm" style={{ color: "var(--danger)" }}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: "var(--primary)", color: "var(--bg-dark)" }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium"
            style={{ color: "var(--secondary)" }}
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
