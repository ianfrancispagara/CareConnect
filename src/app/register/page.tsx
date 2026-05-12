import RegistrationForm from "./components/RegistrationForm";
import { ThemeToggler } from "@/components/ThemeToggler";
import { Loader } from "@/components/Loader";
import Image from "next/image";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div
      className="flex min-h-screen relative"
      style={{ background: "var(--bg)", transition: "background 0.3s" }}
    >
      <div className="absolute top-4 left-4 z-50 md:top-6 md:left-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-all hover:-translate-x-1 hover:shadow-md"
          style={{
            color: "var(--text)",
            backgroundColor: "var(--bg-light)",
            borderColor: "var(--border-muted)",
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggler />
      </div>

      {/* Left side - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 pt-20 flex-col justify-between"
        style={{
          background: "var(--bg-dark)",
          transition: "background 0.3s, border-radius 0.3s",
        }}
      >
        <div>
          <h1
            className="text-3xl font-bold mb-4"
            style={{ color: "var(--primary)" }}
          >
            CareConnect
          </h1>
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            Caraga State University PSG Referral System
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/authlogo.png"
            alt="CareConnect Logo"
            width={600}
            height={600}
            style={{
              objectFit: "contain",
              filter: "var(--auth-image-filter)",
              transition: "filter 0.3s",
            }}
          />
        </div>
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Your mental health journey starts here. Join our supportive
            community.
          </p>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Suspense fallback={<Loader size={32} text="Loading form..." />}>
          <RegistrationForm />
        </Suspense>
      </div>
    </div>
  );
}
