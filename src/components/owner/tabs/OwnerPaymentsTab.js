"use client";

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
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "../../../lib/api";

const PAGE_SIZE = 20;

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All methods" },
  { value: "CASH", label: "Cash" },
  { value: "MOMO", label: "MoMo" },
  { value: "BANK", label: "Bank" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
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

function PaymentListRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[90px_170px_170px_140px_120px_130px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
        (active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
          : "bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/70")
      }
    >
      <div className="text-sm font-bold">#{safe(row?.id) || "-"}</div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {safe(row?.customerName) || "Walk-in"}
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
      </div>
    </button>
  );
}

function PaymentMobileRow({ row, active, onSelect }) {
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
          <p className="text-sm font-bold">Payment #{safe(row?.id) || "-"}</p>
          <p
            className={
              "mt-1 truncate text-xs " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            {safe(row?.customerName) || "Walk-in"} ·{" "}
            {safe(row?.customerPhone) || "-"}
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
              : methodTone(row?.method))
          }
        >
          {safe(row?.method) || "-"}
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
            Sale
          </p>
          <p className="mt-1 text-sm font-bold">#{safe(row?.saleId) || "-"}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Cashier
          </p>
          <p className="mt-1 truncate text-sm font-bold">
            {safe(row?.cashierName) || "-"}
          </p>
        </div>
      </div>
    </button>
  );
}

function BreakdownCard({ title, rows }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {title}
      </p>

      {!Array.isArray(rows) || rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState text="No breakdown data found for current filters." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${title}-${row?.method || "method"}-${row?.locationId || index}`}
              className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {safe(row?.method) || "-"}
                  </p>
                  {"locationName" in row ? (
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      {safe(row?.locationName) || "-"}
                      {safe(row?.locationCode)
                        ? ` (${safe(row.locationCode)})`
                        : ""}
                    </p>
                  ) : null}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${methodTone(row?.method)}`}
                >
                  {safe(row?.method) || "-"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                    Count
                  </p>
                  <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                    {safeNumber(row?.count)}
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                    Total
                  </p>
                  <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                    {money(row?.total)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OwnerPaymentsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [breakdown, setBreakdown] = useState(null);

  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const [locationFilter, setLocationFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadPayments() {
    setLoading(true);
    setErrorText("");

    const params = new URLSearchParams();
    if (locationFilter) params.set("locationId", locationFilter);
    if (methodFilter) params.set("method", methodFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const summaryUrl = `/owner/payments/summary${params.toString() ? `?${params.toString()}` : ""}`;
    const listUrl = `/owner/payments${params.toString() ? `?${params.toString()}` : ""}`;
    const breakdownUrl = `/owner/payments/breakdown${params.toString() ? `?${params.toString()}` : ""}`;

    const [summaryRes, listRes, breakdownRes] = await Promise.allSettled([
      apiFetch(summaryUrl, { method: "GET" }),
      apiFetch(listUrl, { method: "GET" }),
      apiFetch(breakdownUrl, { method: "GET" }),
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
        "Failed to load payments summary";
    }

    if (listRes.status === "fulfilled") {
      const rows = Array.isArray(listRes.value?.payments)
        ? listRes.value.payments
        : [];
      setPayments(rows);
      setSelectedPaymentId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev)) ? prev : null,
      );
    } else {
      setPayments([]);
      firstError =
        firstError ||
        listRes.reason?.data?.error ||
        listRes.reason?.message ||
        "Failed to load payments";
    }

    if (breakdownRes.status === "fulfilled") {
      setBreakdown(breakdownRes.value?.breakdown || null);
    } else {
      setBreakdown(null);
      firstError =
        firstError ||
        breakdownRes.reason?.data?.error ||
        breakdownRes.reason?.message ||
        "Failed to load payments breakdown";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [locationFilter, methodFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, methodFilter, dateFrom, dateTo]);

  const visibleRows = useMemo(
    () => payments.slice(0, visibleCount),
    [payments, visibleCount],
  );

  const hasMoreRows = visibleCount < payments.length;

  const selectedPayment =
    selectedPaymentId == null
      ? null
      : payments.find((row) => String(row.id) === String(selectedPaymentId)) ||
        null;

  const summaryTotals = summary?.totals || {
    branchesCount: 0,
    paymentsCount: 0,
    totalAmount: 0,
  };

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />

      {loading ? (
        <SectionCard
          title="Payments"
          subtitle="Loading owner cross-branch payments."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
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
            title="Cross-branch payments summary"
            subtitle="Owner-wide payment visibility across branches, methods, and time."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Branches"
                value={safeNumber(summaryTotals.branchesCount)}
                sub="Branches with visible payments"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Payments"
                value={safeNumber(summaryTotals.paymentsCount)}
                sub="Payment records in current filter"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Total amount"
                value={money(summaryTotals.totalAmount)}
                sub="Payment amount in current filter"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Method"
                value={methodFilter || "ALL"}
                sub="Current method filter"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Period"
                value={
                  dateFrom || dateTo
                    ? `${dateFrom || "Start"} → ${dateTo || "Today"}`
                    : "All time"
                }
                sub="Current date filter"
                valueClassName="text-[17px] leading-tight"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Payments directory"
            subtitle="Filter and inspect payments across branches."
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
                {PAYMENT_METHOD_OPTIONS.map((row) => (
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
                Showing {Math.min(visibleRows.length, payments.length)} of{" "}
                {payments.length}
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[90px_170px_170px_140px_120px_130px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Payment</div>
                <div>Customer</div>
                <div>Branch</div>
                <div>Cashier</div>
                <div>Amount</div>
                <div>Method</div>
              </div>

              {payments.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No payments match the current owner filters." />
                </div>
              ) : (
                <div>
                  {visibleRows.map((row) => (
                    <div key={row.id}>
                      <PaymentListRow
                        row={row}
                        active={String(row.id) === String(selectedPaymentId)}
                        onSelect={(picked) => setSelectedPaymentId(picked?.id)}
                      />
                      <div className="p-3 lg:hidden">
                        <PaymentMobileRow
                          row={row}
                          active={String(row.id) === String(selectedPaymentId)}
                          onSelect={(picked) =>
                            setSelectedPaymentId(picked?.id)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasMoreRows ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  Load 20 more
                </button>
              </div>
            ) : null}
          </SectionCard>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <BreakdownCard
              title="Breakdown by method"
              rows={breakdown?.byMethod || []}
            />

            <BreakdownCard
              title="Breakdown by branch and method"
              rows={breakdown?.byLocationMethod || []}
            />
          </div>

          {selectedPayment ? (
            <SectionCard
              title="Selected payment detail"
              subtitle="Focused payment detail for owner review."
              right={
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${methodTone(
                    selectedPayment?.method,
                  )}`}
                >
                  {safe(selectedPayment?.method) || "-"}
                </span>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                  <StatCard
                    label="Payment"
                    value={`#${safe(selectedPayment.id) || "-"}`}
                    valueClassName="text-[18px]"
                    sub={safeDate(selectedPayment.createdAt)}
                  />
                  <StatCard
                    label="Sale"
                    value={`#${safe(selectedPayment.saleId) || "-"}`}
                    valueClassName="text-[18px]"
                    sub="Related sale"
                  />
                  <StatCard
                    label="Branch"
                    value={safe(selectedPayment.location?.name) || "-"}
                    valueClassName="text-[18px]"
                    sub={safe(selectedPayment.location?.code) || "-"}
                  />
                  <StatCard
                    label="Customer"
                    value={safe(selectedPayment.customerName) || "Walk-in"}
                    valueClassName="text-[18px]"
                    sub={safe(selectedPayment.customerPhone) || "-"}
                  />
                  <StatCard
                    label="Cashier"
                    value={safe(selectedPayment.cashierName) || "-"}
                    valueClassName="text-[18px]"
                    sub={`User #${safe(selectedPayment.cashierId) || "-"}`}
                  />
                  <StatCard
                    label="Amount"
                    value={money(selectedPayment.amount)}
                    valueClassName="text-[18px]"
                    sub={safe(selectedPayment.method) || "-"}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Payment detail
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Payment id
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          #{safe(selectedPayment.id) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Sale id
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          #{safe(selectedPayment.saleId) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Branch
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {safe(selectedPayment.location?.name) || "-"}{" "}
                          {safe(selectedPayment.location?.code)
                            ? `(${safe(selectedPayment.location.code)})`
                            : ""}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Method
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {safe(selectedPayment.method) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Cash session
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {selectedPayment.cashSessionId
                            ? `#${selectedPayment.cashSessionId}`
                            : "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Created
                        </span>
                        <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                          {safeDate(selectedPayment.createdAt)}
                        </span>
                      </div>

                      <div className="border-t border-stone-200 pt-3 dark:border-stone-800">
                        <p className="text-stone-500 dark:text-stone-400">
                          Note
                        </p>
                        <p className="mt-2 leading-6 text-stone-800 dark:text-stone-200">
                          {safe(selectedPayment.note) || "No note recorded."}
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
                        This record tells the owner exactly where the payment
                        was collected, who recorded it, what method was used,
                        and which sale it completed.
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        With the filters above, the owner can compare branch
                        collection patterns and payment method mix over time
                        without switching branches manually.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected payment detail"
              subtitle="This section appears after the owner deliberately selects a payment."
            >
              <EmptyState text="Click any payment row above to inspect its details clearly." />
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
