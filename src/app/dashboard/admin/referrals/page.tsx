import { redirect } from "next/navigation";
import { getAdminForwardedReferrals } from "@/actions/referrals";
import { AdminReferralQueueClient } from "@/components/admin/AdminReferralQueueClient";
import { AlertProvider } from "@/components/AlertProvider";
import { ClipboardList } from "lucide-react";

export default async function AdminReferralQueuePage() {
  const result = await getAdminForwardedReferrals();

  if (!result.success) {
    if (result.error === "Please login first") {
      redirect("/login");
    }

    if (result.error === "Unauthorized access") {
      redirect("/dashboard");
    }
  }

  const referrals = result.success ? result.data || [] : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1
            className="text-lg font-bold mb-2"
            style={{ color: "var(--text)" }}
          >
            Referral Queue
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Referrals forwarded by PSG members for admin review.
          </p>
          <p
            className="mt-2 rounded-lg px-3 py-2 text-sm"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            For online sessions, request the meeting link from RGC or coordinate
            with the Head of the Guidance Office before confirming the schedule.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Total Forwarded
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              {referrals.length}
            </p>
          </div>
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Awaiting Admin Action
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--warning)" }}
            >
              {
                referrals.filter(
                  (referral) =>
                    referral.status === "reviewed" ||
                    referral.status === "assigned" ||
                    referral.status === "in_progress",
                ).length
              }
            </p>
          </div>
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Closed Cases
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--success)" }}
            >
              {
                referrals.filter(
                  (referral) =>
                    referral.status === "completed" ||
                    referral.status === "escalated",
                ).length
              }
            </p>
          </div>
        </div>

        {referrals.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            <ClipboardList
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "var(--text-muted)" }}
            />
            <h2
              className="text-base font-semibold mb-2"
              style={{ color: "var(--text)" }}
            >
              No Forwarded Referrals Yet
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              Only referrals moved forward by PSG members will appear here.
            </p>
          </div>
        ) : (
          <AlertProvider>
            <AdminReferralQueueClient referrals={referrals} />
          </AlertProvider>
        )}
      </main>
    </div>
  );
}
