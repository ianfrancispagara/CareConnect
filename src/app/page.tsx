import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { ThemeToggler } from "@/components/ThemeToggler";
import { getUser } from "@/lib/actions/auth";
import { highlights, stats, steps } from "@/lib/constants/landingPage";

export default async function Home() {
  const user = await getUser();

  if (user) {
    if (user.role === "admin") {
      redirect("/dashboard/admin");
    }

    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(111,209,108,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_30%),linear-gradient(180deg,var(--bg-dark),var(--bg))] text-[var(--text)]">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <ThemeToggler />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-screen-2xl items-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex w-full flex-col items-center justify-center">
          <section className="flex w-full max-w-5xl flex-col items-center space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-muted)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--text-muted)] backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              Caraga State University PSG Referral System
            </div>

            <div className="mx-auto max-w-4xl space-y-5 text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                A calmer way to connect students with support.
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
                CareConnect helps students submit referrals, schedule sessions,
                and message securely while PSG members and admins keep every
                case moving with less friction.
              </p>
            </div>

            <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--bg-dark)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border-muted)] bg-[rgba(255,255,255,0.03)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]"
              >
                Create account
              </Link>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[var(--border-muted)] bg-[rgba(255,255,255,0.04)] p-4 text-center backdrop-blur"
                >
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {stat.value}
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex w-full flex-col gap-4">
              <div className="overflow-hidden rounded-3xl border border-[var(--border-muted)] bg-[rgba(255,255,255,0.04)] shadow-sm">
                <Image
                  src="/psg.jpg"
                  alt="PSG recruitment poster"
                  width={1200}
                  height={800}
                  className="h-auto w-full max-h-[500px] bg-black/10 object-contain sm:max-h-[600px] md:max-h-[700px]"
                  priority
                />
              </div>

              <div className="flex flex-col justify-between gap-6 rounded-3xl border border-[var(--border-muted)] bg-[rgba(255,255,255,0.04)] p-5 backdrop-blur md:flex-row md:items-center md:p-6">
                <div className="max-w-3xl text-left">
                  <h2 className="text-lg font-semibold text-[var(--text)] sm:text-xl">
                    PSG Recruitment — Join the Peer Support Group
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    The Peer Support Group (PSG) is now recruiting student
                    facilitators. Attend essential trainings and become part of
                    a supportive campus community. Click below to register or
                    learn more about the requirements and schedule.
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                  <a
                    href="https://tinyurl.com/PSGCSU"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--bg-dark)] transition-transform duration-150 hover:-translate-y-0.5"
                  >
                    Register
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="https://tinyurl.com/PSGCSU"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-muted)] bg-[rgba(255,255,255,0.03)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition-transform duration-150 hover:-translate-y-0.5 hover:border-[var(--primary)]"
                  >
                    More info
                  </a>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-4 text-left md:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-3xl border border-[var(--border-muted)] bg-[rgba(255,255,255,0.04)] p-5 shadow-md hover:shadow-lg backdrop-blur"
                  >
                    <div className="mb-4 inline-flex rounded-2xl bg-[var(--primary-20)] p-3 text-[var(--primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="w-full rounded-3xl border border-[var(--border-muted)] bg-[rgba(255,255,255,0.05)] p-5 text-left backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-lg font-semibold text-[var(--text)]">
                    How it works
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    The flow stays simple: access the right portal, submit or
                    review cases, then keep support moving with appointments and
                    follow-up messaging.
                  </p>
                </div>
                <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-muted)] px-4 py-2 text-sm text-[var(--text-muted)]">
                  <Users className="h-4 w-4 text-[var(--primary)]" />
                  Built for students and support staff
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-[var(--border-muted)] bg-[rgba(255,255,255,0.03)] p-4"
                  >
                    <div className="mb-3 text-sm font-semibold text-[var(--primary)]">
                      0{index + 1}
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full rounded-3xl border border-[var(--warning-bg)] bg-[var(--warning-bg)]/40 p-5 text-center">
              <p className="text-sm leading-6 text-[var(--text)]">
                <strong>Emergency:</strong> If a student is in immediate crisis,
                contact the National Mental Health Crisis Hotline at{" "}
                <strong>1553</strong> or go to the OCCS office right away.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
