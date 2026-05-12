"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createReferral } from "@/actions/referrals";
import { useAlert } from "@/hooks/useAlert";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function CreateReferralPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    reason: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createReferral({
        source: "self",
        reason: formData.reason,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        // Show success message and redirect
        showAlert({
          type: "success",
          message:
            "Referral submitted successfully! A PSG member will review your request soon.",
          duration: 5000,
        });
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to submit referral");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Form Card */}
        <div
          className="rounded-lg p-6 md:p-8"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)",
          }}
        >
          <h1
            className="text-lg font-bold mb-2"
            style={{ color: "var(--text)" }}
          >
            Self-Referral Form
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Submit a referral to connect with a Peer Support Group member. Your
            information will be kept confidential.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason */}
            <div>
              <Label
                htmlFor="reason"
                className="text-sm font-medium mb-2 block"
                style={{ color: "var(--text)" }}
              >
                Reason for Referral{" "}
                <span style={{ color: "var(--destructive)" }}>*</span>
              </Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Please describe why you're seeking support (e.g., academic stress, anxiety, personal concerns)..."
                rows={5}
                required
                className="w-full text-sm"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border-muted)",
                  color: "var(--text)",
                }}
              />
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Be as specific as you&apos;re comfortable with. This helps us
                assign the right PSG member.
              </p>
            </div>

            {/* Additional Notes */}
            <div>
              <Label
                htmlFor="notes"
                className="text-sm font-medium mb-2 block"
                style={{ color: "var(--text)" }}
              >
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any other information that might be helpful (e.g., availability, preferred contact method)..."
                rows={4}
                className="w-full text-sm"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border-muted)",
                  color: "var(--text)",
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-3 rounded-md text-sm"
                style={{
                  background: "var(--destructive-20)",
                  color: "var(--destructive)",
                  border: "1px solid var(--destructive)",
                }}
              >
                {error}
              </div>
            )}

            {/* Privacy Notice */}
            <div
              className="p-4 rounded-md text-xs"
              style={{
                background: "var(--info-20)",
                border: "1px solid var(--info)",
                color: "var(--text-muted)",
              }}
            >
              <p
                className="font-semibold mb-1"
                style={{ color: "var(--info)" }}
              >
                Your Privacy Matters
              </p>
              <p>
                All information shared is confidential and will only be accessed
                by assigned PSG members. We follow strict privacy protocols in
                accordance with RA 10173 (Data Privacy Act).
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={() => router.push("/dashboard")}
                variant="outline"
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.reason.trim()}
                className="flex-1 gap-2"
                style={{
                  background: isSubmitting
                    ? "var(--bg-secondary)"
                    : "var(--primary)",
                  color: "white",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)",
                }}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Submitting..." : "Submit Referral"}
              </Button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          <p className="mb-2">
            <strong>What happens next?</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              Your referral will be reviewed by a PSG member within 24-48 hours
            </li>
            <li>
              You&apos;ll be assigned to a PSG member based on availability and
              your needs
            </li>
            <li>
              The assigned PSG member will contact you to schedule an initial
              session
            </li>
            <li>All communications and sessions are confidential</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
