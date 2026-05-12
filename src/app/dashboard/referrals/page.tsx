import { getStudentReferrals } from "@/actions/referrals";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/auth";
import Link from "next/link";
import { FileText } from "lucide-react";
import { StudentReferralsListClient } from "@/components/student/StudentReferralsListClient";

export default async function StudentReferralsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "student") {
    redirect("/dashboard");
  }

  const result = await getStudentReferrals(user.id);
  const referrals = result.success ? result.data || [] : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-lg font-bold mb-1"
              style={{ color: "var(--text)" }}
            >
              My Referrals
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Track your support requests and their status
            </p>
          </div>
          <Link
            href="/dashboard/referrals/create"
            className="px-4 py-2 rounded-md text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: "var(--primary)",
              color: "white",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)",
            }}
          >
            New Referral
          </Link>
        </div>

        {/* Referrals List */}
        {referrals.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            <FileText
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "var(--text-muted)" }}
            />
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: "var(--text)" }}
            >
              No Referrals Yet
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              You haven&apos;t submitted any referrals yet.
            </p>
            <Link
              href="/dashboard/referrals/create"
              className="inline-block px-4 py-2 rounded-md text-sm font-medium"
              style={{
                background: "var(--primary)",
                color: "white",
              }}
            >
              Submit Your First Referral
            </Link>
          </div>
        ) : (
          <StudentReferralsListClient referrals={referrals} />
        )}
      </main>
    </div>
  );
}
