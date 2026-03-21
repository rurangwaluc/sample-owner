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

import AsyncButton from "../../AsyncButton";
import { apiFetch } from "../../../lib/api";

const PAGE_SIZE = 50;
const HISTORY_LIMIT = 50;

function money(v, currency = "RWF") {
  return `${String(currency || "RWF").toUpperCase()} ${safeNumber(v).toLocaleString()}`;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeCustomersResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.customers)) return result.customers;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeCustomer(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    name: row.name ?? "",
    phone: row.phone ?? "",
    tin: row.tin ?? "",
    address: row.address ?? "",
    notes: row.notes ?? "",
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    salesCount: Number(row.salesCount ?? row.sales_count ?? 0),
    salesTotalAmount: Number(
      row.salesTotalAmount ?? row.sales_total_amount ?? 0,
    ),
    openCreditAmount: Number(
      row.openCreditAmount ?? row.open_credit_amount ?? 0,
    ),
    lastSaleAt: row.lastSaleAt ?? row.last_sale_at ?? null,
  };
}

function normalizeHistorySale(row) {
  if (!row) return null;

  return {
    id: row.id ?? row.saleId ?? row.sale_id ?? null,
    status: row.status ?? "",
    createdAt: row.createdAt ?? row.created_at ?? null,
    totalAmount: num(row.totalAmount ?? row.total_amount),
    paymentAmount: num(
      row.paymentAmount ??
        row.payment_amount ??
        row.amountPaid ??
        row.amount_paid ??
        row.paidAmount ??
        row.paid_amount,
    ),
    paymentMethod: row.paymentMethod ?? row.payment_method ?? "",
    creditAmount: num(
      row.creditAmount ??
        row.credit_amount ??
        row.openCreditAmount ??
        row.open_credit_amount,
    ),
    refundAmount: num(row.refundAmount ?? row.refund_amount),
  };
}

function normalizeHistoryResponse(result) {
  const salesRaw = Array.isArray(result?.sales)
    ? result.sales
    : Array.isArray(result?.rows)
      ? result.rows
      : Array.isArray(result?.items)
        ? result.items
        : [];

  const sales = salesRaw.map(normalizeHistorySale).filter(Boolean);

  const totalsSource =
    result?.totals ||
    result?.summary ||
    result?.aggregate ||
    result?.meta ||
    {};

  const rolled = sales.reduce(
    (acc, row) => {
      acc.salesCount += 1;
      acc.salesTotalAmount += num(row.totalAmount);
      acc.paymentsTotalAmount += num(row.paymentAmount);
      acc.creditsTotalAmount += num(row.creditAmount);
      acc.refundsTotalAmount += num(row.refundAmount);
      return acc;
    },
    {
      salesCount: 0,
      salesTotalAmount: 0,
      paymentsTotalAmount: 0,
      creditsTotalAmount: 0,
      refundsTotalAmount: 0,
    },
  );

  return {
    sales,
    totals: {
      salesCount: num(
        totalsSource.salesCount ??
          totalsSource.sales_count ??
          rolled.salesCount,
      ),
      salesTotalAmount: num(
        totalsSource.salesTotalAmount ??
          totalsSource.sales_total_amount ??
          totalsSource.totalSalesAmount ??
          totalsSource.total_sales_amount ??
          rolled.salesTotalAmount,
      ),
      paymentsTotalAmount: num(
        totalsSource.paymentsTotalAmount ??
          totalsSource.payments_total_amount ??
          totalsSource.paymentTotalAmount ??
          totalsSource.payment_total_amount ??
          totalsSource.amountPaid ??
          totalsSource.amount_paid ??
          rolled.paymentsTotalAmount,
      ),
      creditsTotalAmount: num(
        totalsSource.creditsTotalAmount ??
          totalsSource.credits_total_amount ??
          totalsSource.creditTotalAmount ??
          totalsSource.credit_total_amount ??
          totalsSource.openCreditAmount ??
          totalsSource.open_credit_amount ??
          rolled.creditsTotalAmount,
      ),
      refundsTotalAmount: num(
        totalsSource.refundsTotalAmount ??
          totalsSource.refunds_total_amount ??
          totalsSource.refundTotalAmount ??
          totalsSource.refund_total_amount ??
          rolled.refundsTotalAmount,
      ),
    },
  };
}

function displayBranch(row) {
  if (safe(row?.locationName)) {
    return safe(row?.locationCode)
      ? `${safe(row.locationName)} (${safe(row.locationCode)})`
      : safe(row.locationName);
  }

  if (row?.locationId != null) {
    return `Branch #${row.locationId}`;
  }

  return "-";
}

function DetailMetricCard({ label, value, tone = "default", sub }) {
  const toneCls =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
        : "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900";

  return (
    <div className={`rounded-2xl border p-4 ${toneCls}`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-stone-950 dark:text-stone-50">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{sub}</p>
      ) : null}
    </div>
  );
}

function CustomerCard({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "group w-full overflow-hidden rounded-[26px] border text-left transition-all duration-200 " +
        (active
          ? "border-stone-900 bg-stone-900 text-white shadow-xl ring-1 ring-stone-700 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950 dark:ring-stone-300"
          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
      }
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold sm:text-lg">
                {safe(row?.name) || "-"}
              </h3>

              {active ? (
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white dark:border-stone-900/15 dark:bg-stone-900/10 dark:text-stone-950">
                  Selected
                </span>
              ) : null}

              <span
                className={
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                  (active
                    ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                    : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300")
                }
              >
                {displayBranch(row)}
              </span>

              {safe(row?.tin) ? (
                <span
                  className={
                    "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                    (active
                      ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300")
                  }
                >
                  TIN
                </span>
              ) : null}
            </div>

            <div
              className={
                "mt-3 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4 " +
                (active
                  ? "text-stone-200 dark:text-stone-700"
                  : "text-stone-600 dark:text-stone-400")
              }
            >
              <p className="truncate">
                <span className="font-medium">Phone:</span>{" "}
                {safe(row?.phone) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">TIN:</span>{" "}
                {safe(row?.tin) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Last sale:</span>{" "}
                {safeDate(row?.lastSaleAt)}
              </p>
              <p className="truncate">
                <span className="font-medium">Created:</span>{" "}
                {safeDate(row?.createdAt)}
              </p>
            </div>
          </div>

          <div
            className={
              "rounded-2xl border px-4 py-3 xl:min-w-[220px] " +
              (active
                ? "border-white/10 bg-white/5 dark:border-stone-900/10 dark:bg-stone-900/5"
                : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950")
            }
          >
            <p
              className={
                "text-[11px] font-semibold uppercase tracking-[0.18em] " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              Open credit
            </p>
            <p className="mt-2 text-xl font-black sm:text-2xl">
              {money(row?.openCreditAmount, "RWF")}
            </p>
            <p
              className={
                "mt-1 text-xs " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              Outstanding credit exposure
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div
            className={
              "rounded-2xl border p-4 " +
              (active
                ? "border-white/10 bg-white/5 dark:border-stone-900/10 dark:bg-stone-900/5"
                : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950")
            }
          >
            <p
              className={
                "text-[11px] uppercase tracking-[0.14em] " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              Sales count
            </p>
            <p className="mt-2 text-lg font-bold">
              {safeNumber(row?.salesCount)}
            </p>
          </div>

          <div
            className={
              "rounded-2xl border p-4 " +
              (active
                ? "border-white/10 bg-white/5 dark:border-stone-900/10 dark:bg-stone-900/5"
                : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950")
            }
          >
            <p
              className={
                "text-[11px] uppercase tracking-[0.14em] " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              Sales total
            </p>
            <p className="mt-2 text-lg font-bold">
              {money(row?.salesTotalAmount, "RWF")}
            </p>
          </div>

          <div
            className={
              "rounded-2xl border p-4 " +
              (active
                ? "border-rose-300/20 bg-rose-400/10 text-white dark:border-rose-900/20 dark:bg-rose-900/10 dark:text-stone-950"
                : "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20")
            }
          >
            <p
              className={
                "text-[11px] uppercase tracking-[0.14em] " +
                (active
                  ? "text-rose-100 dark:text-rose-800"
                  : "text-rose-700 dark:text-rose-300")
              }
            >
              Credit open
            </p>
            <p className="mt-2 text-lg font-bold">
              {money(row?.openCreditAmount, "RWF")}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-stone-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            ×
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function CreateCustomerModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    tin: "",
    address: "",
    notes: "",
  });
  const [errorText, setErrorText] = useState("");

  if (!open) return null;

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        tin: form.tin.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      const result = await apiFetch("/customers", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to create customer");
    }
  }

  return (
    <ModalShell
      title="Create customer"
      subtitle="Add a new customer profile for sales, credits, and history tracking."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Customer name
          </label>
          <FormInput
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Customer full name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Phone
          </label>
          <FormInput
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="07..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            TIN
          </label>
          <FormInput
            value={form.tin}
            maxLength={30}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tin: e.target.value }))
            }
            placeholder="Optional tax number"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Address
          </label>
          <FormInput
            value={form.address}
            maxLength={200}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, address: e.target.value }))
            }
            placeholder="Optional address"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={4}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Optional notes about this customer"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText="Create customer"
          loadingText="Creating..."
          successText="Created"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerCustomersTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [customers, setCustomers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [history, setHistory] = useState({
    sales: [],
    totals: {
      salesCount: 0,
      salesTotalAmount: 0,
      paymentsTotalAmount: 0,
      creditsTotalAmount: 0,
      refundsTotalAmount: 0,
    },
  });

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [createModalKey, setCreateModalKey] = useState(0);

  const isSearchMode = q.trim().length > 0;

  const selectedCustomer =
    selectedCustomerId == null
      ? null
      : customers.find(
          (row) => String(row.id) === String(selectedCustomerId),
        ) || null;

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const overview = useMemo(() => {
    const rows = Array.isArray(customers) ? customers : [];

    let customersCount = rows.length;
    let totalSalesCount = 0;
    let totalSalesAmount = 0;
    let totalOpenCredit = 0;
    let withTinCount = 0;

    for (const row of rows) {
      totalSalesCount += Number(row?.salesCount || 0);
      totalSalesAmount += Number(row?.salesTotalAmount || 0);
      totalOpenCredit += Number(row?.openCreditAmount || 0);
      if (safe(row?.tin)) withTinCount += 1;
    }

    return {
      customersCount,
      totalSalesCount,
      totalSalesAmount,
      totalOpenCredit,
      withTinCount,
    };
  }, [customers]);

  const selectedTotals = useMemo(() => {
    const customerSalesTotal = num(selectedCustomer?.salesTotalAmount);
    const customerOpenCredit = num(selectedCustomer?.openCreditAmount);

    const historySalesTotal = num(history?.totals?.salesTotalAmount);
    const historyPaymentsTotal = num(history?.totals?.paymentsTotalAmount);
    const historyCreditsTotal = num(history?.totals?.creditsTotalAmount);
    const historyRefundsTotal = num(history?.totals?.refundsTotalAmount);

    return {
      salesTotal:
        customerSalesTotal > 0 ? customerSalesTotal : historySalesTotal,
      paymentsTotal:
        historyPaymentsTotal > 0
          ? historyPaymentsTotal
          : Math.max(0, customerSalesTotal - customerOpenCredit),
      creditsTotal:
        customerOpenCredit > 0 ? customerOpenCredit : historyCreditsTotal,
      refundsTotal: historyRefundsTotal,
    };
  }, [selectedCustomer, history]);

  function resetHistory() {
    setHistory({
      sales: [],
      totals: {
        salesCount: 0,
        salesTotalAmount: 0,
        paymentsTotalAmount: 0,
        creditsTotalAmount: 0,
        refundsTotalAmount: 0,
      },
    });
  }

  async function loadCustomersFirstPage() {
    setLoading(true);
    setErrorText("");

    try {
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);

      let result;
      let rows = [];
      let cursor = null;

      if (isSearchMode) {
        params.set("q", q.trim());
        result = await apiFetch(`/customers/search?${params.toString()}`, {
          method: "GET",
        });
        rows = normalizeCustomersResponse(result)
          .map(normalizeCustomer)
          .filter(Boolean);
        cursor = null;
      } else {
        params.set("limit", String(PAGE_SIZE));
        result = await apiFetch(`/customers?${params.toString()}`, {
          method: "GET",
        });
        rows = normalizeCustomersResponse(result)
          .map(normalizeCustomer)
          .filter(Boolean);
        cursor = result?.nextCursor ?? null;
      }

      setCustomers(rows);
      setNextCursor(cursor);
      setSelectedCustomerId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev))
          ? prev
          : (rows[0]?.id ?? null),
      );
    } catch (e) {
      setCustomers([]);
      setNextCursor(null);
      setSelectedCustomerId(null);
      resetHistory();
      setErrorText(e?.data?.error || e?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreCustomers() {
    if (loadingMore || isSearchMode || !nextCursor) return;

    setLoadingMore(true);
    setErrorText("");

    try {
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      params.set("limit", String(PAGE_SIZE));
      params.set("cursor", String(nextCursor));

      const result = await apiFetch(`/customers?${params.toString()}`, {
        method: "GET",
      });

      const rows = normalizeCustomersResponse(result)
        .map(normalizeCustomer)
        .filter(Boolean);

      setCustomers((prev) => [...prev, ...rows]);
      setNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to load more customers",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadHistory(customerId) {
    if (!customerId) {
      resetHistory();
      return;
    }

    setDetailLoading(true);

    try {
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      params.set("limit", String(HISTORY_LIMIT));

      const result = await apiFetch(
        `/customers/${customerId}/history?${params.toString()}`,
        { method: "GET" },
      );

      setHistory(normalizeHistoryResponse(result));
    } catch {
      resetHistory();
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadCustomersFirstPage();
  }, [q, locationId]);

  useEffect(() => {
    loadHistory(selectedCustomerId);
  }, [selectedCustomerId, locationId]);

  async function handleSaved(result) {
    setSuccessText("Customer created");
    setCreatingCustomer(false);
    await loadCustomersFirstPage();

    const nextId = result?.customer?.id ?? null;
    if (nextId) {
      setSelectedCustomerId(nextId);
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Customers"
          subtitle="Loading owner-wide customer visibility."
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
            title="Customer overview"
            subtitle="Owner-wide customer visibility across branches."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Loaded customers"
                value={safeNumber(overview?.customersCount)}
                sub={isSearchMode ? "Search results" : "Loaded in this view"}
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Sales count"
                value={safeNumber(overview?.totalSalesCount)}
                sub="Sales linked to loaded customers"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Sales total"
                value={money(overview?.totalSalesAmount, "RWF")}
                sub="Loaded customer purchase value"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Open credit"
                value={money(overview?.totalOpenCredit, "RWF")}
                sub="Loaded credit exposure"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="With TIN"
                value={safeNumber(overview?.withTinCount)}
                sub="Profiles with tax number"
                valueClassName="text-[17px] leading-tight"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Customer filters"
            subtitle="Search by customer name or phone, and narrow by branch."
            right={
              <AsyncButton
                idleText="Create customer"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => {
                  setCreateModalKey((k) => k + 1);
                  setCreatingCustomer(true);
                }}
              />
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customer name or phone"
              />

              <FormSelect
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">All branches</option>
                {locationOptions.map((row) => (
                  <option key={row.id} value={row.id}>
                    {safe(row.name)}{" "}
                    {safe(row.code) ? `(${safe(row.code)})` : ""}
                  </option>
                ))}
              </FormSelect>

              <div className="flex items-center text-sm text-stone-500 dark:text-stone-400">
                {isSearchMode
                  ? "Search mode shows the best matching customers."
                  : "Browse mode loads customers in backend pages."}
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard
              title="Customer directory"
              subtitle="Select a customer to inspect profile, sales history, and credit exposure."
            >
              {customers.length === 0 ? (
                <EmptyState text="No customers match the current filters." />
              ) : (
                <div className="space-y-4">
                  {customers.map((row) => (
                    <CustomerCard
                      key={row.id}
                      row={row}
                      active={String(row.id) === String(selectedCustomerId)}
                      onSelect={(picked) => setSelectedCustomerId(picked?.id)}
                    />
                  ))}
                </div>
              )}

              {!isSearchMode && nextCursor ? (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMoreCustomers}
                    disabled={loadingMore}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    {loadingMore ? "Loading..." : `Load ${PAGE_SIZE} more`}
                  </button>
                </div>
              ) : null}
            </SectionCard>

            {selectedCustomer ? (
              <SectionCard
                title="Selected customer detail"
                subtitle="Focused owner view of customer identity, credit exposure, and transaction history."
                right={
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                      {displayBranch(selectedCustomer)}
                    </span>

                    {safe(selectedCustomer?.tin) ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        TIN on file
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        No TIN
                      </span>
                    )}
                  </div>
                }
              >
                {detailLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-28 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        label="Customer"
                        value={safe(selectedCustomer?.name) || "-"}
                        sub={safe(selectedCustomer?.phone) || "No phone"}
                        valueClassName="text-[17px] leading-tight"
                      />

                      <StatCard
                        label="Sales count"
                        value={safeNumber(selectedCustomer?.salesCount)}
                        sub="Recorded sales"
                        valueClassName="text-[17px] leading-tight"
                      />

                      <StatCard
                        label="Sales total"
                        value={money(selectedTotals.salesTotal, "RWF")}
                        sub="Stable owner total"
                        valueClassName="text-[17px] leading-tight"
                      />

                      <StatCard
                        label="Open credit"
                        value={money(selectedTotals.creditsTotal, "RWF")}
                        sub="Current exposure"
                        valueClassName="text-[17px] leading-tight"
                      />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Customer profile
                        </p>

                        <div className="mt-4 grid gap-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <DetailMetricCard
                              label="Phone"
                              value={safe(selectedCustomer?.phone) || "-"}
                            />
                            <DetailMetricCard
                              label="TIN"
                              value={safe(selectedCustomer?.tin) || "-"}
                            />
                          </div>

                          <DetailMetricCard
                            label="Address"
                            value={safe(selectedCustomer?.address) || "-"}
                          />

                          <DetailMetricCard
                            label="Notes"
                            value={
                              safe(selectedCustomer?.notes) ||
                              "No notes recorded"
                            }
                          />

                          <div className="grid gap-3 sm:grid-cols-2">
                            <DetailMetricCard
                              label="Created"
                              value={safeDate(selectedCustomer?.createdAt)}
                            />
                            <DetailMetricCard
                              label="Updated"
                              value={safeDate(selectedCustomer?.updatedAt)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Customer totals
                        </p>

                        <div className="mt-4 grid gap-3">
                          <DetailMetricCard
                            label="Sales total"
                            value={money(selectedTotals.salesTotal, "RWF")}
                            tone="default"
                            sub="Trusted from customer row first"
                          />
                          <DetailMetricCard
                            label="Payments total"
                            value={money(selectedTotals.paymentsTotal, "RWF")}
                            tone="success"
                            sub="History totals or stable fallback"
                          />
                          <DetailMetricCard
                            label="Credit total"
                            value={money(selectedTotals.creditsTotal, "RWF")}
                            tone="danger"
                            sub="Outstanding or historical credit"
                          />
                          <DetailMetricCard
                            label="Refunds total"
                            value={money(selectedTotals.refundsTotal, "RWF")}
                            tone="default"
                            sub="Recorded refunds"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                        Recent customer history
                      </p>

                      {(history?.sales || []).length === 0 ? (
                        <div className="mt-4">
                          <EmptyState text="No customer history found for the current filter." />
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {history.sales.map((row, index) => (
                            <div
                              key={row?.id ?? index}
                              className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                    Sale #{safe(row?.id) || "-"}
                                  </p>
                                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                    {safeDate(row?.createdAt)}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                    {safe(row?.status) || "-"}
                                  </span>

                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    {money(row?.totalAmount, "RWF")}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Payment
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                    {money(row?.paymentAmount, "RWF")}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Payment method
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                    {safe(row?.paymentMethod) || "-"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Credit
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                    {money(row?.creditAmount, "RWF")}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Refunds
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                    {money(row?.refundAmount, "RWF")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </SectionCard>
            ) : (
              <SectionCard
                title="Selected customer detail"
                subtitle="This section appears after a customer is selected."
              >
                <EmptyState text="Select a customer card above to inspect profile and history." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      <CreateCustomerModal
        key={createModalKey}
        open={creatingCustomer}
        onClose={() => setCreatingCustomer(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
