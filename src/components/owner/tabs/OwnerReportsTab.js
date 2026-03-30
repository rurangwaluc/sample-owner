"use client";

import {
  AlertBox,
  EmptyState,
  FormInput,
  FormSelect,
  SectionCard,
  StatCard,
  downloadCSV,
  safe,
  safeNumber,
} from "../OwnerShared";
import { useEffect, useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";
import { apiFetch } from "../../../lib/api";

function money(v) {
  return safeNumber(v).toLocaleString();
}

function pct(v) {
  return `${safeNumber(v)}%`;
}

function toneForPaymentMethod(method) {
  const value = safe(method).toUpperCase();

  if (value === "CASH") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (value === "MOMO") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }
  if (value === "BANK") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (value === "CARD") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function toneForStatus(status) {
  const value = safe(status).toUpperCase();

  if (value === "COMPLETED" || value === "SETTLED") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (value === "APPROVED" || value === "FULFILLED") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (
    value === "PENDING" ||
    value === "AWAITING_PAYMENT_RECORD" ||
    value === "DRAFT"
  ) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (value === "REJECTED" || value === "CANCELLED") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function BranchPerformanceRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[180px_120px_140px_140px_120px_120px_120px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
        (active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
          : "bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/70")
      }
    >
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
          {safe(row?.locationCode) || "-"} · {safe(row?.locationStatus) || "-"}
        </p>
      </div>

      <div className="text-sm font-semibold">{safeNumber(row?.salesCount)}</div>
      <div className="text-sm font-semibold">{money(row?.salesTotal)}</div>
      <div className="text-sm font-semibold">{money(row?.paymentsTotal)}</div>
      <div className="text-sm font-semibold">{money(row?.creditsTotal)}</div>
      <div className="text-sm font-semibold">{money(row?.netCash)}</div>
      <div className="text-sm font-semibold">{pct(row?.paymentCoverage)}</div>
    </button>
  );
}

function BranchPerformanceMobileRow({ row, active, onSelect }) {
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
          <p className="truncate text-sm font-bold">
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
            {safe(row?.locationCode) || "-"} ·{" "}
            {safe(row?.locationStatus) || "-"}
          </p>
        </div>

        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
          {pct(row?.paymentCoverage)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Sales
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.salesTotal)}</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Payments
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.paymentsTotal)}</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Credits
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.creditsTotal)}</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Net cash
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.netCash)}</p>
        </div>
      </div>
    </button>
  );
}

function SummaryBucketCard({ title, value, sub, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
          : "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900";

  return (
    <div className={`rounded-[24px] border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {title}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
        {value}
      </p>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{sub}</p>
    </div>
  );
}

function BreakdownCard({ title, rows, kind }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {title}
      </p>

      {!Array.isArray(rows) || rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState text="No data in the selected report range." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => {
            const badgeClass =
              kind === "method"
                ? toneForPaymentMethod(row?.method)
                : kind === "cash-method"
                  ? toneForPaymentMethod(row?.method)
                  : toneForStatus(row?.status);

            const label =
              kind === "method"
                ? safe(row?.method) || "-"
                : kind === "cash-method"
                  ? `${safe(row?.method) || "-"} · ${safe(row?.direction) || "-"}`
                  : safe(row?.status) || "-";

            return (
              <div
                key={`${title}-${label}-${index}`}
                className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                  >
                    {label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Count
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                      {safeNumber(row?.count)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Total
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                      {money(row?.total)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OwnerReportsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [overview, setOverview] = useState(null);
  const [branchRows, setBranchRows] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);

  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadReports() {
    setLoading(true);
    setErrorText("");

    const params = new URLSearchParams();
    if (locationFilter) params.set("locationId", locationFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const suffix = params.toString() ? `?${params.toString()}` : "";

    const [overviewRes, branchesRes, summaryRes] = await Promise.allSettled([
      apiFetch(`/owner/reports/overview${suffix}`, { method: "GET" }),
      apiFetch(`/owner/reports/branch-performance${suffix}`, { method: "GET" }),
      apiFetch(`/owner/reports/financial-summary${suffix}`, { method: "GET" }),
    ]);

    let firstError = "";

    if (overviewRes.status === "fulfilled") {
      setOverview(overviewRes.value?.overview || null);
    } else {
      setOverview(null);
      firstError =
        firstError ||
        overviewRes.reason?.data?.error ||
        overviewRes.reason?.message ||
        "Failed to load reports overview";
    }

    if (branchesRes.status === "fulfilled") {
      const rows = Array.isArray(branchesRes.value?.branches)
        ? branchesRes.value.branches
        : [];
      setBranchRows(rows);
      setSelectedBranchId((prev) =>
        prev && rows.some((x) => String(x.locationId) === String(prev))
          ? prev
          : (rows[0]?.locationId ?? null),
      );
    } else {
      setBranchRows([]);
      setSelectedBranchId(null);
      firstError =
        firstError ||
        branchesRes.reason?.data?.error ||
        branchesRes.reason?.message ||
        "Failed to load branch performance";
    }

    if (summaryRes.status === "fulfilled") {
      setFinancialSummary(summaryRes.value?.summary || null);
    } else {
      setFinancialSummary(null);
      firstError =
        firstError ||
        summaryRes.reason?.data?.error ||
        summaryRes.reason?.message ||
        "Failed to load financial summary";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  function exportOverviewReport() {
    const rows = [
      ["Metric", "Value"],
      ["Branches", safeNumber(overview?.branchesCount)],
      ["Sales Total", safeNumber(overview?.salesTotal)],
      ["Sales Count", safeNumber(overview?.salesCount)],
      ["Payments Total", safeNumber(overview?.paymentsTotal)],
      ["Payments Count", safeNumber(overview?.paymentsCount)],
      ["Credits Total", safeNumber(overview?.creditsTotal)],
      ["Credits Count", safeNumber(overview?.creditsCount)],
      ["Refunds Total", safeNumber(overview?.refundsTotal)],
      ["Refunds Count", safeNumber(overview?.refundsCount)],
      ["Outstanding Credit", safeNumber(overview?.outstandingCredit)],
    ];

    downloadCSV("owner-reports-overview.csv", rows);
  }

  function exportBranchPerformance() {
    const rows = [
      [
        "Branch",
        "Branch Code",
        "Branch Status",
        "Sales Count",
        "Sales Total",
        "Payments Count",
        "Payments Total",
        "Credits Count",
        "Credits Total",
        "Refunds Count",
        "Refunds Total",
        "Cash In Total",
        "Cash Out Total",
        "Net Cash",
        "Payment Coverage",
      ],
      ...branchRows.map((row) => [
        row?.locationName || "",
        row?.locationCode || "",
        row?.locationStatus || "",
        safeNumber(row?.salesCount),
        safeNumber(row?.salesTotal),
        safeNumber(row?.paymentsCount),
        safeNumber(row?.paymentsTotal),
        safeNumber(row?.creditsCount),
        safeNumber(row?.creditsTotal),
        safeNumber(row?.refundsCount),
        safeNumber(row?.refundsTotal),
        safeNumber(row?.cashInTotal),
        safeNumber(row?.cashOutTotal),
        safeNumber(row?.netCash),
        safeNumber(row?.paymentCoverage),
      ]),
    ];

    downloadCSV("owner-reports-branch-performance.csv", rows);
  }

  function exportFinancialBreakdown() {
    const rows = [
      ["Payments by Method"],
      ["Method", "Count", "Total"],
      ...(financialSummary?.paymentsByMethod || []).map((row) => [
        row?.method || "",
        safeNumber(row?.count),
        safeNumber(row?.total),
      ]),
      [],
      ["Credits by Status"],
      ["Status", "Count", "Total"],
      ...(financialSummary?.creditsByStatus || []).map((row) => [
        row?.status || "",
        safeNumber(row?.count),
        safeNumber(row?.total),
      ]),
      [],
      ["Sales by Status"],
      ["Status", "Count", "Total"],
      ...(financialSummary?.salesByStatus || []).map((row) => [
        row?.status || "",
        safeNumber(row?.count),
        safeNumber(row?.total),
      ]),
      [],
      ["Cash by Method and Direction"],
      ["Method", "Direction", "Count", "Total"],
      ...(financialSummary?.cashByMethod || []).map((row) => [
        row?.method || "",
        row?.direction || "",
        safeNumber(row?.count),
        safeNumber(row?.total),
      ]),
    ];

    downloadCSV("owner-reports-financial-breakdown.csv", rows);
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, dateFrom, dateTo]);

  const selectedBranch =
    selectedBranchId == null
      ? null
      : branchRows.find(
          (row) => String(row.locationId) === String(selectedBranchId),
        ) || null;

  const strongestBranch = [...branchRows].sort((a, b) => {
    return safeNumber(b?.salesTotal) - safeNumber(a?.salesTotal);
  })[0];

  const weakestCoverageBranch = [...branchRows].sort((a, b) => {
    return safeNumber(a?.paymentCoverage) - safeNumber(b?.paymentCoverage);
  })[0];

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />

      {loading ? (
        <SectionCard title="Reports" subtitle="Loading owner-wide reports.">
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
            title="Owner reports filters"
            subtitle="Focus the report range before comparing branch performance."
          >
            <div className="grid gap-3 md:grid-cols-4">
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

              <AsyncButton
                idleText="Export overview"
                loadingText="Exporting..."
                successText="Exported"
                onClick={async () => exportOverviewReport()}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Business-wide overview"
            subtitle="One owner view across sales, payments, credits, and refunds."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryBucketCard
                title="Branches"
                value={safeNumber(overview?.branchesCount)}
                sub="Branches in the active report scope"
              />
              <SummaryBucketCard
                title="Sales"
                value={money(overview?.salesTotal)}
                sub={`${safeNumber(overview?.salesCount)} sales`}
              />
              <SummaryBucketCard
                title="Payments"
                value={money(overview?.paymentsTotal)}
                sub={`${safeNumber(overview?.paymentsCount)} payment records`}
                tone="success"
              />
              <SummaryBucketCard
                title="Credits"
                value={money(overview?.creditsTotal)}
                sub={`${safeNumber(overview?.creditsCount)} credit records`}
                tone="warn"
              />
              <SummaryBucketCard
                title="Refunds"
                value={money(overview?.refundsTotal)}
                sub={`${safeNumber(overview?.refundsCount)} refund records`}
                tone="danger"
              />
              <SummaryBucketCard
                title="Outstanding credit"
                value={money(overview?.outstandingCredit)}
                sub="Credit exposure not covered by payments total"
                tone="warn"
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                {strongestBranch
                  ? `Top visible branch by sales total is ${safe(strongestBranch.locationName)} (${safe(strongestBranch.locationCode)}) at ${money(strongestBranch.salesTotal)} RWF.`
                  : "No branch sales leader is visible in this report scope."}
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                {weakestCoverageBranch
                  ? `Weakest payment coverage is currently ${safe(weakestCoverageBranch.locationName)} (${safe(weakestCoverageBranch.locationCode)}) at ${pct(weakestCoverageBranch.paymentCoverage)}. That is where owner attention should go first.`
                  : "No payment-coverage warning branch is visible yet."}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Branch performance"
            subtitle="Compare operational strength branch by branch."
            right={
              <AsyncButton
                idleText="Export branch performance"
                loadingText="Exporting..."
                successText="Exported"
                onClick={async () => exportBranchPerformance()}
                variant="secondary"
              />
            }
          >
            <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[180px_120px_140px_140px_120px_120px_120px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Branch</div>
                <div>Sales count</div>
                <div>Sales total</div>
                <div>Payments</div>
                <div>Credits</div>
                <div>Net cash</div>
                <div>Coverage</div>
              </div>

              {branchRows.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No branch performance data in the selected range." />
                </div>
              ) : (
                <div>
                  {branchRows.map((row) => (
                    <div key={row.locationId}>
                      <BranchPerformanceRow
                        row={row}
                        active={
                          String(row.locationId) === String(selectedBranchId)
                        }
                        onSelect={(picked) =>
                          setSelectedBranchId(picked?.locationId)
                        }
                      />
                      <div className="p-3 lg:hidden">
                        <BranchPerformanceMobileRow
                          row={row}
                          active={
                            String(row.locationId) === String(selectedBranchId)
                          }
                          onSelect={(picked) =>
                            setSelectedBranchId(picked?.locationId)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {selectedBranch ? (
            <SectionCard
              title="Selected branch report detail"
              subtitle="Focused branch performance for owner review."
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Branch"
                  value={safe(selectedBranch.locationName) || "-"}
                  valueClassName="text-[17px] leading-tight"
                  sub={safe(selectedBranch.locationCode) || "-"}
                />

                <StatCard
                  label="Sales"
                  value={money(selectedBranch.salesTotal)}
                  sub={`${safeNumber(selectedBranch.salesCount)} sales`}
                  valueClassName="text-[17px] leading-tight"
                />

                <StatCard
                  label="Payments"
                  value={money(selectedBranch.paymentsTotal)}
                  sub={`${safeNumber(selectedBranch.paymentsCount)} payment records`}
                  valueClassName="text-[17px] leading-tight"
                />

                <StatCard
                  label="Credits"
                  value={money(selectedBranch.creditsTotal)}
                  sub={`${safeNumber(selectedBranch.creditsCount)} credit records`}
                  valueClassName="text-[17px] leading-tight"
                />

                <StatCard
                  label="Refunds"
                  value={money(selectedBranch.refundsTotal)}
                  sub={`${safeNumber(selectedBranch.refundsCount)} refund records`}
                  valueClassName="text-[17px] leading-tight"
                />

                <StatCard
                  label="Cash in"
                  value={money(selectedBranch.cashInTotal)}
                  sub="Recorded cash inflow"
                  valueClassName="text-[17px] leading-tight"
                />

                <StatCard
                  label="Cash out"
                  value={money(selectedBranch.cashOutTotal)}
                  sub="Recorded cash outflow"
                  valueClassName="text-[17px] leading-tight"
                />

                <StatCard
                  label="Payment coverage"
                  value={pct(selectedBranch.paymentCoverage)}
                  sub="Payments total divided by sales total"
                  valueClassName="text-[17px] leading-tight"
                />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                  Net cash of <b>{money(selectedBranch.netCash)}</b> RWF tells
                  you how much visible payment strength remains after recorded
                  cash-out movement.
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                  Payment coverage of{" "}
                  <b>{pct(selectedBranch.paymentCoverage)}</b> is the fastest
                  owner health signal on this branch. Low coverage means
                  recorded payments are lagging behind recorded sales.
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected branch report detail"
              subtitle="This section appears after a branch is selected."
            >
              <EmptyState text="Select a branch row above to inspect its report detail." />
            </SectionCard>
          )}

          <SectionCard
            title="Financial breakdowns"
            subtitle="Exportable breakdowns by method, status, and cash movement."
            right={
              <AsyncButton
                idleText="Export financial breakdown"
                loadingText="Exporting..."
                successText="Exported"
                onClick={async () => exportFinancialBreakdown()}
                variant="secondary"
              />
            }
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <BreakdownCard
                title="Payments by method"
                rows={financialSummary?.paymentsByMethod || []}
                kind="method"
              />

              <BreakdownCard
                title="Credits by status"
                rows={financialSummary?.creditsByStatus || []}
                kind="status"
              />

              <BreakdownCard
                title="Sales by status"
                rows={financialSummary?.salesByStatus || []}
                kind="status"
              />

              <BreakdownCard
                title="Cash by method and direction"
                rows={financialSummary?.cashByMethod || []}
                kind="cash-method"
              />
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
