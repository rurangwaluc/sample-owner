"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";
import AsyncButton from "../../AsyncButton";
import {
  AlertBox,
  EmptyState,
  FieldLabel,
  FormInput,
  FormSelect,
  FormTextarea,
  OverlayModal,
  SectionCard,
  StatCard,
  safe,
  safeDate,
  safeNumber,
} from "../OwnerShared";

const PAGE_SIZE = 20;

const CREDIT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SETTLED", label: "Settled" },
];

const DECISION_OPTIONS = [
  { value: "APPROVE", label: "Approve" },
  { value: "REJECT", label: "Reject" },
];

const SETTLE_METHOD_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "MOMO", label: "MoMo" },
  { value: "BANK", label: "Bank" },
  { value: "CARD", label: "Card" },
];

function money(v) {
  return safeNumber(v).toLocaleString();
}

function creditStatusTone(status) {
  const s = safe(status).toUpperCase();

  if (s === "SETTLED") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (s === "APPROVED") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (s === "PENDING") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (s === "REJECTED") {
    return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
  }

  return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function settleMethodTone(method) {
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

function CreditListRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[90px_170px_170px_120px_130px_140px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
        (active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
          : "bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/70")
      }
    >
      <div className="text-sm font-bold">#{safe(row?.id) || "-"}</div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {safe(row?.customerName) || "-"}
        </p>
        <p
          className={
            "mt-1 truncate text-xs " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          {safe(row?.customerPhone) || "-"}
        </p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {safe(row?.location?.name) || "-"}
        </p>
        <p
          className={
            "mt-1 truncate text-xs " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          {safe(row?.location?.code) || "-"}
        </p>
      </div>

      <div className="text-sm font-semibold">#{safe(row?.saleId) || "-"}</div>
      <div className="text-sm font-semibold">{money(row?.amount)}</div>

      <div className="flex flex-wrap gap-2">
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : creditStatusTone(row?.status))
          }
        >
          {safe(row?.status) || "-"}
        </span>
      </div>
    </button>
  );
}

function CreditMobileRow({ row, active, onSelect }) {
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
          <p className="text-sm font-bold">Credit #{safe(row?.id) || "-"}</p>
          <p
            className={
              "mt-1 truncate text-xs " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            {safe(row?.customerName) || "-"} · {safe(row?.customerPhone) || "-"}
          </p>
          <p
            className={
              "mt-1 truncate text-xs " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            {safe(row?.location?.name) || "-"}
            {safe(row?.location?.code) ? ` (${safe(row.location.code)})` : ""}
          </p>
        </div>

        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : creditStatusTone(row?.status))
          }
        >
          {safe(row?.status) || "-"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Sale
          </p>
          <p className="mt-1 text-sm font-bold">#{safe(row?.saleId) || "-"}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Amount
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.amount)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Created
          </p>
          <p className="mt-1 text-sm font-bold">{safeDate(row?.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}

function BranchCreditCard({ row }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-3">
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
          {safeNumber(row?.creditsCount)} credits
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Total
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {money(row?.totalAmount)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Pending
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {money(row?.pendingAmount)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Approved
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {money(row?.approvedAmount)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Rejected
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {money(row?.rejectedAmount)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Settled
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {money(row?.settledAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerCreditsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [summary, setSummary] = useState(null);
  const [credits, setCredits] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [selectedCreditId, setSelectedCreditId] = useState(null);
  const [selectedCreditDetail, setSelectedCreditDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [decisionForm, setDecisionForm] = useState({
    decision: "APPROVE",
    note: "",
  });

  const [settleForm, setSettleForm] = useState({
    method: "CASH",
    note: "",
    cashSessionId: "",
  });

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadCredits() {
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    const params = new URLSearchParams();
    if (locationFilter) params.set("locationId", locationFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("q", search.trim());
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("limit", "50");

    const summaryUrl = `/owner/credits/summary${params.toString() ? `?${params.toString()}` : ""}`;
    const listUrl = `/owner/credits${params.toString() ? `?${params.toString()}` : ""}`;

    const [summaryRes, listRes] = await Promise.allSettled([
      apiFetch(summaryUrl, { method: "GET" }),
      apiFetch(listUrl, { method: "GET" }),
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
        "Failed to load credits summary";
    }

    if (listRes.status === "fulfilled") {
      const rows = Array.isArray(listRes.value?.rows) ? listRes.value.rows : [];
      setCredits(rows);
      setNextCursor(listRes.value?.nextCursor || null);
      setSelectedCreditId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev)) ? prev : null,
      );
    } else {
      setCredits([]);
      setNextCursor(null);
      firstError =
        firstError ||
        listRes.reason?.data?.error ||
        listRes.reason?.message ||
        "Failed to load credits";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [locationFilter, statusFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    loadCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadCredits();
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const visibleRows = useMemo(
    () => credits.slice(0, visibleCount),
    [credits, visibleCount],
  );

  const hasMoreVisibleRows = visibleCount < credits.length;
  const selectedCredit =
    selectedCreditId == null
      ? null
      : credits.find((row) => String(row.id) === String(selectedCreditId)) ||
        null;

  useEffect(() => {
    async function loadDetail() {
      if (!selectedCredit?.id) {
        setSelectedCreditDetail(null);
        return;
      }

      setDetailLoading(true);

      try {
        const result = await apiFetch(`/owner/credits/${selectedCredit.id}`, {
          method: "GET",
        });
        setSelectedCreditDetail(result?.credit || null);
      } catch {
        setSelectedCreditDetail(null);
      } finally {
        setDetailLoading(false);
      }
    }

    loadDetail();
  }, [selectedCredit?.id]);

  async function loadMoreFromBackend() {
    if (!nextCursor) return;

    const params = new URLSearchParams();
    if (locationFilter) params.set("locationId", locationFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("q", search.trim());
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("limit", "50");
    params.set("cursor", String(nextCursor));

    try {
      const result = await apiFetch(`/owner/credits?${params.toString()}`, {
        method: "GET",
      });

      const newRows = Array.isArray(result?.rows) ? result.rows : [];
      setCredits((prev) => [...prev, ...newRows]);
      setNextCursor(result?.nextCursor || null);
    } catch (error) {
      setErrorText(
        error?.data?.error || error?.message || "Failed to load more credits",
      );
    }
  }

  function openDecisionModal() {
    setModalError("");
    setDecisionForm({ decision: "APPROVE", note: "" });
    setDecisionModalOpen(true);
  }

  function closeDecisionModal() {
    setDecisionModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
  }

  function openSettleModal() {
    setModalError("");
    setSettleForm({
      method: "CASH",
      note: "",
      cashSessionId: "",
    });
    setSettleModalOpen(true);
  }

  function closeSettleModal() {
    setSettleModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
  }

  async function submitDecision() {
    if (!selectedCredit?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/credits/${selectedCredit.id}/decision`, {
        method: "PATCH",
        body: {
          decision: decisionForm.decision,
          note: safe(decisionForm.note) || undefined,
        },
      });

      closeDecisionModal();
      await loadCredits();
      setSelectedCreditId(selectedCredit.id);
      setSuccessText("Credit decision saved successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error ||
          error?.message ||
          "Failed to save credit decision",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function submitSettle() {
    if (!selectedCredit?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/credits/${selectedCredit.id}/settle`, {
        method: "PATCH",
        body: {
          method: settleForm.method,
          note: safe(settleForm.note) || undefined,
          cashSessionId:
            settleForm.method === "CASH" && safe(settleForm.cashSessionId)
              ? Number(settleForm.cashSessionId)
              : undefined,
        },
      });

      closeSettleModal();
      await loadCredits();
      setSelectedCreditId(selectedCredit.id);
      setSuccessText("Credit settled successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to settle credit",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  const summaryTotals = summary?.totals || {
    branchesCount: 0,
    creditsCount: 0,
    totalAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    approvedCount: 0,
    approvedAmount: 0,
    rejectedCount: 0,
    rejectedAmount: 0,
    settledCount: 0,
    settledAmount: 0,
  };

  const canDecide = safe(selectedCredit?.status).toUpperCase() === "PENDING";
  const canSettle = safe(selectedCredit?.status).toUpperCase() === "APPROVED";

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Credits"
          subtitle="Loading owner cross-branch credits."
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
            title="Cross-branch credits summary"
            subtitle="Owner-wide visibility into credit risk and recovery."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard
                label="Branches"
                value={safeNumber(summaryTotals.branchesCount)}
                valueClassName="text-[18px]"
                sub="Branches with visible credits"
              />
              <StatCard
                label="Credits"
                value={safeNumber(summaryTotals.creditsCount)}
                valueClassName="text-[18px]"
                sub="Credit records in current filter"
              />
              <StatCard
                label="Total amount"
                value={money(summaryTotals.totalAmount)}
                valueClassName="text-[18px]"
                sub="All visible credit value"
              />
              <StatCard
                label="Pending"
                value={money(summaryTotals.pendingAmount)}
                valueClassName="text-[18px]"
                sub={`${safeNumber(summaryTotals.pendingCount)} records`}
              />
              <StatCard
                label="Approved"
                value={money(summaryTotals.approvedAmount)}
                valueClassName="text-[18px]"
                sub={`${safeNumber(summaryTotals.approvedCount)} records`}
              />
              <StatCard
                label="Settled"
                value={money(summaryTotals.settledAmount)}
                valueClassName="text-[18px]"
                sub={`${safeNumber(summaryTotals.settledCount)} records`}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Credits directory"
            subtitle="Filter and inspect credits across branches."
          >
            <div className="grid gap-3 lg:grid-cols-5">
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, phone, or sale id"
              />

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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {CREDIT_STATUS_OPTIONS.map((row) => (
                  <option key={row.value} value={row.value}>
                    {row.label}
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

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-stone-600 dark:text-stone-300">
              <p>
                Showing {Math.min(visibleRows.length, credits.length)} of{" "}
                {credits.length}
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[90px_170px_170px_120px_130px_140px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Credit</div>
                <div>Customer</div>
                <div>Branch</div>
                <div>Sale</div>
                <div>Amount</div>
                <div>Status</div>
              </div>

              {credits.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No credits match the current owner filters." />
                </div>
              ) : (
                <div>
                  {visibleRows.map((row) => (
                    <div key={row.id}>
                      <CreditListRow
                        row={row}
                        active={String(row.id) === String(selectedCreditId)}
                        onSelect={(picked) => setSelectedCreditId(picked?.id)}
                      />
                      <div className="p-3 lg:hidden">
                        <CreditMobileRow
                          row={row}
                          active={String(row.id) === String(selectedCreditId)}
                          onSelect={(picked) => setSelectedCreditId(picked?.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasMoreVisibleRows ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  Load 20 more
                </button>
              </div>
            ) : nextCursor ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={loadMoreFromBackend}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  Load more from server
                </button>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Branch credit breakdown"
            subtitle="See where credit risk and recovery sit across the business."
          >
            <div className="grid gap-4">
              {(summary?.byLocation || []).length === 0 ? (
                <EmptyState text="No branch credit breakdown found for current filters." />
              ) : (
                (summary?.byLocation || []).map((row) => (
                  <BranchCreditCard
                    key={`credit-branch-${row.locationId}`}
                    row={row}
                  />
                ))
              )}
            </div>
          </SectionCard>

          {selectedCredit ? (
            <SectionCard
              title="Selected credit detail"
              subtitle="Focused credit detail with owner control."
              right={
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${creditStatusTone(
                    selectedCredit?.status,
                  )}`}
                >
                  {safe(selectedCredit?.status) || "-"}
                </span>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                  <StatCard
                    label="Credit"
                    value={`#${safe(selectedCredit.id) || "-"}`}
                    valueClassName="text-[18px]"
                    sub={safeDate(selectedCredit.createdAt)}
                  />
                  <StatCard
                    label="Sale"
                    value={`#${safe(selectedCredit.saleId) || "-"}`}
                    valueClassName="text-[18px]"
                    sub="Related sale"
                  />
                  <StatCard
                    label="Branch"
                    value={safe(selectedCredit.location?.name) || "-"}
                    valueClassName="text-[18px]"
                    sub={safe(selectedCredit.location?.code) || "-"}
                  />
                  <StatCard
                    label="Customer"
                    value={safe(selectedCredit.customerName) || "-"}
                    valueClassName="text-[18px]"
                    sub={safe(selectedCredit.customerPhone) || "-"}
                  />
                  <StatCard
                    label="Amount"
                    value={money(selectedCredit.amount)}
                    valueClassName="text-[18px]"
                    sub={safe(selectedCredit.status) || "-"}
                  />
                  <StatCard
                    label="Created by"
                    value={safe(selectedCredit.createdByName) || "-"}
                    valueClassName="text-[18px]"
                    sub={`User #${safe(selectedCredit.createdBy) || "-"}`}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Credit detail
                    </p>

                    {detailLoading ? (
                      <div className="mt-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-20 animate-pulse rounded-2xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
                          />
                        ))}
                      </div>
                    ) : !selectedCreditDetail ? (
                      <div className="mt-4">
                        <EmptyState text="No credit detail available." />
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                              Status
                            </p>
                            <p className="mt-2">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${creditStatusTone(
                                  selectedCreditDetail.status,
                                )}`}
                              >
                                {safe(selectedCreditDetail.status) || "-"}
                              </span>
                            </p>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                              Branch
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                              {safe(selectedCreditDetail.location?.name) || "-"}{" "}
                              {safe(selectedCreditDetail.location?.code)
                                ? `(${safe(selectedCreditDetail.location.code)})`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                            Actor trail
                          </p>

                          <div className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Created by
                              </span>
                              <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safe(selectedCreditDetail.createdByName) ||
                                  "-"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Approved by
                              </span>
                              <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safe(selectedCreditDetail.approvedByName) ||
                                  "-"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Rejected by
                              </span>
                              <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safe(selectedCreditDetail.rejectedByName) ||
                                  "-"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Settled by
                              </span>
                              <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safe(selectedCreditDetail.settledByName) ||
                                  "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                            Sale items
                          </p>

                          {Array.isArray(selectedCreditDetail.items) &&
                          selectedCreditDetail.items.length > 0 ? (
                            <div className="mt-4 space-y-3">
                              {selectedCreditDetail.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                                        {safe(item.productName) || "-"}
                                      </p>
                                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                        SKU: {safe(item.sku) || "-"}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                      <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-center dark:border-stone-800 dark:bg-stone-900">
                                        <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                          Qty
                                        </p>
                                        <p className="mt-1 font-bold">
                                          {safeNumber(item.qty)}
                                        </p>
                                      </div>
                                      <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-center dark:border-stone-800 dark:bg-stone-900">
                                        <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                          Unit
                                        </p>
                                        <p className="mt-1 font-bold">
                                          {money(item.unitPrice)}
                                        </p>
                                      </div>
                                      <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-center dark:border-stone-800 dark:bg-stone-900">
                                        <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                          Line
                                        </p>
                                        <p className="mt-1 font-bold">
                                          {money(item.lineTotal)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-4">
                              <EmptyState text="No item lines found." />
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                            Payments and notes
                          </p>

                          <div className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Approved at
                              </span>
                              <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safeDate(selectedCreditDetail.approvedAt)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Rejected at
                              </span>
                              <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safeDate(selectedCreditDetail.rejectedAt)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Settled at
                              </span>
                              <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safeDate(selectedCreditDetail.settledAt)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Note
                            </p>
                            <p className="mt-2 leading-6 text-stone-800 dark:text-stone-200">
                              {safe(selectedCreditDetail.note) ||
                                "No note recorded."}
                            </p>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Settlement payments
                            </p>

                            {Array.isArray(selectedCreditDetail.payments) &&
                            selectedCreditDetail.payments.length > 0 ? (
                              <div className="mt-3 space-y-3">
                                {selectedCreditDetail.payments.map(
                                  (payment) => (
                                    <div
                                      key={payment.id}
                                      className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950"
                                    >
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                            Payment #{safe(payment.id) || "-"}
                                          </p>
                                          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                            {safeDate(payment.createdAt)}
                                          </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                          <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${settleMethodTone(
                                              payment.method,
                                            )}`}
                                          >
                                            {safe(payment.method) || "-"}
                                          </span>
                                          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                            {money(payment.amount)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="mt-3">
                                <EmptyState text="No settlement payment recorded." />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Owner actions
                    </p>

                    <div className="mt-4 space-y-3">
                      <AsyncButton
                        idleText="Approve / reject credit"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => openDecisionModal()}
                        className="w-full"
                        disabled={!canDecide}
                      />

                      <AsyncButton
                        idleText="Settle credit"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => openSettleModal()}
                        className="w-full"
                        disabled={!canSettle}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      The owner can control cross-branch credit risk here.
                      Actions only unlock when the current credit status allows
                      them.
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected credit detail"
              subtitle="This section appears after the owner deliberately selects a credit."
            >
              <EmptyState text="Click any credit row above to inspect details and control the credit." />
            </SectionCard>
          )}
        </>
      )}

      <OverlayModal
        open={decisionModalOpen}
        title="Credit decision"
        subtitle="Approve or reject the selected credit."
        onClose={closeDecisionModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeDecisionModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDecision}
              disabled={modalSubmitting || !decisionForm.decision}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Saving..." : "Save decision"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div>
            <FieldLabel htmlFor="credit-decision">Decision</FieldLabel>
            <FormSelect
              id="credit-decision"
              value={decisionForm.decision}
              onChange={(e) =>
                setDecisionForm((prev) => ({
                  ...prev,
                  decision: e.target.value,
                }))
              }
            >
              {DECISION_OPTIONS.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </FormSelect>
          </div>

          <div>
            <FieldLabel htmlFor="credit-decision-note">Note</FieldLabel>
            <FormTextarea
              id="credit-decision-note"
              value={decisionForm.note}
              onChange={(e) =>
                setDecisionForm((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
              placeholder="Optional owner note"
            />
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={settleModalOpen}
        title="Settle credit"
        subtitle="Record settlement for the selected approved credit."
        onClose={closeSettleModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeSettleModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitSettle}
              disabled={modalSubmitting || !settleForm.method}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Settling..." : "Settle credit"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div>
            <FieldLabel htmlFor="credit-settle-method">Method</FieldLabel>
            <FormSelect
              id="credit-settle-method"
              value={settleForm.method}
              onChange={(e) =>
                setSettleForm((prev) => ({
                  ...prev,
                  method: e.target.value,
                }))
              }
            >
              {SETTLE_METHOD_OPTIONS.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </FormSelect>
          </div>

          {settleForm.method === "CASH" ? (
            <div>
              <FieldLabel htmlFor="credit-cash-session">
                Cash session id
              </FieldLabel>
              <FormInput
                id="credit-cash-session"
                type="number"
                min="1"
                value={settleForm.cashSessionId}
                onChange={(e) =>
                  setSettleForm((prev) => ({
                    ...prev,
                    cashSessionId: e.target.value,
                  }))
                }
                placeholder="Optional open cash session id"
              />
            </div>
          ) : null}

          <div>
            <FieldLabel htmlFor="credit-settle-note">Note</FieldLabel>
            <FormTextarea
              id="credit-settle-note"
              value={settleForm.note}
              onChange={(e) =>
                setSettleForm((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
              placeholder="Optional settlement note"
            />
          </div>
        </div>
      </OverlayModal>
    </div>
  );
}
