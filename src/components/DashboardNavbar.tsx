"use client";

import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { ThemeToggler } from "@/components/ThemeToggler";

interface DashboardNavbarProps {
  title?: string;
  subtitle?: string;
  showHomeButton?: boolean;
}

export function DashboardNavbar({
  title = "CareConnect",
  subtitle,
  showHomeButton = false,
}: DashboardNavbarProps) {
  return (
    <nav
      className="sticky top-0 z-50 md:-ml-64 md:w-[calc(100%+16rem)]"
      style={{
        background: "var(--bg-light)",
        borderBottom: "1px solid var(--border-muted)",
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.jpeg"
            alt="CareConnect Logo"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--primary)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showHomeButton && (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          )}
          <ThemeToggler />
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
