import { getUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { formatRole } from "@/lib/utils/auth";
import { DashboardClientWrapper } from "@/components/DashboardClientWrapper";
import Link from "next/link";
import type {
  BannerContent,
  DashboardRole,
  QuickAction,
} from "@/types/dashboard";
import {
  ACTION_CARD_CLASS,
  ACTION_CARD_STYLE,
  PANEL_STYLE,
  BANNER_STYLE,
  STUDENT_BANNER,
  PSG_BANNER,
  STUDENT_ACTIONS,
  PSG_ACTIONS,
  STUDENT_TIPS,
} from "@/lib/utils/dashboard";

function ActionCard({ href, title, description, icon: Icon }: QuickAction) {
  return (
    <Link href={href} className={ACTION_CARD_CLASS} style={ACTION_CARD_STYLE}>
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-lg"
          style={{ background: "var(--primary-20)" }}
        >
          <Icon className="w-6 h-6" style={{ color: "var(--primary)" }} />
        </div>
        <div className="flex-1">
          <h3
            className="font-semibold text-lg mb-1"
            style={{ color: "var(--text)" }}
          >
            {title}
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function WelcomeBanner({ title, description }: BannerContent) {
  return (
    <div className="mb-8 w-full">
      <div className="rounded-lg w-full" style={BANNER_STYLE}>
        <h2
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{ color: "var(--primary)" }}
        >
          {title}
        </h2>
        <p
          className="text-base md:text-lg mb-4 leading-relaxed"
          style={{ color: "var(--text)" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function StudentTipsSection() {
  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>
        💡 Quick Mental Health Tips
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STUDENT_TIPS.map((tip) => (
          <div key={tip.title} className="p-4 rounded-lg" style={PANEL_STYLE}>
            <div className="text-3xl mb-2">{tip.emoji}</div>
            <h3
              className="font-semibold text-sm mb-1"
              style={{ color: "var(--text)" }}
            >
              {tip.title}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {tip.description}
            </p>
          </div>
        ))}
      </div>

      <div
        className="mt-6 p-4 rounded-lg"
        style={{
          background: "var(--warning-10)",
          border: "1px solid var(--warning-30)",
        }}
      >
        <p
          className="text-sm flex items-start gap-2"
          style={{ color: "var(--text)" }}
        >
          <span className="text-lg">⚠️</span>
          <span>
            <strong>Emergency:</strong> If you are in crisis, contact the
            National Mental Health Crisis Hotline at <strong>1553</strong> or
            visit the OCCS office immediately. Help is available 24/7.
          </span>
        </p>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ loginToken?: string | string[] }>;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    redirect("/dashboard/admin");
  }

  if (user.role !== "student" && user.role !== "psg_member") {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const role: DashboardRole = user.role;
  const isStudent = role === "student";
  const quickActions = isStudent ? STUDENT_ACTIONS : PSG_ACTIONS;
  const sectionTitle = isStudent
    ? "Get Started - Choose What You Need"
    : "Quick Access";
  const roleBanner = isStudent ? STUDENT_BANNER : PSG_BANNER;
  const loginToken = Array.isArray(resolvedSearchParams?.loginToken)
    ? resolvedSearchParams?.loginToken[0]
    : resolvedSearchParams?.loginToken;

  return (
    <DashboardClientWrapper
      initialRole={user.role}
      showStudentOnboarding={isStudent}
      loginToken={loginToken}
      studentName={user.full_name}
    >
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <div className="rounded-lg p-4" style={PANEL_STYLE}>
              <p className="text-sm" style={{ color: "var(--info)" }}>
                <span className="font-semibold">Role:</span>{" "}
                {formatRole(user.role)}
              </p>
              {user.school_id && (
                <p className="text-sm mt-1" style={{ color: "var(--info)" }}>
                  <span className="font-semibold">School ID:</span>{" "}
                  {user.school_id}
                </p>
              )}
            </div>
          </div>

          <WelcomeBanner
            title={roleBanner.title}
            description={roleBanner.description}
          />

          <div>
            <h2
              className="text-base font-bold mb-6"
              style={{ color: "var(--text)" }}
            >
              {sectionTitle}
            </h2>

            {role === "psg_member" && (
              <div className="mb-6">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  Start with <strong>Review Screenings</strong> and{" "}
                  <strong>View Referrals</strong>
                  to evaluate each case, then forward your triage decision to
                  admin as
                  <strong> Needs Immediate Help</strong>,{" "}
                  <strong>Moderate</strong>, or <strong>Good</strong>.
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => (
                <ActionCard key={action.href} {...action} />
              ))}
            </div>

            {isStudent && <StudentTipsSection />}
          </div>
        </main>
      </div>
    </DashboardClientWrapper>
  );
}
