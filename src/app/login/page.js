"use client";

import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import { login } from "../../lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.11 4.93" />
      <path d="M6.61 6.61A17.32 17.32 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 5.39-1.39" />
    </svg>
  );
}

function safeErrorMessage(error) {
  if (!error) return "Login failed";

  if (typeof error?.data?.error === "string" && error.data.error.trim()) {
    return error.data.error.trim();
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return "Login failed";
}

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "owner@bcs.com",
    password: "Owner@123",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorText("");

    try {
      await login(
        String(form.email || "")
          .trim()
          .toLowerCase(),
        String(form.password || ""),
      );

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorText(safeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <section className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-300 bg-stone-900 text-sm font-bold text-white dark:border-stone-700 dark:bg-stone-100 dark:text-stone-950">
              BCS
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
                Business Control System
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Owner access portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Back
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_440px] lg:gap-12">
          <div className="order-2 lg:order-1">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                Secure owner authentication
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight text-stone-950 dark:text-stone-50 sm:text-5xl">
                Sign in to manage branches, staff, and operations.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-stone-700 dark:text-stone-300">
                Access the owner dashboard to monitor business activity, manage
                branch structure, and keep operations under control.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Branch visibility",
                  text: "See business structure across locations from one owner account.",
                },
                {
                  title: "User control",
                  text: "Manage staff roles, branch assignment, and access discipline.",
                },
                {
                  title: "Operational trust",
                  text: "Run a serious system built for accountability and control.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
                >
                  <h2 className="text-base font-bold text-stone-950 dark:text-stone-50">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-stone-300">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Access standard
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-stone-300">
                    Owner access should feel controlled, clean, and ready for
                    real business usage.
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Security mindset
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-stone-300">
                    Keep authentication simple, professional, and consistent
                    with the rest of the system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="rounded-[32px] border border-stone-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-stone-800 dark:bg-stone-900 sm:p-6">
              <div className="border-b border-stone-200 pb-5 dark:border-stone-800">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
                  Owner login
                </p>
                <h2 className="mt-3 text-2xl font-black text-stone-950 dark:text-stone-50">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                  Enter your credentials to continue to the business control
                  dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-stone-800 dark:text-stone-200"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="owner@business.com"
                    className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-500 dark:focus:ring-stone-800"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-stone-800 dark:text-stone-200"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 pr-14 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-500 dark:focus:ring-stone-800"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {errorText ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                    {errorText}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !String(form.email || "").trim() ||
                    !String(form.password || "").trim()
                  }
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
                >
                  {submitting ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
