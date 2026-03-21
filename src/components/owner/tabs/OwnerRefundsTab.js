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

const PAGE_SIZE = 20;
const REFUND_METHODS = ["CASH", "MOMO", "CARD", "BANK", "OTHER"];

function money(v, currency = "RWF") {
  return `${String(currency || "RWF").toUpperCase()} ${safeNumber(
    v,
  ).toLocaleString()}`;
}

function createRefundFormState() {
  return {
    locationId: "",
    saleId: "",
    reason: "",
    method: "CASH",
    reference: "",
    useItemLines: false,
    items: [{ saleItemId: "", qty: "" }],
  };
}

function normalizeRefundsResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.refunds)) return result.refunds;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeRefund(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    saleId: row.saleId ?? row.sale_id ?? null,
    saleStatus: row.saleStatus ?? row.sale_status ?? "",
    saleTotalAmount: Number(row.saleTotalAmount ?? row.sale_total_amount ?? 0),
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    method: String(row.method || "CASH").toUpperCase(),
    reference: row.reference ?? "",
    paymentId: row.paymentId ?? row.payment_id ?? null,
    cashSessionId: row.cashSessionId ?? row.cash_session_id ?? null,
    reason: row.reason ?? "",
    createdByUserId: row.createdByUserId ?? row.created_by_user_id ?? null,
    createdByName: row.createdByName ?? row.created_by_name ?? "",
    createdByEmail: row.createdByEmail ?? row.created_by_email ?? "",
    createdAt: row.createdAt ?? row.created_at ?? null,
    itemsCount: Number(row.itemsCount ?? row.items_count ?? 0),
  };
}

function normalizeRefundItem(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    refundId: row.refundId ?? row.refund_id ?? null,
    saleItemId: row.saleItemId ?? row.sale_item_id ?? null,
    productId: row.productId ?? row.product_id ?? null,
    productName: row.productName ?? row.product_name ?? "",
    sku: row.sku ?? "",
    saleId: row.saleId ?? row.sale_id ?? null,
    saleItemQty: Number(row.saleItemQty ?? row.sale_item_qty ?? 0),
    qty: Number(row.qty ?? 0),
    unitPrice: Number(row.unitPrice ?? row.unit_price ?? 0),
    lineTotal: Number(row.lineTotal ?? row.line_total ?? 0),
    amount: Number(row.amount ?? 0),
  };
}

function normalizeRefundDetail(result) {
  return {
    refund: result?.refund ? normalizeRefund(result.refund) : null,
    items: Array.isArray(result?.items)
      ? result.items.map(normalizeRefundItem).filter(Boolean)
      : [],
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

function displayCreatedBy(row) {
  if (safe(row?.createdByName)) {
    return safe(row.createdByName);
  }

  if (safe(row?.createdByEmail)) {
    return safe(row.createdByEmail);
  }

  if (row?.createdByUserId != null) {
    return `User #${safeNumber(row.createdByUserId)}`;
  }

  return "-";
}

function methodTone(method) {
  const m = String(method || "").toUpperCase();

  if (m === "CASH") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (m === "MOMO") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  if (m === "CARD") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }

  if (m === "BANK") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function saleStatusTone(status) {
  const s = String(status || "").toUpperCase();

  if (s === "REFUNDED") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (s === "PARTIALLY_REFUNDED") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (s === "COMPLETED") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function RefundCard({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "group w-full overflow-hidden rounded-[28px] border text-left transition-all duration-200 " +
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
                Refund #{safe(row?.id) || "-"}
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
                    : methodTone(row?.method))
                }
              >
                {safe(row?.method) || "CASH"}
              </span>

              <span
                className={
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                  (active
                    ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                    : saleStatusTone(row?.saleStatus))
                }
              >
                {safe(row?.saleStatus) || "SALE"}
              </span>
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
                <span className="font-medium">Branch:</span>{" "}
                {displayBranch(row)}
              </p>
              <p className="truncate">
                <span className="font-medium">Sale:</span> #
                {safe(row?.saleId) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Items:</span>{" "}
                {safeNumber(row?.itemsCount)}
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
              Refund amount
            </p>
            <p className="mt-2 text-xl font-black sm:text-2xl">
              {money(row?.totalAmount, "RWF")}
            </p>
            <p
              className={
                "mt-1 text-xs " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              Refunded value
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
              Created by
            </p>
            <p className="mt-2 text-lg font-bold">{displayCreatedBy(row)}</p>
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
              Payment ID
            </p>
            <p className="mt-2 text-lg font-bold">
              {row?.paymentId != null ? `#${safeNumber(row.paymentId)}` : "-"}
            </p>
          </div>

          <div
            className={
              "rounded-2xl border p-4 " +
              (active
                ? "border-amber-300/20 bg-amber-400/10 text-white dark:border-amber-900/20 dark:bg-amber-900/10 dark:text-stone-950"
                : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20")
            }
          >
            <p
              className={
                "text-[11px] uppercase tracking-[0.14em] " +
                (active
                  ? "text-amber-100 dark:text-amber-800"
                  : "text-amber-700 dark:text-amber-300")
              }
            >
              Cash session
            </p>
            <p className="mt-2 text-lg font-bold">
              {row?.cashSessionId != null
                ? `#${safeNumber(row.cashSessionId)}`
                : "Not cash"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
          <p
            className={
              "text-[11px] uppercase tracking-[0.14em] " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            Reason
          </p>
          <p
            className={
              "mt-2 text-sm " +
              (active
                ? "text-white dark:text-stone-950"
                : "text-stone-700 dark:text-stone-300")
            }
          >
            {safe(row?.reason) || "No reason recorded"}
          </p>
        </div>
      </div>
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-stone-900 sm:p-6">
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

function RefundItemRow({ item, index, onChange, onRemove, canRemove }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950 md:grid-cols-[1fr_1fr_auto]">
      <div>
        <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
          Sale item ID
        </label>
        <FormInput
          type="number"
          value={item.saleItemId}
          onChange={(e) => onChange(index, "saleItemId", e.target.value)}
          placeholder="Sale item ID"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
          Qty
        </label>
        <FormInput
          type="number"
          value={item.qty}
          onChange={(e) => onChange(index, "qty", e.target.value)}
          placeholder="Qty"
        />
      </div>

      <div className="flex items-end">
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function CreateRefundModal({ locations, onClose, onSaved }) {
  const [form, setForm] = useState(createRefundFormState);
  const [errorText, setErrorText] = useState("");

  function updateItem(index, key, value) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((row, i) =>
        i === index ? { ...row, [key]: value } : row,
      ),
    }));
  }

  function addItemRow() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { saleItemId: "", qty: "" }],
    }));
  }

  function removeItemRow(index) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setErrorText("");

    if (!form.locationId) {
      setErrorText("Branch is required");
      return;
    }

    if (!form.saleId || Number(form.saleId) <= 0) {
      setErrorText("Valid sale ID is required");
      return;
    }

    const payload = {
      locationId: form.locationId ? Number(form.locationId) : undefined,
      saleId: form.saleId ? Number(form.saleId) : undefined,
      reason: form.reason.trim() || undefined,
      method: form.method || undefined,
      reference: form.reference.trim() || undefined,
    };

    if (form.useItemLines) {
      const cleanItems = form.items
        .map((row) => ({
          saleItemId: Number(row.saleItemId),
          qty: Number(row.qty),
        }))
        .filter(
          (row) =>
            Number.isFinite(row.saleItemId) &&
            row.saleItemId > 0 &&
            Number.isFinite(row.qty) &&
            row.qty > 0,
        );

      if (cleanItems.length === 0) {
        setErrorText("Add at least one valid refund item row");
        return;
      }

      payload.items = cleanItems;
    }

    try {
      const result = await apiFetch("/refunds", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to create refund");
    }
  }

  return (
    <ModalShell
      title="Create refund"
      subtitle="Owner can create refunds for any active branch."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Branch
          </label>
          <FormSelect
            value={form.locationId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, locationId: e.target.value }))
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

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Sale ID
          </label>
          <FormInput
            type="number"
            value={form.saleId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, saleId: e.target.value }))
            }
            placeholder="Sale ID"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Refund method
          </label>
          <FormSelect
            value={form.method}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, method: e.target.value }))
            }
          >
            {REFUND_METHODS.map((methodValue) => (
              <option key={methodValue} value={methodValue}>
                {methodValue}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Reference
          </label>
          <FormInput
            value={form.reference}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reference: e.target.value }))
            }
            placeholder="Optional reference"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Reason
          </label>
          <textarea
            value={form.reason}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reason: e.target.value }))
            }
            rows={4}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Refund reason"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex h-11 items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200">
            <input
              type="checkbox"
              checked={form.useItemLines}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  useItemLines: e.target.checked,
                }))
              }
            />
            Partial refund by item lines
          </label>
        </div>
      </div>

      {form.useItemLines ? (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Refund items
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Provide sale item ids from the selected sale.
              </p>
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Add row
            </button>
          </div>

          <div className="space-y-3">
            {form.items.map((item, index) => (
              <RefundItemRow
                key={index}
                item={item}
                index={index}
                onChange={updateItem}
                onRemove={removeItemRow}
                canRemove={form.items.length > 1}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText="Create refund"
          loadingText="Creating..."
          successText="Created"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerRefundsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [refunds, setRefunds] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [selectedRefundId, setSelectedRefundId] = useState(null);
  const [refundDetail, setRefundDetail] = useState({
    refund: null,
    items: [],
  });

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [method, setMethod] = useState("");
  const [saleId, setSaleId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [creatingRefund, setCreatingRefund] = useState(false);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const selectedRefund =
    selectedRefundId == null
      ? null
      : refunds.find((row) => String(row.id) === String(selectedRefundId)) ||
        (refundDetail?.refund &&
        String(refundDetail.refund.id) === String(selectedRefundId)
          ? refundDetail.refund
          : null);

  const overview = useMemo(() => {
    const rows = Array.isArray(refunds) ? refunds : [];

    let totalCount = rows.length;
    let totalAmount = 0;
    let cashCount = 0;
    let momoCount = 0;
    let cardBankCount = 0;
    let totalItems = 0;

    for (const row of rows) {
      totalAmount += Number(row?.totalAmount || 0);
      totalItems += Number(row?.itemsCount || 0);

      const m = String(row?.method || "").toUpperCase();
      if (m === "CASH") cashCount += 1;
      else if (m === "MOMO") momoCount += 1;
      else if (m === "CARD" || m === "BANK") cardBankCount += 1;
    }

    return {
      totalCount,
      totalAmount,
      cashCount,
      momoCount,
      cardBankCount,
      totalItems,
    };
  }, [refunds]);

  function buildParams(extra = {}) {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (locationId) params.set("locationId", locationId);
    if (method) params.set("method", method);
    if (saleId) params.set("saleId", saleId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    params.set("limit", String(extra.limit || PAGE_SIZE));

    if (extra.cursor) {
      params.set("cursor", String(extra.cursor));
    }

    return params;
  }

  async function loadFirstPage() {
    setLoading(true);
    setErrorText("");

    try {
      const params = buildParams({ limit: PAGE_SIZE });
      const result = await apiFetch(`/refunds?${params.toString()}`, {
        method: "GET",
      });

      const rows = normalizeRefundsResponse(result)
        .map(normalizeRefund)
        .filter(Boolean);

      setRefunds(rows);
      setNextCursor(result?.nextCursor ?? null);
      setSelectedRefundId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev))
          ? prev
          : (rows[0]?.id ?? null),
      );
    } catch (e) {
      setRefunds([]);
      setNextCursor(null);
      setSelectedRefundId(null);
      setErrorText(e?.data?.error || e?.message || "Failed to load refunds");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    setErrorText("");

    try {
      const params = buildParams({ limit: PAGE_SIZE, cursor: nextCursor });
      const result = await apiFetch(`/refunds?${params.toString()}`, {
        method: "GET",
      });

      const rows = normalizeRefundsResponse(result)
        .map(normalizeRefund)
        .filter(Boolean);

      setRefunds((prev) => [...prev, ...rows]);
      setNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to load more refunds",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setRefundDetail({ refund: null, items: [] });
      return;
    }

    setDetailLoading(true);

    try {
      const result = await apiFetch(`/refunds/${id}`, {
        method: "GET",
      });

      const detail = normalizeRefundDetail(result);

      setRefundDetail({
        refund: detail.refund,
        items: detail.items,
      });
    } catch {
      setRefundDetail({ refund: null, items: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  function clearFilters() {
    setQ("");
    setLocationId("");
    setMethod("");
    setSaleId("");
    setFrom("");
    setTo("");
  }

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, locationId, method, saleId, from, to]);

  useEffect(() => {
    loadDetail(selectedRefundId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRefundId]);

  async function handleSaved(result) {
    setCreatingRefund(false);
    setSuccessText("Refund created");

    await loadFirstPage();

    const nextId = result?.refund?.id ?? null;
    if (nextId) {
      setSelectedRefundId(nextId);
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Refunds"
          subtitle="Loading owner-wide refund visibility."
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
            title="Refund overview"
            subtitle="Owner-wide, cross-branch refund visibility with real backend data."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard
                label="Refunds"
                value={safeNumber(overview?.totalCount)}
                sub="Loaded refunds"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Refund total"
                value={money(overview?.totalAmount, "RWF")}
                sub="Loaded refunded amount"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Items"
                value={safeNumber(overview?.totalItems)}
                sub="Refunded line count"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Cash"
                value={safeNumber(overview?.cashCount)}
                sub="Cash refunds"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="MoMo"
                value={safeNumber(overview?.momoCount)}
                sub="Mobile money refunds"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Card / Bank"
                value={safeNumber(overview?.cardBankCount)}
                sub="Non-cash refunds"
                valueClassName="text-[17px] leading-tight"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Refund filters"
            subtitle="Search by refund ID, sale ID, branch, creator, reason, reference, method, or date."
            right={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  Clear filters
                </button>

                <AsyncButton
                  idleText="Create refund"
                  loadingText="Opening..."
                  successText="Ready"
                  onClick={async () => setCreatingRefund(true)}
                />
              </div>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search refund ID, sale ID, branch, creator, reason, reference"
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
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="">All methods</option>
                {REFUND_METHODS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                type="number"
                value={saleId}
                onChange={(e) => setSaleId(e.target.value)}
                placeholder="Sale ID"
              />

              <FormInput
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />

              <FormInput
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </SectionCard>

          <div className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
            <SectionCard
              title="Refund directory"
              subtitle="Cross-branch refund timeline. Select a refund to inspect full detail and item lines."
            >
              {refunds.length === 0 ? (
                <EmptyState text="No refunds match the current filters." />
              ) : (
                <div className="space-y-4">
                  {refunds.map((row) => (
                    <RefundCard
                      key={row.id}
                      row={row}
                      active={String(row.id) === String(selectedRefundId)}
                      onSelect={(picked) => setSelectedRefundId(picked?.id)}
                    />
                  ))}
                </div>
              )}

              {nextCursor ? (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              ) : null}
            </SectionCard>

            {selectedRefund ? (
              <SectionCard
                title="Selected refund detail"
                subtitle="Focused owner view of refund header, branch context, and refunded item lines."
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
                        label="Refund"
                        value={`#${safeNumber(selectedRefund?.id)}`}
                        sub={`Sale #${safe(selectedRefund?.saleId) || "-"}`}
                        valueClassName="text-[17px] leading-tight"
                      />

                      <StatCard
                        label="Branch"
                        value={displayBranch(selectedRefund)}
                        sub={safe(selectedRefund?.locationCode) || "No code"}
                        valueClassName="text-[17px] leading-tight"
                      />

                      <StatCard
                        label="Amount"
                        value={money(selectedRefund?.totalAmount, "RWF")}
                        sub={safe(selectedRefund?.method) || "CASH"}
                        valueClassName="text-[17px] leading-tight"
                      />

                      <StatCard
                        label="Created by"
                        value={displayCreatedBy(selectedRefund)}
                        sub={safeDate(selectedRefund?.createdAt)}
                        valueClassName="text-[17px] leading-tight"
                      />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Refund profile
                        </p>

                        <div className="mt-4 grid gap-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Method
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {safe(selectedRefund?.method) || "-"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Sale status
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {safe(selectedRefund?.saleStatus) || "-"}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Payment ID
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {selectedRefund?.paymentId != null
                                  ? `#${safeNumber(selectedRefund.paymentId)}`
                                  : "-"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Cash session
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {selectedRefund?.cashSessionId != null
                                  ? `#${safeNumber(selectedRefund.cashSessionId)}`
                                  : "Not cash"}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Reference
                            </p>
                            <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                              {safe(selectedRefund?.reference) ||
                                "No reference"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Reason
                            </p>
                            <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                              {safe(selectedRefund?.reason) ||
                                "No reason recorded"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Financial view
                        </p>

                        <div className="mt-4 grid gap-3">
                          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                              Refund total
                            </p>
                            <p className="mt-2 text-2xl font-black text-stone-950 dark:text-stone-50">
                              {money(selectedRefund?.totalAmount, "RWF")}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                              Original sale total
                            </p>
                            <p className="mt-2 text-2xl font-black text-stone-950 dark:text-stone-50">
                              {money(selectedRefund?.saleTotalAmount, "RWF")}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                            <p className="text-xs uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                              Refunded items
                            </p>
                            <p className="mt-2 text-2xl font-black text-amber-900 dark:text-amber-100">
                              {safeNumber(refundDetail?.items?.length || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                        Refunded item lines
                      </p>

                      {(refundDetail?.items || []).length === 0 ? (
                        <div className="mt-4">
                          <EmptyState text="No refund items found." />
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {(refundDetail?.items || []).map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                                    {safe(item?.productName) ||
                                      (item?.productId != null
                                        ? `Product #${safe(item.productId)}`
                                        : "Product")}
                                  </p>
                                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                    SKU: {safe(item?.sku) || "-"} · Sale item #
                                    {safe(item?.saleItemId) || "-"}
                                  </p>
                                </div>

                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                  {money(item?.amount, "RWF")}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Refunded qty
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                    {safeNumber(item?.qty)}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Sold qty
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                    {safeNumber(item?.saleItemQty)}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Unit price
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                    {money(item?.unitPrice, "RWF")}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Original line
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                    {money(item?.lineTotal, "RWF")}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Refund amount
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                    {money(item?.amount, "RWF")}
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
                title="Selected refund detail"
                subtitle="This section appears after a refund is selected."
              >
                <EmptyState text="Select a refund card above to inspect full detail and item lines." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      {creatingRefund ? (
        <CreateRefundModal
          locations={locationOptions}
          onClose={() => setCreatingRefund(false)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
