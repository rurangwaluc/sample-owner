"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";
import {
  AlertBox,
  EmptyState,
  FormInput,
  FormSelect,
  SectionCard,
  StatCard,
  safe,
  safeDate,
  safeNumber,
} from "../OwnerShared";

const PAGE_SIZE = 20;

const METHOD_OPTIONS = [
  { value: "", label: "All methods" },
  { value: "CASH", label: "Cash" },
  { value: "MOMO", label: "MoMo" },
  { value: "BANK", label: "Bank" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
];

const DIRECTION_OPTIONS = [
  { value: "", label: "All directions" },
  { value: "IN", label: "Money in" },
  { value: "OUT", label: "Money out" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "SALE_PAYMENT", label: "Sale payment" },
  { value: "CREDIT_SETTLEMENT", label: "Credit settlement" },
  { value: "PETTY_CASH_IN", label: "Petty cash in" },
  { value: "PETTY_CASH_OUT", label: "Petty cash out" },
  { value: "VERSEMENT", label: "Bank deposit / versement" },
  { value: "OPENING_BALANCE", label: "Opening balance" },
  { value: "REFUND", label: "Refund" },
];

function money(v) {
  return safeNumber(v).toLocaleString();
}

function methodTone(method) {
  const m = safe(method).toUpperCase();

  if (m === "CASH") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (m === "MOMO") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }
  if (m === "BANK") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (m === "CARD") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function directionTone(direction) {
  const d = safe(direction).toUpperCase();

  if (d === "IN") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (d === "OUT") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function sessionStatusTone(status) {
  const s = safe(status).toUpperCase();

  if (s === "OPEN") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (s === "CLOSED") {
    return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
  }

  return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function LedgerRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[90px_170px_140px_120px_130px_150px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
        (active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
          : "bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/70")
      }
    >
      <div className="text-sm font-bold">#{safe(row?.id) || "-"}</div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {safe(row?.locationName) || "-"}
        </p>
        <p
          className={
            "mt-1 truncate text-xs " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          {safe(row?.locationCode) || "-"}
        </p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {safe(row?.cashierName) || "-"}
        </p>
        <p
          className={
            "mt-1 truncate text-xs " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          Cashier
        </p>
      </div>

      <div>
        <span
          className={
            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : directionTone(row?.direction))
          }
        >
          {safe(row?.direction) === "IN"
            ? "Money in"
            : safe(row?.direction) === "OUT"
              ? "Money out"
              : safe(row?.direction) || "-"}
        </span>
      </div>

      <div className="text-sm font-semibold">{money(row?.amount)}</div>

      <div className="flex flex-wrap gap-2">
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : methodTone(row?.method))
          }
        >
          {safe(row?.method) || "-"}
        </span>
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300")
          }
        >
          {safe(row?.type) || "-"}
        </span>
      </div>
    </button>
  );
}

function LedgerMobileRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "w-full rounded-2xl border p-4 text-left transition lg:hidden " +
        (active
          ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold">Ledger #{safe(row?.id) || "-"}</p>
          <p
            className={
              "mt-1 truncate text-xs " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            {safe(row?.locationName) || "-"}
            {safe(row?.locationCode) ? ` (${safe(row.locationCode)})` : ""}
          </p>
          <p
            className={
              "mt-1 truncate text-xs " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            {safe(row?.cashierName) || "-"}
          </p>
        </div>

        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : directionTone(row?.direction))
          }
        >
          {safe(row?.direction) === "IN"
            ? "In"
            : safe(row?.direction) === "OUT"
              ? "Out"
              : safe(row?.direction) || "-"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Amount
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.amount)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Method
          </p>
          <p className="mt-1 text-sm font-bold">{safe(row?.method) || "-"}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Type
          </p>
          <p className="mt-1 truncate text-sm font-bold">
            {safe(row?.type) || "-"}
          </p>
        </div>
      </div>
    </button>
  );
}

function SessionRow({ row }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Cash session #{safe(row?.id) || "-"}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {safe(row?.locationName) || "-"}
            {safe(row?.locationCode)
              ? ` (${safe(row.locationCode)})`
              : ""} · {safe(row?.cashierName) || "-"}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sessionStatusTone(
            row?.status,
          )}`}
        >
          {safe(row?.status) || "-"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Opened
          </p>
          <p className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {safeDate(row?.openedAt)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Closed
          </p>
          <p className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {safeDate(row?.closedAt)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Opening
          </p>
          <p className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {money(row?.openingBalance)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Closing
          </p>
          <p className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {money(row?.closingBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RefundRow({ row }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Refund #{safe(row?.id) || "-"}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {safe(row?.locationName) || "-"}
            {safe(row?.locationCode) ? ` (${safe(row.locationCode)})` : ""} ·
            Sale #{safe(row?.saleId) || "-"}
          </p>
        </div>

        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {money(row?.amount)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Created by
          </p>
          <p className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {safe(row?.createdByName) || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Created
          </p>
          <p className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {safeDate(row?.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
        {safe(row?.reason) || "No reason recorded."}
      </div>
    </div>
  );
}

export default function OwnerCashTab({ locations = [], users = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [sessionsData, setSessionsData] = useState({
    summary: null,
    sessions: [],
  });
  const [refundsData, setRefundsData] = useState({
    summary: null,
    refunds: [],
  });

  const [selectedLedgerId, setSelectedLedgerId] = useState(null);

  const [locationFilter, setLocationFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cashierIdFilter, setCashierIdFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [visibleLedgerCount, setVisibleLedgerCount] = useState(PAGE_SIZE);
  const [visibleSessionCount, setVisibleSessionCount] = useState(PAGE_SIZE);
  const [visibleRefundCount, setVisibleRefundCount] = useState(PAGE_SIZE);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const cashierOptions = useMemo(() => {
    return Array.isArray(users)
      ? users
          .filter(
            (row) =>
              safe(row?.role).toLowerCase() === "cashier" && !!row?.isActive,
          )
          .sort((a, b) => safe(a?.name).localeCompare(safe(b?.name)))
      : [];
  }, [users]);

  async function loadCash() {
    setLoading(true);
    setErrorText("");

    const params = new URLSearchParams();
    if (locationFilter) params.set("locationId", locationFilter);
    if (methodFilter) params.set("method", methodFilter);
    if (directionFilter) params.set("direction", directionFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (cashierIdFilter) params.set("cashierId", cashierIdFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const summaryUrl = `/owner/cash/summary${params.toString() ? `?${params.toString()}` : ""}`;

    const ledgerParams = new URLSearchParams(params);
    ledgerParams.set("limit", "200");
    const ledgerUrl = `/owner/cash/ledger?${ledgerParams.toString()}`;

    const sessionsParams = new URLSearchParams();
    if (locationFilter) sessionsParams.set("locationId", locationFilter);
    if (cashierIdFilter) sessionsParams.set("cashierId", cashierIdFilter);
    if (dateFrom) sessionsParams.set("dateFrom", dateFrom);
    if (dateTo) sessionsParams.set("dateTo", dateTo);
    sessionsParams.set("limit", "200");
    const sessionsUrl = `/owner/cash/sessions?${sessionsParams.toString()}`;

    const refundsParams = new URLSearchParams();
    if (locationFilter) refundsParams.set("locationId", locationFilter);
    if (dateFrom) refundsParams.set("dateFrom", dateFrom);
    if (dateTo) refundsParams.set("dateTo", dateTo);
    refundsParams.set("limit", "200");
    const refundsUrl = `/owner/cash/refunds?${refundsParams.toString()}`;

    const [summaryRes, ledgerRes, sessionsRes, refundsRes] =
      await Promise.allSettled([
        apiFetch(summaryUrl, { method: "GET" }),
        apiFetch(ledgerUrl, { method: "GET" }),
        apiFetch(sessionsUrl, { method: "GET" }),
        apiFetch(refundsUrl, { method: "GET" }),
      ]);

    let firstError = "";

    if (summaryRes.status === "fulfilled") {
      setSummary(summaryRes.value?.summary || null);
    } else {
      setSummary(null);
      firstError =
        firstError ||
        summaryRes.reason?.data?.error ||
        summaryRes.reason?.message ||
        "Failed to load cash summary";
    }

    if (ledgerRes.status === "fulfilled") {
      const rows = Array.isArray(ledgerRes.value?.ledger)
        ? ledgerRes.value.ledger
        : [];
      setLedger(rows);
      setSelectedLedgerId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev)) ? prev : null,
      );
    } else {
      setLedger([]);
      firstError =
        firstError ||
        ledgerRes.reason?.data?.error ||
        ledgerRes.reason?.message ||
        "Failed to load cash ledger";
    }

    if (sessionsRes.status === "fulfilled") {
      setSessionsData({
        summary: sessionsRes.value?.summary || null,
        sessions: Array.isArray(sessionsRes.value?.sessions)
          ? sessionsRes.value.sessions
          : [],
      });
    } else {
      setSessionsData({ summary: null, sessions: [] });
      firstError =
        firstError ||
        sessionsRes.reason?.data?.error ||
        sessionsRes.reason?.message ||
        "Failed to load cash sessions";
    }

    if (refundsRes.status === "fulfilled") {
      setRefundsData({
        summary: refundsRes.value?.summary || null,
        refunds: Array.isArray(refundsRes.value?.refunds)
          ? refundsRes.value.refunds
          : [],
      });
    } else {
      setRefundsData({ summary: null, refunds: [] });
      firstError =
        firstError ||
        refundsRes.reason?.data?.error ||
        refundsRes.reason?.message ||
        "Failed to load cash refunds";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  useEffect(() => {
    setVisibleLedgerCount(PAGE_SIZE);
    setVisibleSessionCount(PAGE_SIZE);
    setVisibleRefundCount(PAGE_SIZE);
  }, [
    locationFilter,
    methodFilter,
    directionFilter,
    typeFilter,
    cashierIdFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    loadCash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locationFilter,
    methodFilter,
    directionFilter,
    typeFilter,
    cashierIdFilter,
    dateFrom,
    dateTo,
  ]);

  const visibleLedger = useMemo(
    () => ledger.slice(0, visibleLedgerCount),
    [ledger, visibleLedgerCount],
  );

  const visibleSessions = useMemo(
    () => (sessionsData?.sessions || []).slice(0, visibleSessionCount),
    [sessionsData, visibleSessionCount],
  );

  const visibleRefunds = useMemo(
    () => (refundsData?.refunds || []).slice(0, visibleRefundCount),
    [refundsData, visibleRefundCount],
  );

  const selectedLedger =
    selectedLedgerId == null
      ? null
      : ledger.find((row) => String(row.id) === String(selectedLedgerId)) ||
        null;

  const totals = summary?.totals || {
    branchesCount: 0,
    entriesCount: 0,
    inTotal: 0,
    outTotal: 0,
    net: 0,
  };

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />

      {loading ? (
        <SectionCard
          title="Cash"
          subtitle="Loading owner cross-branch cash visibility."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Cross-branch cash summary"
            subtitle="Owner-wide money movement across branches, methods, and sessions."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard
                label="Branches"
                value={safeNumber(totals.branchesCount)}
                valueClassName="text-[18px]"
                sub="Branches with visible cash activity"
              />
              <StatCard
                label="Entries"
                value={safeNumber(totals.entriesCount)}
                valueClassName="text-[18px]"
                sub="Ledger entries in current filter"
              />
              <StatCard
                label="Money in"
                value={money(totals.inTotal)}
                valueClassName="text-[18px]"
                sub="All incoming movement"
              />
              <StatCard
                label="Money out"
                value={money(totals.outTotal)}
                valueClassName="text-[18px]"
                sub="All outgoing movement"
              />
              <StatCard
                label="Net"
                value={money(totals.net)}
                valueClassName="text-[18px]"
                sub="Money in minus money out"
              />
              <StatCard
                label="Refunds"
                value={money(refundsData?.summary?.refundsTotal)}
                valueClassName="text-[18px]"
                sub={`${safeNumber(refundsData?.summary?.refundsCount)} refund records`}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Cash filters"
            subtitle="Narrow down branch cash movement precisely."
          >
            <div className="grid gap-3 lg:grid-cols-4">
              <FormSelect
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All branches</option>
                {locationOptions.map((row) => (
                  <option key={row.id} value={row.id}>
                    {safe(row.name)}{" "}
                    {safe(row.code) ? `(${safe(row.code)})` : ""}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                {METHOD_OPTIONS.map((row) => (
                  <option key={row.value} value={row.value}>
                    {row.label}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
              >
                {DIRECTION_OPTIONS.map((row) => (
                  <option key={row.value} value={row.value}>
                    {row.label}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {TYPE_OPTIONS.map((row) => (
                  <option key={row.value} value={row.value}>
                    {row.label}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                value={cashierIdFilter}
                onChange={(e) => setCashierIdFilter(e.target.value)}
              >
                <option value="">All cashiers</option>
                {cashierOptions.map((row) => (
                  <option key={row.id} value={row.id}>
                    {safe(row.name)}{" "}
                    {safe(row.location?.name)
                      ? `- ${safe(row.location.name)}`
                      : ""}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />

              <FormInput
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Cash ledger"
            subtitle="Scalable ledger view across branches."
          >
            <div className="flex items-center justify-between gap-3 text-sm text-stone-600 dark:text-stone-300">
              <p>
                Showing {Math.min(visibleLedger.length, ledger.length)} of{" "}
                {ledger.length}
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[90px_170px_140px_120px_130px_150px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Ledger</div>
                <div>Branch</div>
                <div>Cashier</div>
                <div>Direction</div>
                <div>Amount</div>
                <div>Method / Type</div>
              </div>

              {ledger.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No ledger entries match the current owner filters." />
                </div>
              ) : (
                <div>
                  {visibleLedger.map((row) => (
                    <div key={row.id}>
                      <LedgerRow
                        row={row}
                        active={String(row.id) === String(selectedLedgerId)}
                        onSelect={(picked) => setSelectedLedgerId(picked?.id)}
                      />
                      <div className="p-3 lg:hidden">
                        <LedgerMobileRow
                          row={row}
                          active={String(row.id) === String(selectedLedgerId)}
                          onSelect={(picked) => setSelectedLedgerId(picked?.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {visibleLedgerCount < ledger.length ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleLedgerCount((prev) => prev + PAGE_SIZE)
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  Load 20 more
                </button>
              </div>
            ) : null}
          </SectionCard>

          {selectedLedger ? (
            <SectionCard
              title="Selected ledger detail"
              subtitle="Focused money movement detail for owner review."
              right={
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${directionTone(
                      selectedLedger?.direction,
                    )}`}
                  >
                    {safe(selectedLedger?.direction) === "IN"
                      ? "Money in"
                      : safe(selectedLedger?.direction) === "OUT"
                        ? "Money out"
                        : safe(selectedLedger?.direction) || "-"}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${methodTone(
                      selectedLedger?.method,
                    )}`}
                  >
                    {safe(selectedLedger?.method) || "-"}
                  </span>
                </div>
              }
            >
              <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Ledger detail
                  </p>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Ledger id
                      </span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        #{safe(selectedLedger.id) || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Branch
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {safe(selectedLedger.locationName) || "-"}{" "}
                        {safe(selectedLedger.locationCode)
                          ? `(${safe(selectedLedger.locationCode)})`
                          : ""}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Cashier
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {safe(selectedLedger.cashierName) || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Movement type
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {safe(selectedLedger.type) || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Direction
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {safe(selectedLedger.direction) === "IN"
                          ? "Money in"
                          : safe(selectedLedger.direction) === "OUT"
                            ? "Money out"
                            : safe(selectedLedger.direction) || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Method
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {safe(selectedLedger.method) || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Amount
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {money(selectedLedger.amount)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Cash session
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {selectedLedger.cashSessionId
                          ? `#${selectedLedger.cashSessionId}`
                          : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Sale
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {selectedLedger.saleId
                          ? `#${selectedLedger.saleId}`
                          : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Payment
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {selectedLedger.paymentId
                          ? `#${selectedLedger.paymentId}`
                          : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500 dark:text-stone-400">
                        Reference
                      </span>
                      <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                        {safe(selectedLedger.reference) || "-"}
                      </span>
                    </div>

                    <div className="border-t border-stone-200 pt-3 dark:border-stone-800">
                      <p className="text-stone-500 dark:text-stone-400">Note</p>
                      <p className="mt-2 leading-6 text-stone-800 dark:text-stone-200">
                        {safe(selectedLedger.note) || "No note recorded."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Owner interpretation
                  </p>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-stone-700 dark:text-stone-300">
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                      This row tells the owner exactly where money moved, who
                      moved it, the channel used, and whether it was money
                      coming in or going out.
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                      High-standard owner control means cash is inspected as a
                      business-wide stream, not branch by branch in isolation.
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected ledger detail"
              subtitle="This section appears after the owner deliberately selects a ledger row."
            >
              <EmptyState text="Click any ledger row above to inspect the movement in detail." />
            </SectionCard>
          )}

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <SectionCard
              title="Branch cash breakdown"
              subtitle="See which branches are strongest or weakest on cash flow."
            >
              {(summary?.byLocation || []).length === 0 ? (
                <EmptyState text="No branch cash summary found for current filters." />
              ) : (
                <div className="space-y-3">
                  {(summary?.byLocation || []).map((row) => (
                    <div
                      key={`cash-branch-${row.locationId}`}
                      className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {safe(row?.locationName) || "-"}
                          </p>
                          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                            {safe(row?.locationCode) || "-"} ·{" "}
                            {safe(row?.locationStatus) || "-"}
                          </p>
                        </div>

                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                          {safeNumber(row?.entriesCount)} entries
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                            Money in
                          </p>
                          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                            {money(row?.inTotal)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                            Money out
                          </p>
                          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                            {money(row?.outTotal)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                            Net
                          </p>
                          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                            {money(row?.net)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Method and type view"
              subtitle="See cash composition and transaction mix."
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    By method
                  </p>

                  {(summary?.byMethod || []).length === 0 ? (
                    <div className="mt-3">
                      <EmptyState text="No method summary found for current filters." />
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {(summary?.byMethod || []).map((row) => (
                        <div
                          key={`cash-method-${row.method}`}
                          className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${methodTone(
                                row.method,
                              )}`}
                            >
                              {safe(row.method) || "-"}
                            </span>

                            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                              {safeNumber(row.entriesCount)} entries
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                              <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                Money in
                              </p>
                              <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                {money(row.inTotal)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                              <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                Money out
                              </p>
                              <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                {money(row.outTotal)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                              <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                Net
                              </p>
                              <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                {money(row.net)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    By type
                  </p>

                  {(summary?.byType || []).length === 0 ? (
                    <div className="mt-3">
                      <EmptyState text="No type summary found for current filters." />
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {(summary?.byType || []).map((row, index) => (
                        <div
                          key={`cash-type-${row.type}-${row.direction}-${index}`}
                          className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                {safe(row.type) || "-"}
                              </p>
                              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                {safe(row.direction) === "IN"
                                  ? "Money in"
                                  : safe(row.direction) === "OUT"
                                    ? "Money out"
                                    : safe(row.direction) || "-"}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${directionTone(
                                row.direction,
                              )}`}
                            >
                              {safe(row.direction) === "IN"
                                ? "Money in"
                                : safe(row.direction) === "OUT"
                                  ? "Money out"
                                  : safe(row.direction) || "-"}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                              <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                Total
                              </p>
                              <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                {money(row.total)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                              <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                Entries
                              </p>
                              <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                {safeNumber(row.entriesCount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard
              title="Branch cash sessions"
              subtitle="Cross-branch cashier session visibility."
            >
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[24px] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Sessions
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                    {safeNumber(sessionsData?.summary?.sessionsCount)}
                  </p>
                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                    Visible session count
                  </p>
                </div>

                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                    Open
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
                    {safeNumber(sessionsData?.summary?.openCount)}
                  </p>
                  <p className="mt-2 text-sm text-emerald-700/80 dark:text-emerald-300/80">
                    Open sessions
                  </p>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Closed
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                    {safeNumber(sessionsData?.summary?.closedCount)}
                  </p>
                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                    Closed sessions
                  </p>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Opening total
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                    {money(sessionsData?.summary?.openingTotal)}
                  </p>
                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                    Combined opening balances
                  </p>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Closing total
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                    {money(sessionsData?.summary?.closingTotal)}
                  </p>
                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                    Combined closing balances
                  </p>
                </div>
              </div>

              {(sessionsData?.sessions || []).length === 0 ? (
                <EmptyState text="No cash sessions match the current owner filters." />
              ) : (
                <div className="space-y-3">
                  {visibleSessions.map((row) => (
                    <SessionRow key={`session-${row.id}`} row={row} />
                  ))}
                </div>
              )}

              {visibleSessionCount < (sessionsData?.sessions || []).length ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleSessionCount((prev) => prev + PAGE_SIZE)
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    Load 20 more
                  </button>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Refunds"
              subtitle="Cross-branch refund effect on cash."
            >
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/60 dark:bg-rose-950/20">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
                    Refund total
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-rose-900 dark:text-rose-100">
                    {money(refundsData?.summary?.refundsTotal)}
                  </p>
                  <p className="mt-2 text-sm text-rose-700/80 dark:text-rose-300/80">
                    Total refund value in current filter
                  </p>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Refund count
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                    {safeNumber(refundsData?.summary?.refundsCount)}
                  </p>
                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                    Visible refund records
                  </p>
                </div>
              </div>

              {(refundsData?.refunds || []).length === 0 ? (
                <EmptyState text="No refunds match the current owner filters." />
              ) : (
                <div className="space-y-3">
                  {visibleRefunds.map((row) => (
                    <RefundRow key={`refund-${row.id}`} row={row} />
                  ))}
                </div>
              )}

              {visibleRefundCount < (refundsData?.refunds || []).length ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleRefundCount((prev) => prev + PAGE_SIZE)
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    Load 20 more
                  </button>
                </div>
              ) : null}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
