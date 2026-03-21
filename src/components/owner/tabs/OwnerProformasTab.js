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

function money(v, currency = "RWF") {
  return `${String(currency || "RWF").toUpperCase()} ${safeNumber(v).toLocaleString()}`;
}

function getApiBase() {
  return String(process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
}

function openPrintPath(path) {
  const base = getApiBase();
  if (!base) return;
  window.open(`${base}${path}`, "_blank", "noopener,noreferrer");
}

function normalizeRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.proformas)) return result.proformas;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeProforma(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    customerId: row.customerId ?? row.customer_id ?? null,
    customerName: row.customerName ?? row.customer_name ?? "",
    customerPhone: row.customerPhone ?? row.customer_phone ?? "",
    customerTin: row.customerTin ?? row.customer_tin ?? "",
    customerAddress: row.customerAddress ?? row.customer_address ?? "",
    createdByUserId: row.createdByUserId ?? row.created_by_user_id ?? null,
    createdByName: row.createdByName ?? row.created_by_name ?? "",
    createdByEmail: row.createdByEmail ?? row.created_by_email ?? "",
    proformaNo: row.proformaNo ?? row.proforma_no ?? "",
    status: row.status ?? "DRAFT",
    currency: row.currency ?? "RWF",
    subtotal: Number(row.subtotal ?? 0),
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    validUntil: row.validUntil ?? row.valid_until ?? null,
    note: row.note ?? "",
    terms: row.terms ?? "",
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function normalizeDetail(result) {
  return {
    proforma: result?.proforma ? normalizeProforma(result.proforma) : null,
    items: Array.isArray(result?.items) ? result.items : [],
  };
}

function displayBranch(row) {
  if (safe(row?.locationName)) {
    return safe(row?.locationCode)
      ? `${safe(row.locationName)} (${safe(row.locationCode)})`
      : safe(row.locationName);
  }

  if (row?.locationId != null) return `Branch #${row.locationId}`;
  return "-";
}

function createdByLabel(row) {
  if (safe(row?.createdByName)) return safe(row.createdByName);
  if (safe(row?.createdByEmail)) return safe(row.createdByEmail);
  if (row?.createdByUserId != null)
    return `User #${safeNumber(row.createdByUserId)}`;
  return "-";
}

function statusTone(status) {
  const s = String(status || "").toUpperCase();

  if (s === "APPROVED" || s === "SENT") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (s === "CANCELLED" || s === "VOID") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-stone-900 sm:p-6">
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

function ProformaItemEditor({ row, index, onChange, onRemove, canRemove }) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Item name
          </label>
          <FormInput
            value={row.productName}
            onChange={(e) => onChange(index, "productName", e.target.value)}
            placeholder="Item name"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            SKU
          </label>
          <FormInput
            value={row.productSku}
            onChange={(e) => onChange(index, "productSku", e.target.value)}
            placeholder="SKU"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Unit
          </label>
          <FormInput
            value={row.stockUnit}
            onChange={(e) => onChange(index, "stockUnit", e.target.value)}
            placeholder="PIECE"
          />
        </div>

        <div className="xl:col-span-1">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Qty
          </label>
          <FormInput
            type="number"
            value={row.qty}
            onChange={(e) => onChange(index, "qty", e.target.value)}
            placeholder="1"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Unit price
          </label>
          <FormInput
            type="number"
            value={row.unitPrice}
            onChange={(e) => onChange(index, "unitPrice", e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="xl:col-span-1 flex items-end">
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateProformaModal({ open, locations, onClose, onSaved }) {
  const [form, setForm] = useState({
    locationId: "",
    proformaNo: "",
    customerName: "",
    customerPhone: "",
    customerTin: "",
    customerAddress: "",
    currency: "RWF",
    validUntil: "",
    note: "",
    terms: "",
    items: [
      {
        productName: "",
        productSku: "",
        stockUnit: "PIECE",
        qty: "",
        unitPrice: "",
      },
    ],
  });
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      locationId: "",
      proformaNo: "",
      customerName: "",
      customerPhone: "",
      customerTin: "",
      customerAddress: "",
      currency: "RWF",
      validUntil: "",
      note: "",
      terms: "",
      items: [
        {
          productName: "",
          productSku: "",
          stockUnit: "PIECE",
          qty: "",
          unitPrice: "",
        },
      ],
    });
    setErrorText("");
  }, [open]);

  if (!open) return null;

  function updateItem(index, key, value) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((row, i) =>
        i === index ? { ...row, [key]: value } : row,
      ),
    }));
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productName: "",
          productSku: "",
          stockUnit: "PIECE",
          qty: "",
          unitPrice: "",
        },
      ],
    }));
  }

  function removeItem(index) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        locationId: Number(form.locationId),
        proformaNo: form.proformaNo.trim() || undefined,
        customerName: form.customerName.trim() || undefined,
        customerPhone: form.customerPhone.trim() || undefined,
        customerTin: form.customerTin.trim() || undefined,
        customerAddress: form.customerAddress.trim() || undefined,
        currency: form.currency.trim() || "RWF",
        validUntil: form.validUntil || undefined,
        note: form.note.trim() || undefined,
        terms: form.terms.trim() || undefined,
        items: form.items
          .map((row) => ({
            productName: row.productName.trim(),
            productSku: row.productSku.trim() || undefined,
            stockUnit: row.stockUnit.trim() || "PIECE",
            qty: Number(row.qty),
            unitPrice: Number(row.unitPrice),
          }))
          .filter(
            (row) =>
              row.productName &&
              Number.isFinite(row.qty) &&
              row.qty > 0 &&
              Number.isFinite(row.unitPrice) &&
              row.unitPrice >= 0,
          ),
      };

      if (!payload.locationId) {
        throw new Error("Choose a branch");
      }

      if (!payload.items.length) {
        throw new Error("Add at least one valid line item");
      }

      const result = await apiFetch("/proformas", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to create proforma");
    }
  }

  return (
    <ModalShell
      title="Create proforma"
      subtitle="Create a quotation / pre-invoice document that is printable and cross-branch ready."
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
            Proforma number
          </label>
          <FormInput
            value={form.proformaNo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, proformaNo: e.target.value }))
            }
            placeholder="Optional custom number"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Customer name
          </label>
          <FormInput
            value={form.customerName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customerName: e.target.value }))
            }
            placeholder="Customer name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Customer phone
          </label>
          <FormInput
            value={form.customerPhone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customerPhone: e.target.value }))
            }
            placeholder="Phone"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            TIN
          </label>
          <FormInput
            value={form.customerTin}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customerTin: e.target.value }))
            }
            placeholder="TIN"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Valid until
          </label>
          <FormInput
            type="date"
            value={form.validUntil}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, validUntil: e.target.value }))
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Customer address
          </label>
          <textarea
            value={form.customerAddress}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customerAddress: e.target.value }))
            }
            rows={3}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Optional address"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Proforma items
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Add printable commercial lines exactly as you want them to appear.
            </p>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Add line
          </button>
        </div>

        <div className="space-y-3">
          {form.items.map((row, index) => (
            <ProformaItemEditor
              key={index}
              row={row}
              index={index}
              onChange={updateItem}
              onRemove={removeItem}
              canRemove={form.items.length > 1}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Note
          </label>
          <textarea
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={4}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Optional note"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Terms
          </label>
          <textarea
            value={form.terms}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, terms: e.target.value }))
            }
            rows={4}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Optional terms"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText="Create proforma"
          loadingText="Creating..."
          successText="Created"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerProformasTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [rows, setRows] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState({ proforma: null, items: [] });

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [creating, setCreating] = useState(false);

  const selectedProforma =
    detail?.proforma ||
    (selectedId == null
      ? null
      : rows.find((row) => String(row.id) === String(selectedId)) || null);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const overview = useMemo(() => {
    const items = Array.isArray(rows) ? rows : [];

    let count = items.length;
    let totalAmount = 0;
    let withCustomer = 0;

    for (const row of items) {
      totalAmount += Number(row?.totalAmount || 0);
      if (safe(row?.customerName)) withCustomer += 1;
    }

    return {
      count,
      totalAmount,
      withCustomer,
    };
  }, [rows]);

  function buildParams(extra = {}) {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (locationId) params.set("locationId", locationId);
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
      const result = await apiFetch(`/proformas?${params.toString()}`, {
        method: "GET",
      });

      const nextRows = normalizeRows(result)
        .map(normalizeProforma)
        .filter(Boolean);

      setRows(nextRows);
      setNextCursor(result?.nextCursor ?? null);
      setSelectedId((prev) =>
        prev && nextRows.some((x) => String(x.id) === String(prev))
          ? prev
          : (nextRows[0]?.id ?? null),
      );
    } catch (e) {
      setRows([]);
      setNextCursor(null);
      setSelectedId(null);
      setErrorText(e?.data?.error || e?.message || "Failed to load proformas");
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
      const result = await apiFetch(`/proformas?${params.toString()}`, {
        method: "GET",
      });

      const nextRows = normalizeRows(result)
        .map(normalizeProforma)
        .filter(Boolean);

      setRows((prev) => [...prev, ...nextRows]);
      setNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to load more proformas",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setDetail({ proforma: null, items: [] });
      return;
    }

    setDetailLoading(true);

    try {
      const result = await apiFetch(`/proformas/${id}`, { method: "GET" });
      setDetail(normalizeDetail(result));
    } catch {
      setDetail({ proforma: null, items: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
  }, [q, locationId, from, to]);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId]);

  async function handleSaved(result) {
    setCreating(false);
    setSuccessText("Proforma created");
    await loadFirstPage();

    const nextId = result?.proforma?.id ?? null;
    if (nextId) {
      setSelectedId(nextId);
      await loadDetail(nextId);
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Proformas"
          subtitle="Loading owner-wide proforma visibility."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Proforma overview"
            subtitle="Cross-branch quotation and pre-invoice visibility for owner workflows."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Loaded"
                value={safeNumber(overview?.count)}
                sub="Proformas in current view"
              />
              <StatCard
                label="Quoted total"
                value={money(overview?.totalAmount, "RWF")}
                sub="Combined proforma value"
              />
              <StatCard
                label="With customer"
                value={safeNumber(overview?.withCustomer)}
                sub="Customer-named proformas"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Proforma controls"
            subtitle="Filter by customer, branch, or date, then print commercial documents directly."
            right={
              <AsyncButton
                idleText="Create proforma"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => setCreating(true)}
              />
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customer, number, phone"
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

          <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard
              title="Proforma directory"
              subtitle="Select a document to inspect printable header and line details."
            >
              {rows.length === 0 ? (
                <EmptyState text="No proformas match the current filters." />
              ) : (
                <div className="space-y-4">
                  {rows.map((row) => {
                    const active = String(row.id) === String(selectedId);

                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className={
                          "w-full rounded-[28px] border p-5 text-left transition " +
                          (active
                            ? "border-stone-900 bg-stone-900 text-white shadow-xl dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                            : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
                        }
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-base font-bold sm:text-lg">
                                {safe(row.proformaNo) || `Proforma #${row.id}`}
                              </h3>

                              <span
                                className={
                                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                                  (active
                                    ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                                    : statusTone(row.status))
                                }
                              >
                                {safe(row.status) || "DRAFT"}
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
                                <span className="font-medium">Customer:</span>{" "}
                                {safe(row.customerName) || "-"}
                              </p>
                              <p className="truncate">
                                <span className="font-medium">Branch:</span>{" "}
                                {displayBranch(row)}
                              </p>
                              <p className="truncate">
                                <span className="font-medium">Created:</span>{" "}
                                {safeDate(row.createdAt)}
                              </p>
                              <p className="truncate">
                                <span className="font-medium">
                                  Valid until:
                                </span>{" "}
                                {safe(row.validUntil) || "-"}
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
                              Total
                            </p>
                            <p className="mt-2 text-xl font-black sm:text-2xl">
                              {money(row.totalAmount, row.currency)}
                            </p>
                            <p
                              className={
                                "mt-1 text-xs " +
                                (active
                                  ? "text-stone-300 dark:text-stone-600"
                                  : "text-stone-500 dark:text-stone-400")
                              }
                            >
                              Printable commercial value
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
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

            {selectedProforma ? (
              <SectionCard
                title="Selected proforma detail"
                subtitle="Review document identity, customer block, and all printable line items."
                right={
                  <AsyncButton
                    idleText="Print / PDF"
                    loadingText="Opening..."
                    successText="Opened"
                    onClick={async () =>
                      openPrintPath(`/proformas/${selectedProforma.id}/print`)
                    }
                    variant="secondary"
                  />
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
                        label="Document"
                        value={
                          safe(selectedProforma.proformaNo) ||
                          `#${safeNumber(selectedProforma.id)}`
                        }
                        sub={safe(selectedProforma.status) || "DRAFT"}
                      />
                      <StatCard
                        label="Customer"
                        value={safe(selectedProforma.customerName) || "-"}
                        sub={safe(selectedProforma.customerPhone) || "No phone"}
                      />
                      <StatCard
                        label="Branch"
                        value={displayBranch(selectedProforma)}
                        sub={createdByLabel(selectedProforma)}
                      />
                      <StatCard
                        label="Total"
                        value={money(
                          selectedProforma.totalAmount,
                          selectedProforma.currency,
                        )}
                        sub={`Subtotal ${money(
                          selectedProforma.subtotal,
                          selectedProforma.currency,
                        )}`}
                      />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Customer & document
                        </p>

                        <div className="mt-4 grid gap-3">
                          {[
                            ["Customer", selectedProforma.customerName || "-"],
                            ["Phone", selectedProforma.customerPhone || "-"],
                            ["TIN", selectedProforma.customerTin || "-"],
                            [
                              "Address",
                              selectedProforma.customerAddress || "-",
                            ],
                            ["Valid until", selectedProforma.validUntil || "-"],
                            ["Created", safeDate(selectedProforma.createdAt)],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                            >
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                {label}
                              </p>
                              <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {safe(value) || "-"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Notes & terms
                        </p>

                        <div className="mt-4 grid gap-3">
                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Note
                            </p>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                              {safe(selectedProforma.note) || "No note"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Terms
                            </p>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                              {safe(selectedProforma.terms) || "No terms"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                        Proforma lines
                      </p>

                      {(detail?.items || []).length === 0 ? (
                        <div className="mt-4">
                          <EmptyState text="No line items found." />
                        </div>
                      ) : (
                        <div className="mt-4 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-stone-200 text-left dark:border-stone-800">
                                <th className="px-3 py-3 font-semibold text-stone-600 dark:text-stone-300">
                                  Item
                                </th>
                                <th className="px-3 py-3 font-semibold text-stone-600 dark:text-stone-300">
                                  SKU
                                </th>
                                <th className="px-3 py-3 font-semibold text-stone-600 dark:text-stone-300">
                                  Unit
                                </th>
                                <th className="px-3 py-3 text-right font-semibold text-stone-600 dark:text-stone-300">
                                  Qty
                                </th>
                                <th className="px-3 py-3 text-right font-semibold text-stone-600 dark:text-stone-300">
                                  Unit Price
                                </th>
                                <th className="px-3 py-3 text-right font-semibold text-stone-600 dark:text-stone-300">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.items.map((item) => (
                                <tr
                                  key={item.id}
                                  className="border-b border-stone-100 last:border-b-0 dark:border-stone-800"
                                >
                                  <td className="px-3 py-4 text-stone-900 dark:text-stone-100">
                                    {safe(
                                      item?.productDisplayName ||
                                        item?.productName,
                                    ) || "-"}
                                  </td>
                                  <td className="px-3 py-4 text-stone-700 dark:text-stone-300">
                                    {safe(item?.productSku) || "-"}
                                  </td>
                                  <td className="px-3 py-4 text-stone-700 dark:text-stone-300">
                                    {safe(item?.stockUnit) || "-"}
                                  </td>
                                  <td className="px-3 py-4 text-right text-stone-700 dark:text-stone-300">
                                    {safeNumber(item?.qty)}
                                  </td>
                                  <td className="px-3 py-4 text-right text-stone-700 dark:text-stone-300">
                                    {money(
                                      item?.unitPrice,
                                      selectedProforma.currency,
                                    )}
                                  </td>
                                  <td className="px-3 py-4 text-right font-semibold text-stone-900 dark:text-stone-100">
                                    {money(
                                      item?.lineTotal,
                                      selectedProforma.currency,
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </SectionCard>
            ) : (
              <SectionCard
                title="Selected proforma detail"
                subtitle="This section appears after a proforma is selected."
              >
                <EmptyState text="Select a proforma to inspect printable detail." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      <CreateProformaModal
        open={creating}
        locations={locationOptions}
        onClose={() => setCreating(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
