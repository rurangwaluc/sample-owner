"use client";

import { EmptyState, SectionCard, StatCard, safe } from "../OwnerShared";
import { useMemo, useState } from "react";

import BranchDetailsDrawer from "../BranchDetailsDrawer";
import { resolveAssetUrl } from "../../../lib/apiUpload";

const BRANCH_STATUS_FILTERS = ["ALL", "ACTIVE", "CLOSED", "ARCHIVED"];

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

function InfoMini({ label, value, breakAll = false }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p
        className={
          "mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50 " +
          (breakAll ? "break-all" : "break-words")
        }
      >
        {value || "-"}
      </p>
    </div>
  );
}

function BranchIdentityCard({
  location,
  active,
  onSelect,
  onOpenEdit,
  onOpenClose,
  onOpenReopen,
  onOpenArchive,
}) {
  const logoUrl = safe(location?.logoUrl)
    ? resolveAssetUrl(location.logoUrl)
    : "";

  const bankAccounts = normalizeBankAccounts(location?.bankAccounts);
  const firstBankAccount = bankAccounts[0] || "";

  return (
    <div
      className={
        "rounded-[28px] border p-5 transition shadow-sm " +
        (active
          ? "border-stone-900 bg-stone-50 dark:border-stone-100 dark:bg-stone-900"
          : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-700")
      }
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => onSelect?.(location)}
          className="flex min-w-0 flex-1 items-start gap-4 text-left"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 dark:border-stone-700 dark:bg-stone-900">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${safe(location?.name) || "Branch"} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-xs font-black uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                {safe(location?.code) || "LOGO"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-stone-950 dark:text-stone-50">
                {safe(location?.name) || "-"}
              </h3>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${branchStatusTone(
                  location?.status,
                )}`}
              >
                {safe(location?.status) || "-"}
              </span>
            </div>

            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Code:{" "}
              <span className="font-semibold">
                {safe(location?.code) || "-"}
              </span>
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InfoMini label="Phone" value={safe(location?.phone)} breakAll />
              <InfoMini label="Email" value={safe(location?.email)} breakAll />
              <InfoMini
                label="Website"
                value={safe(location?.website)}
                breakAll
              />
              <InfoMini
                label="TIN number"
                value={safe(location?.tin)}
                breakAll
              />
              <InfoMini
                label="MoMo code"
                value={safe(location?.momoCode)}
                breakAll
              />
              <InfoMini label="Address" value={safe(location?.address)} />
            </div>

            {firstBankAccount ? (
              <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                  Bank account
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                  {firstBankAccount}
                </p>
                {bankAccounts.length > 1 ? (
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    +{bankAccounts.length - 1} more account
                    {bankAccounts.length - 1 === 1 ? "" : "s"} in details
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </button>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenEdit?.(location)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Edit
          </button>

          {safe(location?.status).toUpperCase() === "ACTIVE" ? (
            <button
              type="button"
              onClick={() => onOpenClose?.(location)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Close
            </button>
          ) : null}

          {safe(location?.status).toUpperCase() === "CLOSED" ? (
            <button
              type="button"
              onClick={() => onOpenReopen?.(location)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Reopen
            </button>
          ) : null}

          {safe(location?.status).toUpperCase() !== "ARCHIVED" ? (
            <button
              type="button"
              onClick={() => onOpenArchive?.(location)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Archive
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Users
          </p>
          <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
            {location?.usersCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Products
          </p>
          <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
            {location?.productsCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Sales
          </p>
          <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
            {location?.salesCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Payments
          </p>
          <p className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
            {location?.paymentsCount ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerBranchesTab({
  locations = [],
  selectedLocationId,
  onSelectLocation,
  branchStatusFilter,
  onChangeBranchStatusFilter,
  onOpenCreate,
  onOpenEdit,
  onOpenClose,
  onOpenReopen,
  onOpenArchive,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLocation, setDrawerLocation] = useState(null);

  const filteredLocations = useMemo(() => {
    const list = Array.isArray(locations) ? locations : [];

    return list.filter((row) => {
      if (branchStatusFilter === "ALL") return true;
      return safe(row?.status).toUpperCase() === branchStatusFilter;
    });
  }, [locations, branchStatusFilter]);

  const totalCounts = useMemo(() => {
    const list = Array.isArray(locations) ? locations : [];

    return {
      total: list.length,
      active: list.filter((x) => safe(x?.status).toUpperCase() === "ACTIVE")
        .length,
      closed: list.filter((x) => safe(x?.status).toUpperCase() === "CLOSED")
        .length,
      archived: list.filter((x) => safe(x?.status).toUpperCase() === "ARCHIVED")
        .length,
    };
  }, [locations]);

  function openDetails(location) {
    setDrawerLocation(location || null);
    setDrawerOpen(true);
    onSelectLocation?.(location?.id ?? null);
  }

  function closeDetails() {
    setDrawerOpen(false);
  }

  return (
    <>
      <div className="space-y-6">
        <SectionCard
          title="Branch control"
          subtitle="Branch structure should be visible, editable, and operationally trustworthy from one owner screen."
          right={
            <button
              type="button"
              onClick={() => onOpenCreate?.()}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              Create branch
            </button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total branches"
              value={totalCounts.total}
              sub="All branch records"
            />
            <StatCard
              label="Active"
              value={totalCounts.active}
              sub="Operational branches"
            />
            <StatCard
              label="Closed"
              value={totalCounts.closed}
              sub="Closed but retained"
            />
            <StatCard
              label="Archived"
              value={totalCounts.archived}
              sub="History only"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {BRANCH_STATUS_FILTERS.map((status) => {
              const active = branchStatusFilter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onChangeBranchStatusFilter?.(status)}
                  className={
                    "inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition " +
                    (active
                      ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800")
                  }
                >
                  {status === "ALL" ? "All branches" : status}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            {filteredLocations.length === 0 ? (
              <EmptyState text="No branches match the current status filter." />
            ) : (
              <div className="grid gap-4">
                {filteredLocations.map((location) => (
                  <BranchIdentityCard
                    key={location.id}
                    location={location}
                    active={String(location.id) === String(selectedLocationId)}
                    onSelect={openDetails}
                    onOpenEdit={onOpenEdit}
                    onOpenClose={onOpenClose}
                    onOpenReopen={onOpenReopen}
                    onOpenArchive={onOpenArchive}
                  />
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <BranchDetailsDrawer
        open={drawerOpen}
        location={drawerLocation}
        onClose={closeDetails}
        onOpenEdit={onOpenEdit}
        onOpenClose={onOpenClose}
        onOpenReopen={onOpenReopen}
        onOpenArchive={onOpenArchive}
      />
    </>
  );
}
