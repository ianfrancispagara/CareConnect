"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardLoginAlert } from "@/components/DashboardLoginAlert";
import { ChatWidget } from "@/components/ChatWidget";
import { ChatWidgetPSG } from "@/components/ChatWidgetPSG";
import { StudentOnboardingDialog } from "@/components/StudentOnboardingDialog";

export function DashboardClientWrapper({
  children,
  initialRole,
  showStudentOnboarding = false,
  loginToken,
  studentName,
}: {
  children: React.ReactNode;
  initialRole?: string | null;
  showStudentOnboarding?: boolean;
  loginToken?: string | null;
  studentName?: string | null;
}) {
  const [userRole, setUserRole] = useState<string | null>(initialRole ?? null);
  const searchParams = useSearchParams();
  const clientLoginToken = searchParams.get("loginToken");
  const activeLoginToken = loginToken ?? clientLoginToken;

  useEffect(() => {
    const getUserRole = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fast fallback so chat renders even if profile query is delayed/fails.
        const metadataRole = user.user_metadata?.role;
        if (
          metadataRole === "student" ||
          metadataRole === "psg_member" ||
          metadataRole === "admin"
        ) {
          setUserRole(metadataRole);
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    getUserRole();
  }, []);

  return (
    <>
      <DashboardLoginAlert loginToken={activeLoginToken} />
      <StudentOnboardingDialog
        key={activeLoginToken ?? "student-onboarding"}
        open={
          showStudentOnboarding && userRole === "student" && !!activeLoginToken
        }
        loginToken={activeLoginToken}
        studentName={studentName}
      />
      {children}
      {userRole === "student" && <ChatWidget />}
      {(userRole === "psg_member" || userRole === "admin") && <ChatWidgetPSG />}
    </>
  );
}
