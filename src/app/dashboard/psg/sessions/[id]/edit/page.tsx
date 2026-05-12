import { getUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getSessionById } from "@/actions/sessions";
import { SessionDocumentationForm } from "@/components/SessionDocumentationForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();

  if (!user || user.role !== "psg_member") {
    redirect("/dashboard");
  }

  const result = await getSessionById(params.id);

  if (!result.success || !result.data) {
    redirect("/dashboard/psg/sessions");
  }

  const session = result.data;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href={`/dashboard/psg/sessions/${params.id}`}
          className="inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Session Details
        </Link>

        {/* Form Card */}
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <h1
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--text)" }}
          >
            Edit Session Documentation
          </h1>

          <SessionDocumentationForm
            appointmentId={session.appointment_id}
            existingSession={session}
            onSuccess={() => {
              redirect(`/dashboard/psg/sessions/${params.id}`);
            }}
            onCancel={() => {
              redirect(`/dashboard/psg/sessions/${params.id}`);
            }}
          />
        </div>
      </main>
    </div>
  );
}
