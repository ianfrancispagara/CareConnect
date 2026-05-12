import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { getUser } from "@/lib/actions/auth";
import { SidebarProvider } from "@/components/ui/sidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <Sidebar userRole={user.role} className="z-30 min-h-0 overflow-y-auto" />

      <div className="min-h-screen w-full" style={{ background: "var(--bg)" }}>
        <DashboardNavbar
          subtitle={
            user.role === "admin"
              ? "Admin workspace"
              : user.role === "psg_member"
                ? "Welcome back, PSG Member"
                : `Welcome back, ${user.full_name}`
          }
          showHomeButton={user.role === "admin"}
        />
        <div className="[&_main]:min-w-0 [&_main]:w-full [&_main]:pb-24 lg:[&_main]:pb-8 [&_main]:!max-w-[90rem]">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
