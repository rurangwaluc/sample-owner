import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";

const highlights = [
  {
    title: "Multi-branch control",
    description:
      "Manage all business branches from one owner account with clear separation by location, role, and responsibility.",
  },
  {
    title: "Cash discipline",
    description:
      "Support daily cash operations with stronger accountability across cashiers, sellers, and managers.",
  },
  {
    title: "Role-based permissions",
    description:
      "Owner, admin, manager, store keeper, seller, and cashier access stay properly separated.",
  },
  {
    title: "Audit visibility",
    description:
      "Critical actions can be tracked so the owner has operational visibility instead of guesswork.",
  },
];

const metrics = [
  { value: "3+", label: "Branch-ready structure" },
  { value: "6", label: "Business roles" },
  { value: "1", label: "Owner control center" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <section className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-300 bg-stone-900 text-sm font-bold text-white dark:border-stone-700 dark:bg-stone-100 dark:text-stone-950">
              BCS
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
                Business Control System
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Retail operations command center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 dark:border-stone-700 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              Owner Login
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-stone-100 dark:bg-stone-950">
        <div className="mx-auto grid min-h-[calc(100vh-77px)] w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
              Built for real shop operations
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight text-stone-950 dark:text-stone-50 sm:text-5xl lg:text-6xl">
              Full business operations control across every branch.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-700 dark:text-stone-300 sm:text-lg">
              BCS helps the owner control branches, staff permissions, business
              activity, and operational discipline from one serious system built
              for real retail shops.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
              >
                Enter Owner Dashboard
              </Link>

              <a
                href="#features"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
              >
                View System Features
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {metrics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
                >
                  <div className="text-2xl font-black text-stone-950 dark:text-stone-50 sm:text-3xl">
                    {item.value}
                  </div>
                  <div className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-stone-800 dark:bg-stone-900 sm:p-5">
              <div className="rounded-[24px] border border-stone-200 bg-stone-950 p-4 text-white dark:border-stone-700 dark:bg-stone-100 dark:text-stone-950 sm:p-6">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 dark:border-stone-300 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500">
                      Owner overview
                    </p>
                    <h2 className="mt-2 text-xl font-bold">
                      Business visibility
                    </h2>
                  </div>

                  <div className="inline-flex w-fit rounded-full border border-emerald-900/30 bg-emerald-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200 dark:border-emerald-700/40 dark:bg-emerald-100 dark:text-emerald-900">
                    Operations ready
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:border-stone-300 dark:bg-stone-200">
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-400 dark:text-stone-600">
                      Branches
                    </p>
                    <p className="mt-3 text-3xl font-black">3</p>
                    <p className="mt-2 text-sm leading-6 text-stone-300 dark:text-stone-700">
                      Multi-location structure designed for central owner
                      control.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:border-stone-300 dark:bg-stone-200">
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-400 dark:text-stone-600">
                      Permissions
                    </p>
                    <p className="mt-3 text-3xl font-black">Strict</p>
                    <p className="mt-2 text-sm leading-6 text-stone-300 dark:text-stone-700">
                      Role separation supports accountability and safer
                      operations.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 dark:border-stone-300 dark:bg-stone-200">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-400 dark:text-stone-600">
                    Core promise
                  </p>
                  <p className="mt-3 text-base font-semibold leading-7 text-white dark:text-stone-950 sm:text-lg">
                    One owner account. Clear branch control. Serious operational
                    discipline.
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    "Cross-branch control for the owner",
                    "Role-driven access by responsibility",
                    "Better operational visibility across locations",
                  ].map((line) => (
                    <div
                      key={line}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 dark:border-stone-300 dark:bg-stone-200"
                    >
                      <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                      <p className="text-sm leading-6 text-stone-200 dark:text-stone-800">
                        {line}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-t border-stone-200 bg-white px-4 py-16 dark:border-stone-800 dark:bg-stone-900 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
              Why this system matters
            </p>
            <h2 className="mt-4 text-3xl font-black text-stone-950 dark:text-stone-50 sm:text-4xl">
              Built for business owners who want control, not confusion.
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-700 dark:text-stone-300">
              A real business system should help the owner reduce mistakes,
              improve oversight, and make branch operations easier to manage
              every day.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 transition hover:-translate-y-0.5 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-800"
              >
                <div className="inline-flex rounded-2xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                  BCS
                </div>
                <h3 className="mt-4 text-lg font-bold text-stone-950 dark:text-stone-50">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-stone-300">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
