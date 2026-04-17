"use client";

import {
  AlertBox,
  EmptyState,
  FormInput,
  FormSelect,
  safe,
  safeDate,
  safeNumber,
} from "../OwnerShared";
import { useEffect, useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";
import { apiFetch } from "../../../lib/api";

const PAGE_SIZE = 20;

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeCurrency(v) {
  const s = String(v || "RWF")
    .trim()
    .toUpperCase();
  return s || "RWF";
}

function money(v, currency = "RWF") {
  return `${normalizeCurrency(currency)} ${safeNumber(v).toLocaleString()}`;
}

function normalizeBillsResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.bills)) return result.bills;
  if (Array.isArray(result?.supplierBills)) return result.supplierBills;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizePurchaseOrdersResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.purchaseOrders)) return result.purchaseOrders;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeGoodsReceiptsResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.goodsReceipts)) return result.goodsReceipts;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeSupplier(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    name: row.name ?? "",
    defaultCurrency: normalizeCurrency(
      row.defaultCurrency ?? row.default_currency ?? "RWF",
    ),
    sourceType: row.sourceType ?? row.source_type ?? "LOCAL",
    isActive: row.isActive ?? row.is_active ?? true,
  };
}

function normalizePurchaseOrder(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    supplierId: row.supplierId ?? row.supplier_id ?? null,
    supplierName: row.supplierName ?? row.supplier_name ?? "",
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    poNo: row.poNo ?? row.po_no ?? "",
    reference: row.reference ?? "",
    currency: normalizeCurrency(row.currency),
    status: row.status ?? "DRAFT",
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    orderedAt: row.orderedAt ?? row.ordered_at ?? null,
    expectedAt: row.expectedAt ?? row.expected_at ?? null,
  };
}

function normalizeGoodsReceipt(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    purchaseOrderId: row.purchaseOrderId ?? row.purchase_order_id ?? null,
    supplierId: row.supplierId ?? row.supplier_id ?? null,
    supplierName: row.supplierName ?? row.supplier_name ?? "",
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    receiptNo: row.receiptNo ?? row.receipt_no ?? "",
    reference: row.reference ?? "",
    note: row.note ?? "",
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    totalLines: Number(row.totalLines ?? row.total_lines ?? 0),
    totalUnitsReceived: Number(
      row.totalUnitsReceived ?? row.total_units_received ?? 0,
    ),
    receivedAt: row.receivedAt ?? row.received_at ?? null,
  };
}

function normalizeBill(row) {
  if (!row) return null;

  const totalAmount = Number(row.totalAmount ?? row.total_amount ?? 0);
  const paidAmount = Number(row.paidAmount ?? row.paid_amount ?? 0);
  const balance =
    row.balance != null
      ? Number(row.balance)
      : Math.max(0, totalAmount - paidAmount);

  return {
    id: row.id ?? null,
    supplierId: row.supplierId ?? row.supplier_id ?? null,
    supplierName: row.supplierName ?? row.supplier_name ?? "Unknown supplier",
    supplierDefaultCurrency:
      row.supplierDefaultCurrency ?? row.supplier_default_currency ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    purchaseOrderId: row.purchaseOrderId ?? row.purchase_order_id ?? null,
    goodsReceiptId: row.goodsReceiptId ?? row.goods_receipt_id ?? null,
    billNo: row.billNo ?? row.bill_no ?? "",
    currency: normalizeCurrency(row.currency),
    totalAmount,
    paidAmount,
    balance,
    status: row.status ?? "OPEN",
    issuedDate: row.issuedDate ?? row.issued_date ?? null,
    dueDate: row.dueDate ?? row.due_date ?? null,
    note: row.note ?? "",
    createdByUserId: row.createdByUserId ?? row.created_by_user_id ?? null,
    createdByName: row.createdByName ?? row.created_by_name ?? "",
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    isOverdue: !!(row.isOverdue ?? row.is_overdue),
    daysOverdue: Number(row.daysOverdue ?? row.days_overdue ?? 0),
  };
}

function normalizeBillDetail(result) {
  const rawBill = result?.bill || null;

  return {
    bill: rawBill ? normalizeBill(rawBill) : null,
    items: Array.isArray(result?.items) ? result.items : [],
    payments: Array.isArray(result?.payments) ? result.payments : [],
  };
}

function findLocationMeta(locations, locationId) {
  const rows = Array.isArray(locations) ? locations : [];
  return rows.find((row) => String(row?.id) === String(locationId)) || null;
}

function findLocationCode(locations = [], locationId = "") {
  const row =
    (Array.isArray(locations) ? locations : []).find(
      (item) => String(item?.id) === String(locationId),
    ) || null;

  return safe(row?.code) || safe(row?.name) || "BRANCH";
}

function displayBranch(row, locations = []) {
  if (safe(row?.locationName)) {
    return safe(row?.locationCode)
      ? `${safe(row.locationName)} (${safe(row.locationCode)})`
      : safe(row.locationName);
  }

  const meta = findLocationMeta(locations, row?.locationId);
  if (meta) {
    return safe(meta?.code)
      ? `${safe(meta?.name)} (${safe(meta?.code)})`
      : safe(meta?.name) || "-";
  }

  if (row?.locationId != null) {
    return `Branch #${row.locationId}`;
  }

  return "-";
}

function padBillSequence(value, size = 3) {
  return String(Math.max(1, Number(value) || 1)).padStart(size, "0");
}

function formatBillCodeDate(value) {
  const raw = String(value || "").trim();

  if (raw) {
    const direct = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (direct) return `${direct[1]}${direct[2]}${direct[3]}`;

    const d = new Date(raw);
    if (Number.isFinite(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}${m}${day}`;
    }
  }

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function formatBillIsoDay(value) {
  const raw = String(value || "").trim();

  if (raw) {
    const direct = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (direct) return `${direct[1]}-${direct[2]}-${direct[3]}`;

    const d = new Date(raw);
    if (Number.isFinite(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  }

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function makeAutoSupplierBillNo(locationCode, sequence, codeDate) {
  const branch = safe(locationCode || "BRANCH").toUpperCase();
  return `BILL-${branch}-${codeDate}-${padBillSequence(sequence, 3)}`;
}

async function buildNextSupplierBillNo({
  locationId,
  locations,
  issuedDate = "",
}) {
  const branchCode = findLocationCode(locations, locationId) || "BRANCH";
  const isoDay = formatBillIsoDay(issuedDate);
  const codeDate = formatBillCodeDate(issuedDate);

  const params = new URLSearchParams();
  params.set("locationId", String(locationId));
  params.set("from", isoDay);
  params.set("to", isoDay);
  params.set("limit", "200");

  const result = await apiFetch(`/owner/supplier-bills?${params.toString()}`, {
    method: "GET",
  });

  const rows = normalizeBillsResponse(result)
    .map(normalizeBill)
    .filter(Boolean);

  const sameDayRows = rows.filter((row) => {
    if (String(row?.locationId || "") !== String(locationId)) return false;
    return formatBillIsoDay(row?.issuedDate) === isoDay;
  });

  const nextSequence = sameDayRows.length + 1;

  return makeAutoSupplierBillNo(branchCode, nextSequence, codeDate);
}

function displayBranchSub(row, locations = []) {
  if (safe(row?.locationCode)) return safe(row.locationCode);

  const meta = findLocationMeta(locations, row?.locationId);
  if (safe(meta?.code)) return safe(meta.code);

  return "No branch code";
}

function displayCreatedBy(row) {
  if (safe(row?.createdByName)) return safe(row.createdByName);
  if (row?.createdByUserId != null) return `User #${row.createdByUserId}`;
  return "-";
}

function displayPurchaseOrderRef(row) {
  if (!row?.purchaseOrderId) return "Not linked";
  if (safe(row?.poNo)) return `${safe(row.poNo)} (#${row.purchaseOrderId})`;
  return `PO #${row.purchaseOrderId}`;
}

function displayGoodsReceiptRef(row) {
  if (!row?.goodsReceiptId) return "Not linked";
  if (safe(row?.receiptNo)) {
    return `${safe(row.receiptNo)} (#${row.goodsReceiptId})`;
  }
  return `GR #${row.goodsReceiptId}`;
}

function Pill({ tone = "neutral", children }) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
          : tone === "info"
            ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300"
            : "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
        cls,
      )}
    >
      {children}
    </span>
  );
}

function statusTone(status) {
  const s = safe(status).toUpperCase();
  if (s === "PAID") return "success";
  if (s === "PARTIALLY_PAID") return "warn";
  if (s === "OPEN" || s === "DRAFT") return "info";
  if (s === "VOID") return "danger";
  return "neutral";
}

function SectionShell({ title, hint, right, children }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.04)] dark:border-stone-800 dark:bg-stone-900 dark:shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 p-5 dark:border-stone-800">
        <div className="min-w-0">
          <div className="text-base font-black tracking-[-0.02em] text-stone-950 dark:text-stone-50">
            {title}
          </div>
          {hint ? (
            <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {hint}
            </div>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Surface({ children, className = "" }) {
  return (
    <div
      className={cx(
        "rounded-[24px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900",
        className,
      )}
    >
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub, tone = "default" }) {
  const valueClass =
    tone === "danger"
      ? "text-rose-700 dark:text-rose-300"
      : "text-stone-950 dark:text-stone-50";

  return (
    <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        {label}
      </div>
      <div className={cx("mt-2 text-lg font-black", valueClass)}>{value}</div>
      {sub ? (
        <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-[20px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
        {value || "-"}
      </div>
    </div>
  );
}

function BillCard({ row, active, onSelect, locations = [] }) {
  const currency = normalizeCurrency(row?.currency);
  const status = safe(row?.status) || "OPEN";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={cx(
        "w-full rounded-[24px] border p-4 text-left transition",
        active
          ? "border-stone-400 bg-stone-50 dark:border-stone-700 dark:bg-stone-950"
          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-950",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-black text-stone-950 dark:text-stone-50">
              Bill #{safe(row?.billNo || row?.id) || "-"}
            </div>
            <Pill tone={statusTone(status)}>{status}</Pill>
            <Pill tone="neutral">{currency}</Pill>
            <Pill tone={row?.isOverdue ? "danger" : "neutral"}>
              {row?.isOverdue
                ? `${safeNumber(row?.daysOverdue)}D OVERDUE`
                : "ON TIME"}
            </Pill>
          </div>

          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Supplier:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safe(row?.supplierName) || "-"}
            </b>{" "}
            • Branch:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {displayBranch(row, locations)}
            </b>
          </div>

          <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Issued:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safeDate(row?.issuedDate)}
            </b>{" "}
            • Due:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safeDate(row?.dueDate)}
            </b>
          </div>

          <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            PO:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {displayPurchaseOrderRef(row)}
            </b>{" "}
            • Goods receipt:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {displayGoodsReceiptRef(row)}
            </b>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Balance
          </div>
          <div className="mt-1 text-lg font-black text-stone-950 dark:text-stone-50">
            {money(row?.balance, currency)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            {displayCreatedBy(row)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-[18px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Total
          </div>
          <div className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {money(row?.totalAmount, currency)}
          </div>
        </div>
        <div className="rounded-[18px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Paid
          </div>
          <div className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {money(row?.paidAmount, currency)}
          </div>
        </div>
        <div className="rounded-[18px] border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-rose-700 dark:text-rose-300">
            Remaining
          </div>
          <div className="mt-2 text-sm font-bold text-rose-700 dark:text-rose-300">
            {money(row?.balance, currency)}
          </div>
        </div>
      </div>
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(2,6,23,0.22)] dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5 dark:border-stone-800">
          <div>
            <h3 className="text-xl font-black text-stone-950 dark:text-stone-50">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
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

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function billCreateDefaults(suppliers) {
  const firstSupplier = Array.isArray(suppliers) ? suppliers[0] : null;
  const defaultCurrency = normalizeCurrency(firstSupplier?.defaultCurrency);

  return {
    supplierId: "",
    locationId: "",
    purchaseOrderId: "",
    goodsReceiptId: "",
    billNo: "",
    currency: defaultCurrency || "RWF",
    totalAmount: "",
    issuedDate: "",
    dueDate: "",
    note: "",
    status: "OPEN",
  };
}

function billEditDefaults(bill) {
  return {
    supplierId: String(bill?.supplierId || ""),
    locationId: String(bill?.locationId || ""),
    purchaseOrderId: String(bill?.purchaseOrderId || ""),
    goodsReceiptId: String(bill?.goodsReceiptId || ""),
    billNo: safe(bill?.billNo) || "",
    currency: normalizeCurrency(bill?.currency),
    totalAmount: String(bill?.totalAmount ?? ""),
    issuedDate: bill?.issuedDate ? String(bill.issuedDate).slice(0, 10) : "",
    dueDate: bill?.dueDate ? String(bill.dueDate).slice(0, 10) : "",
    note: safe(bill?.note) || "",
    status: safe(bill?.status) || "OPEN",
  };
}

function buildPurchaseOrderOptionLabel(row) {
  const ref = safe(row?.poNo) || `PO #${row?.id}`;
  const supplier = safe(row?.supplierName) || "Unknown supplier";
  const branch = safe(row?.locationCode)
    ? `${safe(row?.locationName)} (${safe(row?.locationCode)})`
    : safe(row?.locationName) || "-";
  return `${ref} — ${supplier} — ${branch}`;
}

function buildGoodsReceiptOptionLabel(row) {
  if (!row) return "Goods receipt";

  const receiptNo =
    safe(row.receiptNo) ||
    safe(row.grnNo) ||
    safe(row.goodsReceiptNo) ||
    `GRN-${safeNumber(row.id)}`;

  const supplierName = safe(row.supplierName);
  const branchName = safe(row.locationName);
  const branchCode = safe(row.locationCode);
  const poNo = safe(row.purchaseOrderNo) || safe(row.poNo);
  const receivedAt =
    safeDate(row.receivedAt || row.createdAt || row.created_at) || "";
  const total =
    row.totalAmount != null
      ? money(row.totalAmount, row.currency || "RWF")
      : "";

  const parts = [
    receiptNo,
    supplierName,
    branchName ? `${branchName}${branchCode ? ` (${branchCode})` : ""}` : "",
    poNo ? `PO ${poNo}` : "",
    total,
    receivedAt,
  ].filter(Boolean);

  return parts.join(" • ");
}

function CreateBillModal({
  open,
  suppliers,
  locations,
  purchaseOrders,
  goodsReceipts,
  onClose,
  onSaved,
}) {
  if (!open) return null;

  return (
    <CreateBillModalInner
      key={`create-bill-${suppliers?.length || 0}`}
      suppliers={suppliers}
      locations={locations}
      purchaseOrders={purchaseOrders}
      goodsReceipts={goodsReceipts}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function CreateBillModalInner({
  suppliers,
  locations,
  purchaseOrders,
  goodsReceipts,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => billCreateDefaults(suppliers));
  const [errorText, setErrorText] = useState("");
  const [billNoLoading, setBillNoLoading] = useState(false);

  const selectedSupplier = useMemo(
    () =>
      (Array.isArray(suppliers) ? suppliers : []).find(
        (row) => String(row.id) === String(form.supplierId),
      ) || null,
    [suppliers, form.supplierId],
  );

  const filteredPurchaseOrders = useMemo(() => {
    const rows = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    return rows.filter((row) => {
      if (
        form.locationId &&
        String(row.locationId) !== String(form.locationId)
      ) {
        return false;
      }
      if (
        form.supplierId &&
        String(row.supplierId) !== String(form.supplierId)
      ) {
        return false;
      }
      return true;
    });
  }, [purchaseOrders, form.locationId, form.supplierId]);

  const filteredGoodsReceipts = useMemo(() => {
    const rows = Array.isArray(goodsReceipts) ? goodsReceipts : [];
    return rows.filter((row) => {
      if (
        form.locationId &&
        String(row.locationId) !== String(form.locationId)
      ) {
        return false;
      }
      if (
        form.supplierId &&
        String(row.supplierId) !== String(form.supplierId)
      ) {
        return false;
      }
      if (
        form.purchaseOrderId &&
        String(row.purchaseOrderId) !== String(form.purchaseOrderId)
      ) {
        return false;
      }
      return true;
    });
  }, [goodsReceipts, form.locationId, form.supplierId, form.purchaseOrderId]);

  const selectedPurchaseOrder = useMemo(
    () =>
      filteredPurchaseOrders.find(
        (row) => String(row.id) === String(form.purchaseOrderId),
      ) || null,
    [filteredPurchaseOrders, form.purchaseOrderId],
  );

  const effectiveCurrency = selectedSupplier?.defaultCurrency
    ? normalizeCurrency(selectedSupplier.defaultCurrency)
    : selectedPurchaseOrder?.currency
      ? normalizeCurrency(selectedPurchaseOrder.currency)
      : normalizeCurrency(form.currency);

  function handleSupplierChange(nextSupplierId) {
    setForm((prev) => ({
      ...prev,
      supplierId: nextSupplierId,
      purchaseOrderId: "",
      goodsReceiptId: "",
      billNo: "",
      totalAmount: "",
    }));
  }

  function handleLocationChange(nextLocationId) {
    setForm((prev) => ({
      ...prev,
      locationId: nextLocationId,
      purchaseOrderId: "",
      goodsReceiptId: "",
      billNo: "",
      totalAmount: "",
    }));
  }

  function handlePurchaseOrderChange(nextPurchaseOrderId) {
    const picked =
      filteredPurchaseOrders.find(
        (row) => String(row.id) === String(nextPurchaseOrderId),
      ) || null;

    setForm((prev) => ({
      ...prev,
      purchaseOrderId: nextPurchaseOrderId,
      goodsReceiptId: "",
      totalAmount: picked ? String(safeNumber(picked.totalAmount ?? 0)) : "",
    }));
  }

  function handleGoodsReceiptChange(nextGoodsReceiptId) {
    const picked =
      filteredGoodsReceipts.find(
        (row) => String(row.id) === String(nextGoodsReceiptId),
      ) || null;

    setForm((prev) => {
      const shouldUseGoodsReceiptAmount =
        picked &&
        (!prev.purchaseOrderId ||
          !safe(prev.totalAmount) ||
          Number(prev.totalAmount) <= 0);

      return {
        ...prev,
        goodsReceiptId: nextGoodsReceiptId,
        totalAmount: shouldUseGoodsReceiptAmount
          ? String(safeNumber(picked.totalAmount ?? 0))
          : prev.totalAmount,
      };
    });
  }

  useEffect(() => {
    let alive = true;

    async function refreshBillNo() {
      const currentLocationId = String(form.locationId || "").trim();
      if (!currentLocationId) return;

      setBillNoLoading(true);

      try {
        const nextBillNo = await buildNextSupplierBillNo({
          locationId: currentLocationId,
          locations,
          issuedDate: form.issuedDate,
        });

        if (!alive) return;

        setForm((prev) => {
          if (String(prev.locationId || "").trim() !== currentLocationId) {
            return prev;
          }

          return {
            ...prev,
            billNo: safe(nextBillNo),
          };
        });
      } catch (e) {
        if (!alive) return;
        setErrorText(
          e?.data?.error ||
            e?.message ||
            "Failed to generate supplier bill number.",
        );
      } finally {
        if (alive) setBillNoLoading(false);
      }
    }

    refreshBillNo();

    return () => {
      alive = false;
    };
  }, [form.locationId, form.issuedDate, locations]);

  async function handleSave() {
    setErrorText("");

    try {
      if (
        !Number.isFinite(Number(form.supplierId)) ||
        Number(form.supplierId) <= 0
      ) {
        setErrorText("Please choose a supplier.");
        return;
      }

      if (
        !Number.isFinite(Number(form.locationId)) ||
        Number(form.locationId) <= 0
      ) {
        setErrorText("Please choose a branch.");
        return;
      }

      if (
        !Number.isFinite(Number(form.totalAmount)) ||
        Number(form.totalAmount) <= 0
      ) {
        setErrorText("Please enter a valid total amount.");
        return;
      }

      if (billNoLoading || !safe(form.billNo)) {
        setErrorText(
          "Please wait a moment for the bill number to finish generating.",
        );
        return;
      }

      const payload = {
        supplierId: Number(form.supplierId),
        locationId: Number(form.locationId),
        ...(form.purchaseOrderId
          ? { purchaseOrderId: Number(form.purchaseOrderId) }
          : {}),
        ...(form.goodsReceiptId
          ? { goodsReceiptId: Number(form.goodsReceiptId) }
          : {}),
        billNo: safe(form.billNo),
        currency: effectiveCurrency || undefined,
        totalAmount: Number(form.totalAmount),
        issuedDate: form.issuedDate || undefined,
        dueDate: form.dueDate || undefined,
        note: safe(form.note) || undefined,
        status: form.status || undefined,
      };

      const result = await apiFetch("/owner/supplier-bills", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to create supplier bill",
      );
    }
  }

  return (
    <ModalShell
      title="Create supplier bill"
      subtitle="Create a supplier liability and optionally link it to a purchase order or received stock."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Supplier
          </label>
          <FormSelect
            value={form.supplierId}
            onChange={(e) => handleSupplierChange(e.target.value)}
          >
            <option value="">Choose supplier</option>
            {(Array.isArray(suppliers) ? suppliers : []).map((row) => (
              <option key={row.id} value={row.id}>
                {safe(row.name)}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Branch
          </label>
          <FormSelect
            value={form.locationId}
            onChange={(e) => handleLocationChange(e.target.value)}
          >
            <option value="">Choose branch</option>
            {(Array.isArray(locations) ? locations : []).map((row) => (
              <option key={row.id} value={row.id}>
                {safe(row.name)} {safe(row.code) ? `(${safe(row.code)})` : ""}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Linked purchase order
          </label>
          <FormSelect
            value={form.purchaseOrderId}
            onChange={(e) => handlePurchaseOrderChange(e.target.value)}
          >
            <option value="">No purchase order link</option>
            {filteredPurchaseOrders.map((row) => (
              <option key={row.id} value={row.id}>
                {buildPurchaseOrderOptionLabel(row)}
              </option>
            ))}
          </FormSelect>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            When a purchase order is selected, the bill amount is filled
            automatically from that purchase order total.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Linked goods receipt
          </label>
          <FormSelect
            value={form.goodsReceiptId}
            onChange={(e) => handleGoodsReceiptChange(e.target.value)}
          >
            <option value="">No goods receipt link</option>
            {filteredGoodsReceipts.map((row) => (
              <option key={row.id} value={row.id}>
                {buildGoodsReceiptOptionLabel(row)}
              </option>
            ))}
          </FormSelect>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Shows receipt number, supplier, branch, received date, and total
            value.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Bill number (automatic)
          </label>
          <FormInput
            value={form.billNo}
            readOnly
            disabled
            placeholder={billNoLoading ? "Generating..." : "Auto-generated"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Currency
          </label>
          <FormSelect
            value={effectiveCurrency}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currency: e.target.value }))
            }
            disabled={
              !!selectedSupplier?.defaultCurrency ||
              !!selectedPurchaseOrder?.currency
            }
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Total amount
          </label>
          <FormInput
            type="number"
            value={form.totalAmount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, totalAmount: e.target.value }))
            }
            placeholder="0"
          />
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Auto-filled from the selected purchase order. You can still adjust
            it if the supplier bill differs.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Status
          </label>
          <FormSelect
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Issued date
          </label>
          <FormInput
            type="date"
            value={form.issuedDate}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                issuedDate: e.target.value,
                billNo: "",
              }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Due date
          </label>
          <FormInput
            type="date"
            value={form.dueDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dueDate: e.target.value }))
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Bill note
          </label>
          <textarea
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Bill note"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>
        <AsyncButton
          idleText="Create supplier bill"
          loadingText={billNoLoading ? "Preparing..." : "Creating..."}
          successText="Created"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function EditBillModal({
  open,
  bill,
  suppliers,
  locations,
  purchaseOrders,
  goodsReceipts,
  onClose,
  onSaved,
}) {
  if (!open || !bill) return null;

  return (
    <EditBillModalInner
      key={`edit-bill-${bill.id}-${bill.updatedAt || ""}`}
      bill={bill}
      suppliers={suppliers}
      locations={locations}
      purchaseOrders={purchaseOrders}
      goodsReceipts={goodsReceipts}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function EditBillModalInner({
  bill,
  suppliers,
  locations,
  purchaseOrders,
  goodsReceipts,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => billEditDefaults(bill));
  const [errorText, setErrorText] = useState("");

  const selectedSupplier = useMemo(
    () =>
      (Array.isArray(suppliers) ? suppliers : []).find(
        (row) => String(row.id) === String(form.supplierId),
      ) || null,
    [suppliers, form.supplierId],
  );

  const filteredPurchaseOrders = useMemo(() => {
    const rows = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    return rows.filter((row) => {
      if (form.locationId && String(row.locationId) !== String(form.locationId))
        return false;
      if (form.supplierId && String(row.supplierId) !== String(form.supplierId))
        return false;
      return true;
    });
  }, [purchaseOrders, form.locationId, form.supplierId]);

  const filteredGoodsReceipts = useMemo(() => {
    const rows = Array.isArray(goodsReceipts) ? goodsReceipts : [];
    return rows.filter((row) => {
      if (form.locationId && String(row.locationId) !== String(form.locationId))
        return false;
      if (form.supplierId && String(row.supplierId) !== String(form.supplierId))
        return false;
      if (
        form.purchaseOrderId &&
        String(row.purchaseOrderId) !== String(form.purchaseOrderId)
      )
        return false;
      return true;
    });
  }, [goodsReceipts, form.locationId, form.supplierId, form.purchaseOrderId]);

  const selectedPurchaseOrder = useMemo(
    () =>
      filteredPurchaseOrders.find(
        (row) => String(row.id) === String(form.purchaseOrderId),
      ) || null,
    [filteredPurchaseOrders, form.purchaseOrderId],
  );

  const effectiveCurrency = selectedSupplier?.defaultCurrency
    ? normalizeCurrency(selectedSupplier.defaultCurrency)
    : selectedPurchaseOrder?.currency
      ? normalizeCurrency(selectedPurchaseOrder.currency)
      : normalizeCurrency(form.currency);

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        supplierId: Number(form.supplierId),
        locationId: Number(form.locationId),
        purchaseOrderId: form.purchaseOrderId
          ? Number(form.purchaseOrderId)
          : null,
        goodsReceiptId: form.goodsReceiptId
          ? Number(form.goodsReceiptId)
          : null,
        billNo: form.billNo || undefined,
        currency: effectiveCurrency || undefined,
        totalAmount: Number(form.totalAmount),
        issuedDate: form.issuedDate || undefined,
        dueDate: form.dueDate || undefined,
        note: form.note || undefined,
        status: form.status || undefined,
      };

      const result = await apiFetch(`/owner/supplier-bills/${bill.id}`, {
        method: "PATCH",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to update supplier bill",
      );
    }
  }

  return (
    <ModalShell
      title={`Edit supplier bill #${bill.id}`}
      subtitle="Update supplier, branch, linked procurement records, bill details, dates, and amount."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Supplier
          </label>
          <FormSelect
            value={form.supplierId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                supplierId: e.target.value,
                purchaseOrderId: "",
                goodsReceiptId: "",
              }))
            }
          >
            <option value="">Choose supplier</option>
            {suppliers.map((row) => (
              <option key={row.id} value={row.id}>
                {safe(row.name)}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Branch
          </label>
          <FormSelect
            value={form.locationId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                locationId: e.target.value,
                purchaseOrderId: "",
                goodsReceiptId: "",
              }))
            }
          >
            <option value="">Choose branch</option>
            {locations.map((row) => (
              <option key={row.id} value={row.id}>
                {safe(row.name)} {safe(row.code) ? `(${safe(row.code)})` : ""}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Linked purchase order
          </label>
          <FormSelect
            value={form.purchaseOrderId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                purchaseOrderId: e.target.value,
                goodsReceiptId: "",
              }))
            }
          >
            <option value="">No purchase order link</option>
            {filteredPurchaseOrders.map((row) => (
              <option key={row.id} value={row.id}>
                {buildPurchaseOrderOptionLabel(row)}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Linked goods receipt
          </label>
          <FormSelect
            value={form.goodsReceiptId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, goodsReceiptId: e.target.value }))
            }
          >
            <option value="">No goods receipt link</option>
            {filteredGoodsReceipts.map((row) => (
              <option key={row.id} value={row.id}>
                {buildGoodsReceiptOptionLabel(row)}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Bill number
          </label>
          <FormInput
            value={form.billNo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, billNo: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Currency
          </label>
          <FormSelect
            value={effectiveCurrency}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currency: e.target.value }))
            }
            disabled={
              !!selectedSupplier?.defaultCurrency ||
              !!selectedPurchaseOrder?.currency
            }
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Total amount
          </label>
          <FormInput
            type="number"
            value={form.totalAmount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, totalAmount: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Status
          </label>
          <FormSelect
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="PARTIALLY_PAID">Partially paid</option>
            <option value="PAID">Paid</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Issued date
          </label>
          <FormInput
            type="date"
            value={form.issuedDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, issuedDate: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Due date
          </label>
          <FormInput
            type="date"
            value={form.dueDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dueDate: e.target.value }))
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Bill note
          </label>
          <textarea
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>
        <AsyncButton
          idleText="Save supplier bill"
          loadingText="Saving..."
          successText="Saved"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function AddPaymentModal({ open, bill, onClose, onSaved }) {
  if (!open || !bill) return null;

  return (
    <AddPaymentModalInner
      key={`payment-${bill.id}-${bill.balance}-${bill.updatedAt || ""}`}
      bill={bill}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function buildSupplierBillPaymentReference(bill, method = "BANK") {
  const methodCode = String(method || "BANK")
    .trim()
    .toUpperCase();
  const billNo = safe(bill?.billNo);
  const purchaseOrderNo = safe(bill?.purchaseOrderNo);
  const goodsReceiptNo = safe(bill?.goodsReceiptNo);
  const billId = safeNumber(bill?.id);

  const base =
    billNo ||
    purchaseOrderNo ||
    goodsReceiptNo ||
    `BILL-${String(billId || "").trim() || "NA"}`;

  return `${methodCode}-PAY-${base}`;
}

function AddPaymentModalInner({ bill, onClose, onSaved }) {
  const initialMethod = "BANK";
  const initialAutoReference = buildSupplierBillPaymentReference(
    bill,
    initialMethod,
  );

  const [form, setForm] = useState({
    amount: String(bill?.balance ?? ""),
    method: initialMethod,
    reference: initialAutoReference,
    note: "",
    paidAt: "",
  });
  const [errorText, setErrorText] = useState("");

  function handleMethodChange(nextMethod) {
    setForm((prev) => {
      const previousAuto = buildSupplierBillPaymentReference(bill, prev.method);
      const nextAuto = buildSupplierBillPaymentReference(bill, nextMethod);

      const shouldReplaceReference =
        !safe(prev.reference) || safe(prev.reference) === previousAuto;

      return {
        ...prev,
        method: nextMethod,
        reference: shouldReplaceReference ? nextAuto : prev.reference,
      };
    });
  }

  async function handleSave() {
    setErrorText("");

    try {
      const amount = Number(form.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        setErrorText("Please enter a valid payment amount.");
        return;
      }

      const payload = {
        amount,
        method: form.method,
        reference: safe(form.reference) || undefined,
        note: safe(form.note) || undefined,
        paidAt: safe(form.paidAt) || undefined,
      };

      const result = await apiFetch(
        `/owner/supplier-bills/${bill.id}/payments`,
        {
          method: "POST",
          body: payload,
        },
      );

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to record supplier payment",
      );
    }
  }

  return (
    <ModalShell
      title={`Add payment to bill #${bill.id}`}
      subtitle={`Remaining balance: ${money(bill.balance, bill.currency)}`}
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Amount ({normalizeCurrency(bill.currency)})
          </label>
          <FormInput
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Payment method
          </label>
          <FormSelect
            value={form.method}
            onChange={(e) => handleMethodChange(e.target.value)}
          >
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="MOMO">MoMo</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reference
          </label>
          <FormInput
            value={form.reference}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reference: e.target.value }))
            }
            placeholder={buildSupplierBillPaymentReference(bill, form.method)}
          />
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Auto-filled from this bill and payment method. Replace it with the
            real bank, MoMo, cash, or card reference if needed.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Paid at
          </label>
          <input
            type="datetime-local"
            value={form.paidAt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, paidAt: e.target.value }))
            }
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Payment note
          </label>
          <textarea
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Payment note"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>
        <AsyncButton
          idleText="Record payment"
          loadingText="Recording..."
          successText="Recorded"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function VoidBillModal({ open, bill, onClose, onSaved }) {
  if (!open || !bill) return null;

  return (
    <VoidBillModalInner
      key={`void-${bill.id}-${bill.updatedAt || ""}`}
      bill={bill}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function VoidBillModalInner({ bill, onClose, onSaved }) {
  const [errorText, setErrorText] = useState("");

  async function handleVoid() {
    setErrorText("");

    try {
      const result = await apiFetch(`/supplier-bills/${bill.id}`, {
        method: "DELETE",
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to void supplier bill",
      );
    }
  }

  return (
    <ModalShell
      title={`Void bill #${bill.id}`}
      subtitle="This should only be used for bills that should no longer count."
      onClose={onClose}
    >
      <AlertBox message={errorText} />
      <Surface className="bg-rose-50 dark:bg-rose-950/20">
        <div className="text-sm text-rose-800 dark:text-rose-200">
          Bill amount: <strong>{money(bill.totalAmount, bill.currency)}</strong>
          <br />
          Paid so far: <strong>{money(bill.paidAmount, bill.currency)}</strong>
        </div>
      </Surface>
      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>
        <AsyncButton
          idleText="Void bill"
          loadingText="Voiding..."
          successText="Voided"
          onClick={handleVoid}
          variant="secondary"
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerSupplierBillsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [summary, setSummary] = useState(null);
  const [bills, setBills] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [purchaseOrderOptions, setPurchaseOrderOptions] = useState([]);
  const [goodsReceiptOptions, setGoodsReceiptOptions] = useState([]);
  const [selectedBillId, setSelectedBillId] = useState("");
  const [billDetail, setBillDetail] = useState({
    bill: null,
    items: [],
    payments: [],
  });
  const [detailLoading, setDetailLoading] = useState(false);

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [creatingBill, setCreatingBill] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);
  const [voidBill, setVoidBill] = useState(null);

  const selectedBill = !selectedBillId
    ? null
    : bills.find((row) => String(row.id) === String(selectedBillId)) || null;

  const detailBill = billDetail?.bill || selectedBill || null;

  const linkedPurchaseOrder = useMemo(() => {
    if (!detailBill?.purchaseOrderId) return null;
    return (
      purchaseOrderOptions.find(
        (row) => String(row.id) === String(detailBill.purchaseOrderId),
      ) || null
    );
  }, [detailBill?.purchaseOrderId, purchaseOrderOptions]);

  const linkedGoodsReceipt = useMemo(() => {
    if (!detailBill?.goodsReceiptId) return null;
    return (
      goodsReceiptOptions.find(
        (row) => String(row.id) === String(detailBill.goodsReceiptId),
      ) || null
    );
  }, [detailBill?.goodsReceiptId, goodsReceiptOptions]);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadSupplierOptions() {
    try {
      const result = await apiFetch(`/owner/suppliers?limit=200`, {
        method: "GET",
      });
      setSupplierOptions(
        Array.isArray(result?.suppliers)
          ? result.suppliers.map(normalizeSupplier).filter(Boolean)
          : [],
      );
    } catch {
      setSupplierOptions([]);
    }
  }

  async function loadPurchaseOrderOptions() {
    try {
      const result = await apiFetch(`/purchase-orders?limit=200`, {
        method: "GET",
      });
      setPurchaseOrderOptions(
        normalizePurchaseOrdersResponse(result)
          .map(normalizePurchaseOrder)
          .filter(Boolean),
      );
    } catch {
      setPurchaseOrderOptions([]);
    }
  }

  async function loadGoodsReceiptOptions() {
    try {
      const result = await apiFetch(`/goods-receipts?limit=200`, {
        method: "GET",
      });
      setGoodsReceiptOptions(
        normalizeGoodsReceiptsResponse(result)
          .map(normalizeGoodsReceipt)
          .filter(Boolean),
      );
    } catch {
      setGoodsReceiptOptions([]);
    }
  }

  async function loadList() {
    setLoading(true);
    setErrorText("");

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (locationId) params.set("locationId", locationId);
    if (supplierId) params.set("supplierId", supplierId);
    if (status) params.set("status", status);

    const suffix = params.toString() ? `?${params.toString()}` : "";

    const [summaryRes, listRes] = await Promise.allSettled([
      apiFetch(`/supplier-bills/summary${suffix}`, { method: "GET" }),
      apiFetch(`/supplier-bills${suffix}`, { method: "GET" }),
    ]);

    let firstError = "";

    if (summaryRes.status === "fulfilled") {
      setSummary(summaryRes.value?.summary || null);
    } else {
      setSummary(null);
      firstError =
        summaryRes.reason?.data?.error ||
        summaryRes.reason?.message ||
        "Failed to load supplier bills summary";
    }

    if (listRes.status === "fulfilled") {
      const rows = normalizeBillsResponse(listRes.value)
        .map(normalizeBill)
        .filter(Boolean);
      setBills(rows);
      setSelectedBillId((prev) => {
        const next =
          prev && rows.some((x) => String(x.id) === String(prev))
            ? String(prev)
            : rows[0]?.id != null
              ? String(rows[0].id)
              : "";
        return next;
      });
    } else {
      setBills([]);
      setSelectedBillId("");
      firstError =
        firstError ||
        listRes.reason?.data?.error ||
        listRes.reason?.message ||
        "Failed to load supplier bills";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  async function loadDetail(id) {
    if (!id) {
      setBillDetail({ bill: null, items: [], payments: [] });
      return;
    }

    setDetailLoading(true);
    try {
      const result = await apiFetch(`/supplier-bills/${id}`, { method: "GET" });
      setBillDetail(normalizeBillDetail(result));
    } catch {
      setBillDetail({ bill: null, items: [], payments: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadSupplierOptions();
    loadPurchaseOrderOptions();
    loadGoodsReceiptOptions();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, locationId, supplierId, status]);

  useEffect(() => {
    loadList();
  }, [q, locationId, supplierId, status]);

  useEffect(() => {
    loadDetail(selectedBillId);
  }, [selectedBillId]);

  async function handleActionSaved(actionText, result) {
    setSuccessText(actionText);
    const nextBillId = result?.bill?.id ?? selectedBillId ?? "";

    setCreatingBill(false);
    setEditingBill(null);
    setPaymentBill(null);
    setVoidBill(null);

    await Promise.all([
      loadList(),
      loadPurchaseOrderOptions(),
      loadGoodsReceiptOptions(),
    ]);

    if (nextBillId) {
      setSelectedBillId(String(nextBillId));
      await loadDetail(String(nextBillId));
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  const visibleRows = bills.slice(0, visibleCount);

  const headerRight = (
    <div className="flex flex-wrap items-center gap-2">
      <AsyncButton
        variant="secondary"
        state={loading || detailLoading ? "loading" : "idle"}
        idleText="Reload"
        loadingText="Loading..."
        successText="Done"
        onClick={async () => {
          await Promise.all([
            loadSupplierOptions(),
            loadPurchaseOrderOptions(),
            loadGoodsReceiptOptions(),
            loadList(),
            loadDetail(selectedBillId),
          ]);
        }}
      />

      <AsyncButton
        idleText="Create supplier bill"
        loadingText="Opening..."
        successText="Ready"
        onClick={async () => setCreatingBill(true)}
      />
    </div>
  );

  return (
    <div className="grid gap-4">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      <SectionShell
        title="Supplier bills"
        hint="Supplier liabilities, due dates, installments, procurement linkage, and unpaid balances."
        right={headerRight}
      >
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-[24px] bg-stone-100 dark:bg-stone-800"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Supplier bills overview
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Supplier bills"
                    value={safeNumber(summary?.billsCount)}
                    sub="Recorded supplier invoices"
                  />
                  <MetricCard
                    label="Paid"
                    value={safeNumber(summary?.paidAmount).toLocaleString()}
                    sub="Settled amount"
                  />
                  <MetricCard
                    label="Partial"
                    value={safeNumber(summary?.partiallyPaidCount)}
                    sub="Installment bills"
                  />
                  <MetricCard
                    label="Overdue bills"
                    value={safeNumber(summary?.overdueBillsCount)}
                    sub="Past due date"
                    tone="danger"
                  />
                  <MetricCard
                    label="Outstanding"
                    value={safeNumber(summary?.balance).toLocaleString()}
                    sub="Open liability total"
                  />
                  <MetricCard
                    label="Overdue amount"
                    value={safeNumber(summary?.overdueAmount).toLocaleString()}
                    sub="Late unpaid amount"
                    tone="danger"
                  />
                </div>
              </Surface>

              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Bill filters
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <FormInput
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search supplier, bill number, note, PO, GR"
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
                  <FormSelect
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">All suppliers</option>
                    {supplierOptions.map((row) => (
                      <option key={row.id} value={row.id}>
                        {safe(row.name)}
                      </option>
                    ))}
                  </FormSelect>
                  <FormSelect
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="OPEN">Open</option>
                    <option value="PARTIALLY_PAID">Partially paid</option>
                    <option value="PAID">Paid</option>
                    <option value="VOID">Void</option>
                  </FormSelect>
                </div>

                <div className="mt-4 rounded-[22px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                    Current bill
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <FormSelect
                      value={selectedBillId}
                      onChange={(e) => setSelectedBillId(e.target.value)}
                    >
                      <option value="">Select bill</option>
                      {bills.map((row) => (
                        <option key={row.id} value={String(row.id)}>
                          {`#${safe(row.billNo || row.id)} — ${safe(row.supplierName) || "-"}`}
                        </option>
                      ))}
                    </FormSelect>

                    <div className="rounded-[18px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
                      Balance:{" "}
                      <b>
                        {detailLoading
                          ? "..."
                          : detailBill
                            ? money(detailBill.balance, detailBill.currency)
                            : "—"}
                      </b>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                    Status: <b>{detailBill ? safe(detailBill.status) : "—"}</b>{" "}
                    • Supplier:{" "}
                    <b>{detailBill ? safe(detailBill.supplierName) : "—"}</b>
                  </div>
                </div>
              </Surface>
            </div>

            <div className="mt-4 grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Supplier bills directory
                </div>
                <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Select a bill to inspect details, linked procurement records,
                  items, and installment payments.
                </div>

                <div className="mt-4">
                  {bills.length === 0 ? (
                    <EmptyState text="No supplier bills match the current owner filters." />
                  ) : (
                    <div className="grid gap-3">
                      {visibleRows.map((row) => (
                        <BillCard
                          key={row.id}
                          row={row}
                          active={String(row.id) === String(selectedBillId)}
                          onSelect={(picked) =>
                            setSelectedBillId(String(picked?.id || ""))
                          }
                          locations={locationOptions}
                        />
                      ))}
                    </div>
                  )}

                  {visibleCount < bills.length ? (
                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCount((prev) => prev + PAGE_SIZE)
                        }
                        className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                      >
                        Load 20 more
                      </button>
                    </div>
                  ) : null}
                </div>
              </Surface>

              {detailBill ? (
                <Surface>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                        Selected supplier bill
                      </div>
                      <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        Focused owner view of supplier liability, procurement
                        linkage, and bill activity.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AsyncButton
                        idleText="Edit supplier bill"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => setEditingBill(detailBill)}
                        variant="secondary"
                      />

                      {String(detailBill?.status || "").toUpperCase() !==
                        "PAID" &&
                      String(detailBill?.status || "").toUpperCase() !==
                        "VOID" ? (
                        <AsyncButton
                          idleText="Add payment"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () => setPaymentBill(detailBill)}
                          variant="secondary"
                        />
                      ) : null}

                      {Number(detailBill?.paidAmount || 0) <= 0 &&
                      String(detailBill?.status || "").toUpperCase() !==
                        "VOID" ? (
                        <AsyncButton
                          idleText="Void bill"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () => setVoidBill(detailBill)}
                          variant="secondary"
                        />
                      ) : null}
                    </div>
                  </div>

                  {detailLoading ? (
                    <div className="mt-4 grid gap-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-24 animate-pulse rounded-[22px] bg-stone-100 dark:bg-stone-800"
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Pill tone={statusTone(detailBill?.status)}>
                          {safe(detailBill?.status) || "OPEN"}
                        </Pill>
                        <Pill tone="neutral">
                          {normalizeCurrency(detailBill?.currency)}
                        </Pill>
                        <Pill
                          tone={detailBill?.isOverdue ? "danger" : "neutral"}
                        >
                          {detailBill?.isOverdue
                            ? `${safeNumber(detailBill?.daysOverdue)}D OVERDUE`
                            : "ON TIME"}
                        </Pill>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <MetricCard
                          label="Supplier"
                          value={safe(detailBill?.supplierName) || "-"}
                          sub={`Bill #${safe(detailBill?.billNo) || safe(detailBill?.id) || "-"}`}
                        />
                        <MetricCard
                          label="Branch"
                          value={displayBranch(detailBill, locationOptions)}
                          sub={displayBranchSub(detailBill, locationOptions)}
                        />
                        <MetricCard
                          label={`Balance (${normalizeCurrency(detailBill?.currency)})`}
                          value={money(
                            detailBill?.balance,
                            detailBill?.currency,
                          )}
                          sub="Outstanding amount"
                          tone="danger"
                        />
                        <MetricCard
                          label="Created by"
                          value={displayCreatedBy(detailBill)}
                          sub={safe(detailBill?.status) || "-"}
                        />
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Procurement linkage
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <InfoTile
                            label="Purchase order link"
                            value={
                              linkedPurchaseOrder
                                ? buildPurchaseOrderOptionLabel(
                                    linkedPurchaseOrder,
                                  )
                                : displayPurchaseOrderRef(detailBill)
                            }
                          />
                          <InfoTile
                            label="Goods receipt link"
                            value={
                              linkedGoodsReceipt
                                ? buildGoodsReceiptOptionLabel(
                                    linkedGoodsReceipt,
                                  )
                                : displayGoodsReceiptRef(detailBill)
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Bill profile
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <InfoTile
                            label="Issued date"
                            value={safeDate(detailBill?.issuedDate)}
                          />
                          <InfoTile
                            label="Due date"
                            value={safeDate(detailBill?.dueDate)}
                          />
                          <InfoTile
                            label="Created by"
                            value={displayCreatedBy(detailBill)}
                          />
                          <InfoTile
                            label="Last updated"
                            value={safeDate(detailBill?.updatedAt)}
                          />
                        </div>

                        <InfoTile
                          label="Bill note"
                          value={safe(detailBill?.note) || "No note recorded"}
                        />
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Financial view
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <InfoTile
                            label={`Total (${normalizeCurrency(detailBill?.currency)})`}
                            value={money(
                              detailBill?.totalAmount,
                              detailBill?.currency,
                            )}
                          />
                          <InfoTile
                            label={`Paid (${normalizeCurrency(detailBill?.currency)})`}
                            value={money(
                              detailBill?.paidAmount,
                              detailBill?.currency,
                            )}
                          />
                          <InfoTile
                            label={`Remaining (${normalizeCurrency(detailBill?.currency)})`}
                            value={money(
                              detailBill?.balance,
                              detailBill?.currency,
                            )}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <Surface className="bg-stone-50 dark:bg-stone-950">
                          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Bill items
                          </div>

                          {(billDetail?.items || []).length === 0 ? (
                            <div className="mt-4">
                              <EmptyState text="No bill items found." />
                            </div>
                          ) : (
                            <div className="mt-4 space-y-3">
                              {(billDetail?.items || []).map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-[20px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                        {safe(item?.description) || "-"}
                                      </p>
                                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                        Product ID:{" "}
                                        {safe(item?.productId) || "-"}
                                      </p>
                                    </div>
                                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                      {money(
                                        item?.lineTotal,
                                        detailBill?.currency,
                                      )}
                                    </span>
                                  </div>

                                  <div className="mt-3 grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                        Qty
                                      </p>
                                      <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                        {safeNumber(item?.qty)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                        Unit cost (
                                        {normalizeCurrency(
                                          detailBill?.currency,
                                        )}
                                        )
                                      </p>
                                      <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                        {money(
                                          item?.unitCost,
                                          detailBill?.currency,
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Surface>

                        <Surface className="bg-stone-50 dark:bg-stone-950">
                          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Bill payments
                          </div>

                          {(billDetail?.payments || []).length === 0 ? (
                            <div className="mt-4">
                              <EmptyState text="No payment installments recorded yet." />
                            </div>
                          ) : (
                            <div className="mt-4 space-y-3">
                              {(billDetail?.payments || []).map((payment) => (
                                <div
                                  key={payment.id}
                                  className="rounded-[20px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                        {safe(payment?.method) || "-"}
                                      </p>
                                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                        {safeDate(payment?.paidAt)}
                                      </p>
                                    </div>
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                      {money(
                                        payment?.amount,
                                        detailBill?.currency,
                                      )}
                                    </span>
                                  </div>

                                  <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-stone-500 dark:text-stone-400">
                                        Reference
                                      </span>
                                      <span className="text-right break-all font-semibold text-stone-900 dark:text-stone-100">
                                        {safe(payment?.reference) || "-"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-3 rounded-[16px] border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                                    {safe(payment?.note) || "No note recorded."}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Surface>
                      </div>
                    </>
                  )}
                </Surface>
              ) : (
                <Surface>
                  <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                    Selected supplier bill
                  </div>
                  <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    This section appears after a supplier bill is selected.
                  </div>
                  <div className="mt-4">
                    <EmptyState text="Select a supplier bill above to inspect details and payments." />
                  </div>
                </Surface>
              )}
            </div>
          </>
        )}
      </SectionShell>

      <CreateBillModal
        open={creatingBill}
        suppliers={supplierOptions}
        locations={locationOptions}
        purchaseOrders={purchaseOrderOptions}
        goodsReceipts={goodsReceiptOptions}
        onClose={() => setCreatingBill(false)}
        onSaved={(result) => handleActionSaved("Supplier bill created", result)}
      />

      <EditBillModal
        open={!!editingBill}
        bill={editingBill}
        suppliers={supplierOptions}
        locations={locationOptions}
        purchaseOrders={purchaseOrderOptions}
        goodsReceipts={goodsReceiptOptions}
        onClose={() => setEditingBill(null)}
        onSaved={(result) => handleActionSaved("Supplier bill updated", result)}
      />

      <AddPaymentModal
        open={!!paymentBill}
        bill={paymentBill}
        onClose={() => setPaymentBill(null)}
        onSaved={(result) =>
          handleActionSaved("Supplier bill payment recorded", result)
        }
      />

      <VoidBillModal
        open={!!voidBill}
        bill={voidBill}
        onClose={() => setVoidBill(null)}
        onSaved={(result) => handleActionSaved("Supplier bill voided", result)}
      />
    </div>
  );
}
