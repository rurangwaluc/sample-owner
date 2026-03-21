"use client";

import { useEffect, useRef, useState } from "react";

import ThemeToggle from "./ThemeToggle";

function safe(v) {
  return String(v ?? "").trim();
}

function MenuIcon({ open = false }) {
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <span
        className={
          "absolute block h-0.5 w-5 rounded-full bg-current transition-all duration-300 " +
          (open ? "translate-y-0 rotate-45" : "-translate-y-1.5 rotate-0")
        }
      />
      <span
        className={
          "absolute block h-0.5 w-5 rounded-full bg-current transition-all duration-300 " +
          (open ? "opacity-0" : "opacity-100")
        }
      />
      <span
        className={
          "absolute block h-0.5 w-5 rounded-full bg-current transition-all duration-300 " +
          (open ? "translate-y-0 -rotate-45" : "translate-y-1.5 rotate-0")
        }
      />
    </span>
  );
}

export default function AppShell({
  title,
  subtitle,
  user,
  onLogout,
  navItems = [],
  activeKey,
  onNavigate,
  children,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeKey]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!mobileNavRef.current) return;
      if (!mobileNavRef.current.contains(event.target)) {
        setMobileNavOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const activeNavItem =
    navItems.find((n) => String(n.key) === String(activeKey)) || null;

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-stone-900 dark:text-stone-100 sm:text-lg">
                {safe(title)}
              </div>

              {safe(subtitle) ? (
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-stone-600 dark:text-stone-400 sm:text-sm">
                  {safe(subtitle)}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:ml-auto lg:justify-end">
              <div className="lg:hidden" ref={mobileNavRef}>
                <button
                  type="button"
                  aria-label={
                    mobileNavOpen ? "Close navigation" : "Open navigation"
                  }
                  aria-expanded={mobileNavOpen}
                  onClick={() => setMobileNavOpen((prev) => !prev)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-800 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  <MenuIcon open={mobileNavOpen} />
                </button>

                <div
                  className={
                    "absolute left-4 right-4 top-[calc(100%+10px)] origin-top rounded-2xl border border-stone-200 bg-white p-3 shadow-2xl transition-all duration-200 dark:border-stone-800 dark:bg-stone-900 sm:left-5 sm:right-5 " +
                    (mobileNavOpen
                      ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                      : "pointer-events-none -translate-y-2 scale-95 opacity-0")
                  }
                >
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 dark:border-stone-800 dark:bg-stone-950">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                        Current tab
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                        {safe(activeNavItem?.label || "Dashboard")}
                      </p>
                    </div>

                    {activeNavItem?.badge != null ? (
                      <span className="inline-flex rounded-lg bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                        {activeNavItem.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {navItems.map((n) => {
                        const active = String(n.key) === String(activeKey);

                        return (
                          <button
                            key={n.key}
                            type="button"
                            onClick={() => {
                              onNavigate?.(n.key);
                              setMobileNavOpen(false);
                            }}
                            className={
                              "flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition " +
                              (active
                                ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                                : "border-stone-200 bg-white text-stone-900 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800")
                            }
                          >
                            <span className="truncate">{n.label}</span>

                            {n.badge != null ? (
                              <span
                                className={
                                  "shrink-0 rounded-lg px-2 py-0.5 text-xs " +
                                  (active
                                    ? "bg-white/15 dark:bg-stone-950/10"
                                    : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300")
                                }
                              >
                                {n.badge}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <ThemeToggle />

              {user?.email ? (
                <div className="hidden items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 md:flex dark:border-stone-800 dark:bg-stone-900">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white dark:bg-stone-100 dark:text-stone-950">
                    {(String(user.email || "U")[0] || "U").toUpperCase()}
                  </div>
                  <div className="max-w-[220px] truncate text-xs text-stone-700 dark:text-stone-300">
                    {user.email}
                  </div>
                </div>
              ) : null}

              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 active:bg-stone-700 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 lg:hidden">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                Selected tab
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                  {safe(activeNavItem?.label || "Dashboard")}
                </p>

                {activeNavItem?.badge != null ? (
                  <span className="inline-flex rounded-lg bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                    {activeNavItem.badge}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-5 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-fit rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900 lg:block">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Navigation
          </div>

          <div className="space-y-1">
            {navItems.map((n) => {
              const active = String(n.key) === String(activeKey);

              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => onNavigate?.(n.key)}
                  className={
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition " +
                    (active
                      ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                      : "border-transparent bg-white text-stone-900 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800")
                  }
                >
                  <span className="truncate">{n.label}</span>

                  {n.badge != null ? (
                    <span
                      className={
                        "rounded-lg px-2 py-0.5 text-xs " +
                        (active
                          ? "bg-white/15 dark:bg-stone-950/10"
                          : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300")
                      }
                    >
                      {n.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
            Move across operations without losing context. This owner workspace
            is designed for cross-branch visibility, disciplined execution, and
            traceable decisions.
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
