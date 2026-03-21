"use client";

import {
  EmptyState,
  SectionCard,
  StatCard,
  safe,
  safeDate,
} from "./OwnerShared";

import { resolveAssetUrl } from "../../lib/apiUpload";

function branchStatusTone(status) {
  const value = safe(status).toUpperCase();

  if (value === "ACTIVE") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
  }

  if (value === "CLOSED") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
  }

  if (value === "ARCHIVED") {
    return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300";
}

function normalizeBankAccounts(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((acc) => {
      if (!acc) return "";

      if (typeof acc === "string") {
        return acc.trim();
      }

      const bankName = safe(acc.bankName) || safe(acc.bank) || safe(acc.name);
      const accountName = safe(acc.accountName) || safe(acc.holderName);
      const accountNumber = safe(acc.accountNumber) || safe(acc.number);

      return [bankName, accountName, accountNumber].filter(Boolean).join(" • ");
    })
    .filter(Boolean);
}

function DetailRow({ label, value, monospace = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-200 py-3 last:border-b-0 dark:border-stone-800">
      <span className="text-sm text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <span
        className={
          "max-w-[65%] break-words text-right text-sm font-semibold text-stone-900 dark:text-stone-100 " +
          (monospace ? "font-mono" : "")
        }
      >
        {value || "-"}
      </span>
    </div>
  );
}

export default function BranchDetailsDrawer({
  open,
  location,
  onClose,
  onOpenEdit,
  onOpenClose,
  onOpenReopen,
  onOpenArchive,
}) {
  const logoUrl = safe(location?.logoUrl)
    ? resolveAssetUrl(location.logoUrl)
    : "";

  const bankAccounts = normalizeBankAccounts(location?.bankAccounts);

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
          "fixed right-0 top-0 z-[121] h-[100dvh] w-full transform bg-stone-50 shadow-2xl transition-transform duration-300 dark:bg-stone-950 " +
          "max-w-full border-l border-stone-200 dark:border-stone-800 sm:max-w-[760px] xl:max-w-[860px] " +
          (open ? "translate-x-0" : "translate-x-full")
        }
        aria-hidden={!open}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-stone-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                  Branch detail
                </div>
                <h2 className="mt-2 truncate text-2xl font-black tracking-[-0.02em] text-stone-950 dark:text-stone-50 sm:text-[30px]">
                  {safe(location?.name) || "Branch"}
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  Full identity, branding, and operational control in one view.
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
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {!location ? (
              <SectionCard
                title="Selected branch detail"
                subtitle="Pick a branch card to inspect its full identity and business-ready branding data."
              >
                <EmptyState text="Select any branch to view logo, website, phone, identity, and operational detail." />
              </SectionCard>
            ) : (
              <div className="space-y-5 pb-6">
                <SectionCard
                  title="Selected branch detail"
                  subtitle="This is the branch identity that should drive documents, branch switching, and operational trust."
                  right={
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenEdit?.(location)}
                        className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                      >
                        Edit
                      </button>

                      {safe(location?.status).toUpperCase() === "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => onOpenClose?.(location)}
                          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                        >
                          Close
                        </button>
                      ) : null}

                      {safe(location?.status).toUpperCase() === "CLOSED" ? (
                        <button
                          type="button"
                          onClick={() => onOpenReopen?.(location)}
                          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                        >
                          Reopen
                        </button>
                      ) : null}

                      {safe(location?.status).toUpperCase() !== "ARCHIVED" ? (
                        <button
                          type="button"
                          onClick={() => onOpenArchive?.(location)}
                          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                        >
                          Archive
                        </button>
                      ) : null}
                    </div>
                  }
                >
                  <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={`${safe(location?.name) || "Branch"} logo`}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="text-center">
                              <div className="text-xs font-black uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                                No logo
                              </div>
                              <div className="mt-2 text-sm font-bold text-stone-700 dark:text-stone-300">
                                {safe(location?.code) || "—"}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-black tracking-[-0.02em] text-stone-950 dark:text-stone-50">
                              {safe(location?.name) || "-"}
                            </h3>

                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${branchStatusTone(
                                location?.status,
                              )}`}
                            >
                              {safe(location?.status) || "-"}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                            Branch code:{" "}
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              {safe(location?.code) || "-"}
                            </span>
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                                Phone
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                                {safe(location?.phone) || "-"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                                Website
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                                {safe(location?.website) || "-"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                                Email
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                                {safe(location?.email) || "-"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                                Address
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-words">
                                {safe(location?.address) || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {(safe(location?.tin) ||
                        safe(location?.momoCode) ||
                        bankAccounts.length > 0) && (
                        <div className="mt-5 space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                                TIN
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                                {safe(location?.tin) || "-"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                                MoMo code
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 break-all">
                                {safe(location?.momoCode) || "-"}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                              Bank accounts
                            </p>

                            {bankAccounts.length ? (
                              <div className="mt-2 space-y-2">
                                {bankAccounts.map((acc, idx) => (
                                  <div
                                    key={idx}
                                    className="break-words text-sm font-semibold text-stone-900 dark:text-stone-100"
                                  >
                                    {acc}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                                -
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Operational detail
                        </p>

                        <div className="mt-4">
                          <DetailRow
                            label="Opened at"
                            value={safeDate(location?.openedAt)}
                          />
                          <DetailRow
                            label="Closed at"
                            value={safeDate(location?.closedAt)}
                          />
                          <DetailRow
                            label="Archived at"
                            value={safeDate(location?.archivedAt)}
                          />
                          <DetailRow
                            label="Last updated"
                            value={safeDate(location?.updatedAt)}
                          />
                          <DetailRow
                            label="Close reason"
                            value={safe(location?.closeReason)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <StatCard
                          label="Users"
                          value={location?.usersCount ?? 0}
                          sub="Assigned users"
                        />
                        <StatCard
                          label="Products"
                          value={location?.productsCount ?? 0}
                          sub="Catalog items"
                        />
                        <StatCard
                          label="Sales"
                          value={location?.salesCount ?? 0}
                          sub="Recorded sales"
                        />
                        <StatCard
                          label="Payments"
                          value={location?.paymentsCount ?? 0}
                          sub="Recorded payments"
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
