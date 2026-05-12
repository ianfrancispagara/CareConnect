"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  ClipboardList,
  FileText,
  FilePlus,
  Shield,
  Users,
  BarChart3,
  Activity,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/utils/auth";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type SidebarProps = {
  userRole?: UserRole;
  className?: string;
};

type SidebarMenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STUDENT_MENU: SidebarMenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  {
    label: "Take Screening",
    href: "/dashboard/screening/take",
    icon: ClipboardList,
  },
  {
    label: "Screening Results",
    href: "/dashboard/screening/results",
    icon: FileText,
  },
  {
    label: "Create Referral",
    href: "/dashboard/referrals/create",
    icon: FilePlus,
  },
  { label: "My Referrals", href: "/dashboard/referrals", icon: Activity },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

const PSG_MENU: SidebarMenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Referrals", href: "/dashboard/psg/referrals", icon: FileText },
  {
    label: "Screenings",
    href: "/dashboard/psg/screenings",
    icon: ClipboardList,
  },
  { label: "Sessions", href: "/dashboard/psg/sessions", icon: Stethoscope },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

const ADMIN_MENU: SidebarMenuItem[] = [
  { label: "Admin Home", href: "/dashboard/admin", icon: Shield },
  {
    label: "Referral Queue",
    href: "/dashboard/admin/referrals",
    icon: ClipboardList,
  },
  { label: "User Management", href: "/dashboard/admin/users", icon: Users },
  { label: "Reports", href: "/dashboard/admin/reports", icon: BarChart3 },
  { label: "Audit Logs", href: "/dashboard/admin/audit", icon: FileText },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

function getMenusByRole(role: UserRole): SidebarMenuItem[] {
  if (role === "admin") return ADMIN_MENU;
  if (role === "psg_member") return PSG_MENU;
  return STUDENT_MENU;
}

export function Sidebar({ userRole, className }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const role = userRole ?? profile?.role;
  if (!role) return null;

  const menus = getMenusByRole(role);

  return (
    <ShadcnSidebar
      className={cn(
        "top-20 h-[calc(100svh-5rem)] group-data-[side=left]:border-none group-data-[side=right]:border-none",
        className,
      )}
      style={
        {
          "--sidebar": "var(--bg-light)",
          "--sidebar-foreground": "var(--text)",
          "--sidebar-accent": "var(--primary-20)",
          "--sidebar-accent-foreground": "var(--primary)",
          "--sidebar-border": "var(--border-muted)",
        } as CSSProperties
      }
      collapsible="offcanvas"
    >
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menus.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-10 rounded-lg text-[color:var(--text)] hover:bg-[var(--primary-20)] hover:text-[color:var(--primary)] data-[active=true]:bg-[var(--primary-20)] data-[active=true]:text-[color:var(--primary)]"
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  );
}
