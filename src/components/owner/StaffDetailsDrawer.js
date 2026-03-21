"use client";

import { StatCard, safe, safeDate, userActiveTone } from "./OwnerShared";

function normalizeRoleLabel(role) {
  const value = safe(role).replaceAll("_", " ");
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function roleTone(role) {
  const value = safe(role).toUpperCase();

  if (value.includes("MANAGER")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
  }

  if (value.includes("CASH")) {
    return "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300";
  }

  if (value.includes("STORE")) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
  }

  if (value.includes("SELL")) {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-200 py-3.5 last:border-b-0 dark:border-stone-800">
      <span className="text-sm text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <span className="max-w-[65%] break-words text-right text-sm font-semibold text-stone-900 dark:text-stone-100">
        {value || "-"}
      </span>
    </div>
  );
}

function SectionBlock({ title, subtitle, children }) {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-4">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {subtitle}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function UserAvatar({ user }) {
  const name = safe(user?.name);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border border-stone-200 bg-gradient-to-br from-stone-100 to-stone-200 text-2xl font-black tracking-[0.12em] text-stone-700 shadow-sm dark:border-stone-700 dark:from-stone-800 dark:to-stone-900 dark:text-stone-200">
      {initials || "U"}
    </div>
  );
}

export default function StaffDetailsDrawer({
  open,
  user,
  onClose,
  onOpenEdit,
  onOpenResetPassword,
  onOpenDeactivate,
}) {
  return (
    <>
      <div
        className={
          "fixed inset-0 z-[120] bg-black/45 backdrop-blur-[2px] transition-opacity duration-200 " +
          (open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0")
        }
        onClick={onClose}
      />

      <aside
        className={
          "fixed right-0 top-0 z-[121] h-[100dvh] w-full transform border-l border-stone-200 bg-stone-50 shadow-2xl transition-transform duration-300 dark:border-stone-800 dark:bg-stone-950 " +
          "max-w-full sm:max-w-[760px] xl:max-w-[860px] " +
          (open ? "translate-x-0" : "translate-x-full")
        }
        aria-hidden={!open}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-stone-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                  Staff detail
                </div>
                <h2 className="mt-2 truncate text-2xl font-black tracking-[-0.02em] text-stone-950 dark:text-stone-50 sm:text-[30px]">
                  {safe(user?.name) || "Staff member"}
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  Account identity, branch assignment, and owner-level actions.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <button
                type="button"
                onClick={() => user && onOpenEdit?.(user)}
                disabled={!user}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => user && onOpenResetPassword?.(user)}
                disabled={!user}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Reset password
              </button>

              {user?.isActive ? (
                <button
                  type="button"
                  onClick={() => user && onOpenDeactivate?.(user)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200 sm:col-span-2 xl:col-span-1"
                >
                  Deactivate
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {!user ? (
              <div className="rounded-[28px] border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
                No staff member selected.
              </div>
            ) : (
              <div className="space-y-5 pb-6">
                <SectionBlock
                  title="Identity"
                  subtitle="Who this user is, what role they hold, and which branch they belong to."
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <UserAvatar user={user} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-[28px] font-black tracking-[-0.03em] text-stone-950 dark:text-stone-50">
                          {safe(user?.name) || "-"}
                        </h3>

                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${userActiveTone(
                            !!user?.isActive,
                          )}`}
                        >
                          {user?.isActive ? "Active" : "Inactive"}
                        </span>

                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleTone(
                            user?.role,
                          )}`}
                        >
                          {normalizeRoleLabel(user?.role)}
                        </span>
                      </div>

                      <div className="mt-3 break-all text-sm text-stone-600 dark:text-stone-300">
                        {safe(user?.email) || "-"}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                            Role
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {normalizeRoleLabel(user?.role)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                            Branch
                          </p>
                          <p className="mt-2 break-words text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {safe(user?.location?.name) || "-"}
                            {safe(user?.location?.code)
                              ? ` (${safe(user.location.code)})`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionBlock>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Status"
                    value={user?.isActive ? "Active" : "Inactive"}
                    sub="Account state"
                  />
                  <StatCard
                    label="Role"
                    value={normalizeRoleLabel(user?.role)}
                    sub="Current assignment"
                  />
                  <StatCard
                    label="Created"
                    value={safeDate(user?.createdAt)}
                    sub="Account created"
                  />
                  <StatCard
                    label="Last seen"
                    value={safeDate(user?.lastSeenAt)}
                    sub="Most recent activity"
                  />
                </div>

                <SectionBlock
                  title="Account detail"
                  subtitle="Detailed account and branch assignment information."
                >
                  <div>
                    <DetailRow label="Full name" value={safe(user?.name)} />
                    <DetailRow label="Email" value={safe(user?.email)} />
                    <DetailRow
                      label="Role"
                      value={normalizeRoleLabel(user?.role)}
                    />
                    <DetailRow
                      label="Branch"
                      value={
                        safe(user?.location?.name)
                          ? `${safe(user.location.name)}${
                              safe(user?.location?.code)
                                ? ` (${safe(user.location.code)})`
                                : ""
                            }`
                          : "-"
                      }
                    />
                    <DetailRow
                      label="Branch status"
                      value={safe(user?.location?.status)}
                    />
                    <DetailRow
                      label="Created"
                      value={safeDate(user?.createdAt)}
                    />
                    <DetailRow
                      label="Last seen"
                      value={safeDate(user?.lastSeenAt)}
                    />
                  </div>
                </SectionBlock>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
