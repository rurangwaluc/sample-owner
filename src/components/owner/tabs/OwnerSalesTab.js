"use client";

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
import { useEffect, useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";
import { apiFetch } from "../../../lib/api";

const PAGE_SIZE = 20;

const SALE_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "PENDING", label: "Credit pending" },
  { value: "AWAITING_PAYMENT_RECORD", label: "Awaiting payment record" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "APPROVED", label: "Approved credits" },
  { value: "PARTIALLY_PAID", label: "Partially paid credits" },
  { value: "SETTLED", label: "Settled credits" },
  { value: "REJECTED", label: "Rejected credits" },
];

const MARK_STATUS_OPTIONS = [
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Credit" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Select payment method" },
  { value: "CASH", label: "Cash" },
  { value: "MOMO", label: "MoMo" },
  { value: "BANK", label: "Bank" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
];

function money(v) {
  return safeNumber(v).toLocaleString();
}

function normalizeUpper(v) {
  return safe(v).toUpperCase();
}

function normalizeCreditMode(v) {
  const out = normalizeUpper(v);
  return out || "OPEN_BALANCE";
}

function normalizeCreditStatusLabel(creditLike) {
  return (
    safe(creditLike?.statusLabel) ||
    safe(creditLike?.status_label) ||
    safe(creditLike?.creditStatusLabel) ||
    safe(creditLike?.credit_status_label) ||
    ""
  );
}

function deriveCreditStatusLabel(status, creditMode) {
  const st = normalizeUpper(status);
  const mode = normalizeCreditMode(creditMode);

  if (st === "PENDING" || st === "PENDING_APPROVAL") {
    return "Pending approval";
  }

  if (st === "APPROVED") {
    return mode === "INSTALLMENT_PLAN"
      ? "Approved as installment plan"
      : "Approved as open balance";
  }

  if (st === "PARTIALLY_PAID") return "Partially paid";
  if (st === "SETTLED") return "Settled";
  if (st === "REJECTED") return "Credit request rejected";

  return safe(status) || "";
}

function normalizeCreditRow(row) {
  if (!row) return null;

  const creditMode = normalizeCreditMode(
    row.creditMode ??
      row.credit_mode ??
      row.mode ??
      row.credit_mode_label ??
      "OPEN_BALANCE",
  );

  const status = normalizeUpper(
    row.status ?? row.creditStatus ?? row.credit_status,
  );
  const principalAmount = Number(
    row.principalAmount ??
      row.principal_amount ??
      row.creditPrincipalAmount ??
      row.credit_principal_amount ??
      row.amount ??
      row.creditAmount ??
      row.credit_amount ??
      0,
  );

  const paidAmount = Number(
    row.paidAmount ??
      row.paid_amount ??
      row.creditPaidAmount ??
      row.credit_paid_amount ??
      0,
  );

  const remainingAmount = Number(
    row.remainingAmount ??
      row.remaining_amount ??
      row.creditRemainingAmount ??
      row.credit_remaining_amount ??
      Math.max(0, principalAmount - paidAmount),
  );

  const statusLabel =
    normalizeCreditStatusLabel(row) ||
    deriveCreditStatusLabel(status, creditMode);

  return {
    id: row.id ?? row.creditId ?? row.credit_id ?? null,
    status,
    statusLabel,
    creditMode,
    principalAmount,
    amount: principalAmount,
    paidAmount,
    remainingAmount,
    dueDate: row.dueDate ?? row.due_date ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    approvedAt: row.approvedAt ?? row.approved_at ?? null,
    rejectedAt: row.rejectedAt ?? row.rejected_at ?? null,
    settledAt: row.settledAt ?? row.settled_at ?? null,
    planSummary: safe(row.planSummary ?? row.plan_summary),
    nextInstallmentDue:
      row.nextInstallmentDue ?? row.next_installment_due ?? null,
    remainingBalanceLabel: safe(
      row.remainingBalanceLabel ?? row.remaining_balance_label,
    ),
    note: row.note ?? "",
  };
}

function saleStatusTone(status, creditStatus) {
  const credit = normalizeUpper(creditStatus);
  const sale = normalizeUpper(status);

  if (credit === "SETTLED") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (credit === "PARTIALLY_PAID") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  if (credit === "APPROVED") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  if (credit === "PENDING" || credit === "PENDING_APPROVAL") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (credit === "REJECTED") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (sale === "COMPLETED") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (sale === "FULFILLED") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (sale === "PENDING") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (sale === "AWAITING_PAYMENT_RECORD") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }
  if (sale === "CANCELLED") {
    return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
  }
  return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300";
}

function amountPaidTone(totalAmount, amountPaid) {
  const total = safeNumber(totalAmount);
  const paid = safeNumber(amountPaid);

  if (total > 0 && paid >= total) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (paid > 0) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function buildOwnerVisibleStatus(row) {
  const credit = row?.credit || null;
  if (credit?.statusLabel) return credit.statusLabel;
  return safe(row?.status) || "-";
}

function buildOwnerVisibleSummary(row) {
  const credit = row?.credit || null;
  if (!credit) return "";

  const parts = [];

  if (safe(credit.planSummary)) {
    parts.push(safe(credit.planSummary));
  }

  if (credit.nextInstallmentDue) {
    parts.push(`Next installment due ${safeDate(credit.nextInstallmentDue)}`);
  }

  if (safe(credit.remainingBalanceLabel)) {
    parts.push(safe(credit.remainingBalanceLabel));
  } else if (safeNumber(credit.remainingAmount) > 0) {
    parts.push(`Remaining balance ${money(credit.remainingAmount)} RWF`);
  }

  return parts.join(" • ");
}

function normalizeSaleRow(row) {
  if (!row) return null;

  const location =
    row.location && typeof row.location === "object"
      ? row.location
      : {
          id: row.locationId ?? row.location_id ?? null,
          name: row.locationName ?? row.location_name ?? "",
          code: row.locationCode ?? row.location_code ?? "",
        };

  const credit =
    row.credit && typeof row.credit === "object"
      ? normalizeCreditRow(row.credit)
      : row.creditId || row.credit_id || row.creditStatus || row.credit_status
        ? normalizeCreditRow({
            id: row.creditId ?? row.credit_id ?? null,
            status: row.creditStatus ?? row.credit_status ?? "",
            statusLabel: row.creditStatusLabel ?? row.credit_status_label ?? "",
            creditMode: row.creditMode ?? row.credit_mode ?? "OPEN_BALANCE",
            principalAmount:
              row.creditPrincipalAmount ??
              row.credit_principal_amount ??
              row.creditAmount ??
              row.credit_amount ??
              0,
            paidAmount: row.creditPaidAmount ?? row.credit_paid_amount ?? 0,
            remainingAmount:
              row.creditRemainingAmount ?? row.credit_remaining_amount ?? 0,
            createdAt: row.creditCreatedAt ?? row.credit_created_at ?? null,
            settledAt: row.creditSettledAt ?? row.credit_settled_at ?? null,
            dueDate: row.creditDueDate ?? row.credit_due_date ?? null,
            planSummary: row.planSummary ?? row.plan_summary ?? "",
            nextInstallmentDue:
              row.nextInstallmentDue ?? row.next_installment_due ?? null,
            remainingBalanceLabel:
              row.remainingBalanceLabel ?? row.remaining_balance_label ?? "",
          })
        : null;

  return {
    id: Number(row.id ?? 0),
    location,
    status: row.status ?? "",
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    paymentMethod: row.paymentMethod ?? row.payment_method ?? "",
    note: row.note ?? "",
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    canceledAt: row.canceledAt ?? row.canceled_at ?? null,
    canceledBy: row.canceledBy ?? row.canceled_by ?? null,
    cancelReason: row.cancelReason ?? row.cancel_reason ?? "",
    sellerId: row.sellerId ?? row.seller_id ?? null,
    sellerName: row.sellerName ?? row.seller_name ?? "",
    customerId: row.customerId ?? row.customer_id ?? null,
    customerName: row.customerName ?? row.customer_name ?? "",
    customerPhone: row.customerPhone ?? row.customer_phone ?? "",
    customerTin: row.customerTin ?? row.customer_tin ?? "",
    customerAddress: row.customerAddress ?? row.customer_address ?? "",
    amountPaid: Number(row.amountPaid ?? row.amount_paid ?? 0),
    credit,
    itemsPreview: Array.isArray(row.itemsPreview ?? row.items_preview)
      ? (row.itemsPreview ?? row.items_preview)
      : [],
  };
}

function normalizeSaleDetail(row) {
  if (!row) return null;

  const normalized = normalizeSaleRow(row);

  return {
    ...normalized,
    items: Array.isArray(row.items)
      ? row.items.map((item) => ({
          id: Number(item.id ?? 0),
          productId: Number(item.productId ?? item.product_id ?? 0),
          productName: item.productName ?? item.product_name ?? "",
          sku: item.sku ?? "",
          qty: Number(item.qty ?? 0),
          unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
          lineTotal: Number(item.lineTotal ?? item.line_total ?? 0),
        }))
      : [],
  };
}

function SaleListRow({ row, active, onSelect }) {
  const displayStatus = buildOwnerVisibleStatus(row);
  const displaySummary = buildOwnerVisibleSummary(row);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[90px_160px_170px_140px_120px_140px_130px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
        (active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
          : "bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/70")
      }
    >
      <div className="text-sm font-bold">#{safe(row?.id) || "-"}</div>

      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold leading-5">
          {safe(row?.customerName) || "Walk-in"}
        </p>
        <p
          className={
            "mt-1 truncate text-[11px] leading-5 " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          {safe(row?.customerPhone) || "-"}
        </p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold leading-5">
          {safe(row?.location?.name) || "-"}
        </p>
        <p
          className={
            "mt-1 truncate text-[11px] leading-5 " +
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
          {safe(row?.sellerName) || "-"}
        </p>
        <p
          className={
            "mt-1 truncate text-[11px] leading-5 " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          Seller
        </p>
      </div>

      <div className="text-sm font-semibold">{money(row?.totalAmount)}</div>
      <div className="text-sm font-semibold">{money(row?.amountPaid)}</div>

      <div className="flex min-w-0 flex-col gap-1">
        <span
          className={
            "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : saleStatusTone(row?.status, row?.credit?.status))
          }
        >
          {displayStatus}
        </span>

        {displaySummary ? (
          <span
            className={
              "truncate text-[11px] " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
            title={displaySummary}
          >
            {displaySummary}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function SaleMobileRow({ row, active, onSelect }) {
  const displayStatus = buildOwnerVisibleStatus(row);
  const displaySummary = buildOwnerVisibleSummary(row);

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
          <p className="text-[13px] font-semibold leading-5">
            Sale #{safe(row?.id) || "-"}
          </p>
          <p
            className={
              "mt-1 truncate text-[11px] leading-5 " +
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
              "mt-1 truncate text-[11px] leading-5 " +
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
              : saleStatusTone(row?.status, row?.credit?.status))
          }
        >
          {displayStatus}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Total
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.totalAmount)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Paid
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.amountPaid)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Seller
          </p>
          <p className="mt-1 truncate text-sm font-bold">
            {safe(row?.sellerName) || "-"}
          </p>
        </div>
      </div>

      {displaySummary ? (
        <div
          className={
            "mt-3 text-[11px] leading-5 " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          {displaySummary}
        </div>
      ) : null}
    </button>
  );
}

export default function OwnerSalesTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const [modalError, setModalError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [markForm, setMarkForm] = useState({
    status: "PAID",
    paymentMethod: "CASH",
  });

  const [fulfillNote, setFulfillNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadSales() {
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    const params = new URLSearchParams();
    if (locationFilter) params.set("locationId", locationFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("q", search.trim());
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const summaryUrl = `/owner/sales/summary${qs}`;
    const listUrl = `/owner/sales${qs}`;

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
        "Failed to load sales summary";
    }

    if (listRes.status === "fulfilled") {
      const rows = Array.isArray(listRes.value?.sales)
        ? listRes.value.sales.map(normalizeSaleRow).filter(Boolean)
        : [];

      setSales(rows);
      setSelectedSaleId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev))
          ? prev
          : (rows[0]?.id ?? null),
      );
    } else {
      setSales([]);
      setSelectedSaleId(null);
      firstError =
        firstError ||
        listRes.reason?.data?.error ||
        listRes.reason?.message ||
        "Failed to load sales";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, statusFilter, locationFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, locationFilter, dateFrom, dateTo]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadSales();
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const visibleRows = useMemo(
    () => sales.slice(0, visibleCount),
    [sales, visibleCount],
  );

  const hasMoreRows = visibleCount < sales.length;

  const selectedSale =
    selectedSaleId == null
      ? null
      : sales.find((row) => String(row.id) === String(selectedSaleId)) || null;

  useEffect(() => {
    async function loadDetail() {
      if (!selectedSale?.id) {
        setSelectedSaleDetail(null);
        return;
      }

      setDetailLoading(true);

      try {
        const result = await apiFetch(`/owner/sales/${selectedSale.id}`, {
          method: "GET",
        });
        setSelectedSaleDetail(normalizeSaleDetail(result?.sale));
      } catch {
        setSelectedSaleDetail(null);
      } finally {
        setDetailLoading(false);
      }
    }

    loadDetail();
  }, [selectedSale?.id]);

  const summaryTotals = summary?.totals || {
    branchesCount: 0,
    salesCount: 0,
    totalSalesAmount: 0,
    draftCount: 0,
    fulfilledCount: 0,
    pendingCount: 0,
    awaitingPaymentRecordCount: 0,
    completedCount: 0,
    cancelledCount: 0,
  };

  function openMarkModal() {
    setModalError("");
    setMarkForm({ status: "PAID", paymentMethod: "CASH" });
    setMarkModalOpen(true);
  }

  function closeMarkModal() {
    setMarkModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
  }

  function openFulfillModal() {
    setModalError("");
    setFulfillNote("");
    setFulfillModalOpen(true);
  }

  function closeFulfillModal() {
    setFulfillModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
  }

  function openCancelModal() {
    setModalError("");
    setCancelReason("");
    setCancelModalOpen(true);
  }

  function closeCancelModal() {
    setCancelModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
  }

  async function submitMarkSale() {
    if (!selectedSale?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/sales/${selectedSale.id}/mark`, {
        method: "POST",
        body: {
          status: markForm.status,
          paymentMethod:
            markForm.status === "PAID" ? markForm.paymentMethod : undefined,
        },
      });

      closeMarkModal();
      await loadSales();
      setSelectedSaleId(selectedSale.id);
      setSuccessText("Sale updated successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to mark sale",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function submitFulfillSale() {
    if (!selectedSale?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/sales/${selectedSale.id}/fulfill`, {
        method: "POST",
        body: {
          note: safe(fulfillNote) || undefined,
        },
      });

      closeFulfillModal();
      await loadSales();
      setSelectedSaleId(selectedSale.id);
      setSuccessText("Sale fulfilled successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to fulfill sale",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function submitCancelSale() {
    if (!selectedSale?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/sales/${selectedSale.id}/cancel`, {
        method: "POST",
        body: {
          reason: safe(cancelReason),
        },
      });

      closeCancelModal();
      await loadSales();
      setSelectedSaleId(selectedSale.id);
      setSuccessText("Sale cancelled successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to cancel sale",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  const selectedDisplayStatus = buildOwnerVisibleStatus(selectedSale);
  const selectedDisplaySummary = buildOwnerVisibleSummary(selectedSale);

  const canFulfill = normalizeUpper(selectedSale?.status) === "DRAFT";

  const canMark = ["FULFILLED", "PENDING", "AWAITING_PAYMENT_RECORD"].includes(
    normalizeUpper(selectedSale?.status),
  );

  const canCancel = !["COMPLETED", "CANCELLED"].includes(
    normalizeUpper(selectedSale?.status),
  );

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard title="Sales" subtitle="Loading owner cross-branch sales.">
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
            title="Cross-branch sales summary"
            subtitle="Owner-wide money movement across all branches."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard
                label="Branches"
                value={
                  <span className="text-[19px]">
                    {safeNumber(summaryTotals.branchesCount)}
                  </span>
                }
                sub="Branches with visible sales"
              />
              <StatCard
                label="Sales"
                value={safeNumber(summaryTotals.salesCount)}
                sub="Sales in current filter"
              />
              <StatCard
                label="Total amount"
                value={
                  <span className="text-[19px]">
                    {money(summaryTotals.totalSalesAmount)}
                  </span>
                }
                sub="Gross sales value"
              />
              <StatCard
                label="Completed"
                value={safeNumber(summaryTotals.completedCount)}
                sub="Fully completed sales"
              />
              <StatCard
                label="Credit pending"
                value={safeNumber(summaryTotals.pendingCount)}
                sub="Sales marked as credit"
              />
              <StatCard
                label="Awaiting payment"
                value={safeNumber(summaryTotals.awaitingPaymentRecordCount)}
                sub="Need payment recording"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Sales directory"
            subtitle="Search, filter, inspect, and control sales across branches."
          >
            <div className="grid gap-3 lg:grid-cols-5">
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sale, customer, phone, seller"
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
                {SALE_STATUS_OPTIONS.map((row) => (
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
                Showing {Math.min(visibleRows.length, sales.length)} of{" "}
                {sales.length}
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[90px_160px_170px_140px_120px_140px_130px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Sale</div>
                <div>Customer</div>
                <div>Branch</div>
                <div>Seller</div>
                <div>Total</div>
                <div>Paid</div>
                <div>Status</div>
              </div>

              {sales.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No sales match the current owner filters." />
                </div>
              ) : (
                <div>
                  {visibleRows.map((row) => (
                    <div key={row.id}>
                      <SaleListRow
                        row={row}
                        active={String(row.id) === String(selectedSaleId)}
                        onSelect={(picked) => setSelectedSaleId(picked?.id)}
                      />
                      <div className="p-3 lg:hidden">
                        <SaleMobileRow
                          row={row}
                          active={String(row.id) === String(selectedSaleId)}
                          onSelect={(picked) => setSelectedSaleId(picked?.id)}
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

          {selectedSale ? (
            <SectionCard
              title="Selected sale detail"
              subtitle="Focused sale detail with owner controls."
              right={
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${saleStatusTone(
                    selectedSale?.status,
                    selectedSale?.credit?.status,
                  )}`}
                >
                  {selectedDisplayStatus}
                </span>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                  <StatCard
                    label="Sale"
                    value={`#${safe(selectedSale.id) || "-"}`}
                    sub={safeDate(selectedSale.createdAt)}
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Branch"
                    value={safe(selectedSale.location?.name) || "-"}
                    sub={safe(selectedSale.location?.code) || "-"}
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Customer"
                    value={safe(selectedSale.customerName) || "Walk-in"}
                    sub={safe(selectedSale.customerPhone) || "-"}
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Seller"
                    value={safe(selectedSale.sellerName) || "-"}
                    sub="Recorded seller"
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Total"
                    value={money(selectedSale.totalAmount)}
                    sub="Sale total"
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Paid"
                    value={money(selectedSale.amountPaid)}
                    sub={
                      safe(selectedSale.paymentMethod) || "No payment method"
                    }
                    valueClassName="text-[17px] leading-tight"
                  />
                </div>

                {selectedDisplaySummary ? (
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                    {selectedDisplaySummary}
                  </div>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Sale detail
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
                    ) : !selectedSaleDetail ? (
                      <div className="mt-4">
                        <EmptyState text="No sale detail available." />
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
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${saleStatusTone(
                                  selectedSaleDetail.status,
                                  selectedSaleDetail.credit?.status,
                                )}`}
                              >
                                {buildOwnerVisibleStatus(selectedSaleDetail)}
                              </span>
                            </p>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                              Amount paid
                            </p>
                            <p className="mt-2">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${amountPaidTone(
                                  selectedSaleDetail.totalAmount,
                                  selectedSale.amountPaid,
                                )}`}
                              >
                                {money(selectedSale.amountPaid)}
                              </span>
                            </p>
                          </div>
                        </div>

                        {selectedSaleDetail.credit ? (
                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                              Credit detail
                            </p>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Credit status
                                </p>
                                <p className="mt-1 text-sm font-bold text-stone-900 dark:text-stone-100">
                                  {safe(
                                    selectedSaleDetail.credit.statusLabel,
                                  ) || "-"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Credit mode
                                </p>
                                <p className="mt-1 text-sm font-bold text-stone-900 dark:text-stone-100">
                                  {safe(selectedSaleDetail.credit.creditMode) ||
                                    "-"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Principal
                                </p>
                                <p className="mt-1 text-sm font-bold text-stone-900 dark:text-stone-100">
                                  {money(
                                    selectedSaleDetail.credit.principalAmount,
                                  )}
                                </p>
                              </div>

                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Remaining
                                </p>
                                <p className="mt-1 text-sm font-bold text-stone-900 dark:text-stone-100">
                                  {money(
                                    selectedSaleDetail.credit.remainingAmount,
                                  )}
                                </p>
                              </div>
                            </div>

                            {buildOwnerVisibleSummary(selectedSaleDetail) ? (
                              <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                                {buildOwnerVisibleSummary(selectedSaleDetail)}
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                            Items
                          </p>

                          {Array.isArray(selectedSaleDetail.items) &&
                          selectedSaleDetail.items.length > 0 ? (
                            <div className="mt-4 space-y-3">
                              {selectedSaleDetail.items.map((item) => (
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
                              <EmptyState text="No sale items found." />
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                            Notes and cancellation
                          </p>
                          <div className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Note
                              </span>
                              <span className="max-w-[70%] text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safe(selectedSaleDetail.note) || "No note"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Cancelled at
                              </span>
                              <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safeDate(selectedSaleDetail.canceledAt)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500 dark:text-stone-400">
                                Cancel reason
                              </span>
                              <span className="max-w-[70%] text-right font-semibold text-stone-900 dark:text-stone-100">
                                {safe(selectedSaleDetail.cancelReason) || "-"}
                              </span>
                            </div>
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
                        idleText="Fulfill sale"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => openFulfillModal()}
                        className="w-full"
                        disabled={!canFulfill}
                      />

                      <AsyncButton
                        idleText="Mark sale"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => openMarkModal()}
                        className="w-full"
                        disabled={!canMark}
                      />

                      <AsyncButton
                        idleText="Cancel sale"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => openCancelModal()}
                        variant="secondary"
                        className="w-full"
                        disabled={!canCancel}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      The owner can review and control branch sales here.
                      Actions are only enabled when the current sale status
                      allows them.
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected sale detail"
              subtitle="This section appears after the owner deliberately selects a sale."
            >
              <EmptyState text="Click any sale row above to inspect details and control the sale." />
            </SectionCard>
          )}
        </>
      )}

      <OverlayModal
        open={markModalOpen}
        title="Mark sale"
        subtitle="Mark the selected sale as paid or credit."
        onClose={closeMarkModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeMarkModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitMarkSale}
              disabled={
                modalSubmitting ||
                !markForm.status ||
                (markForm.status === "PAID" && !markForm.paymentMethod)
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div>
            <FieldLabel htmlFor="mark-status">Mark as</FieldLabel>
            <FormSelect
              id="mark-status"
              value={markForm.status}
              onChange={(e) =>
                setMarkForm((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
            >
              {MARK_STATUS_OPTIONS.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </FormSelect>
          </div>

          {markForm.status === "PAID" ? (
            <div>
              <FieldLabel htmlFor="payment-method">Payment method</FieldLabel>
              <FormSelect
                id="payment-method"
                value={markForm.paymentMethod}
                onChange={(e) =>
                  setMarkForm((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
              >
                {PAYMENT_METHOD_OPTIONS.map((row) => (
                  <option key={row.value} value={row.value}>
                    {row.label}
                  </option>
                ))}
              </FormSelect>
            </div>
          ) : null}
        </div>
      </OverlayModal>

      <OverlayModal
        open={fulfillModalOpen}
        title="Fulfill sale"
        subtitle="Deduct inventory and move the sale to fulfilled."
        onClose={closeFulfillModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeFulfillModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitFulfillSale}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Fulfilling..." : "Confirm fulfill"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div>
            <FieldLabel htmlFor="fulfill-note">Note</FieldLabel>
            <FormTextarea
              id="fulfill-note"
              value={fulfillNote}
              onChange={(e) => setFulfillNote(e.target.value)}
              placeholder="Optional fulfillment note"
            />
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={cancelModalOpen}
        title="Cancel sale"
        subtitle="Cancel the selected sale and restore stock when applicable."
        onClose={closeCancelModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeCancelModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitCancelSale}
              disabled={modalSubmitting || !safe(cancelReason)}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Cancelling..." : "Confirm cancel"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div>
            <FieldLabel htmlFor="cancel-reason">Reason</FieldLabel>
            <FormTextarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Why is this sale being cancelled?"
            />
          </div>
        </div>
      </OverlayModal>
    </div>
  );
}
