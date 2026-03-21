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
  if (Array.isArray(result?.deliveryNotes)) return result.deliveryNotes;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeDeliveryNote(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    saleId: row.saleId ?? row.sale_id ?? null,
    customerId: row.customerId ?? row.customer_id ?? null,
    customerName: row.customerName ?? row.customer_name ?? "",
    customerPhone: row.customerPhone ?? row.customer_phone ?? "",
    customerTin: row.customerTin ?? row.customer_tin ?? "",
    customerAddress: row.customerAddress ?? row.customer_address ?? "",
    createdByUserId: row.createdByUserId ?? row.created_by_user_id ?? null,
    createdByName: row.createdByName ?? row.created_by_name ?? "",
    createdByEmail: row.createdByEmail ?? row.created_by_email ?? "",
    deliveryNoteNo: row.deliveryNoteNo ?? row.delivery_note_no ?? "",
    status: row.status ?? "ISSUED",
    deliveredTo: row.deliveredTo ?? row.delivered_to ?? "",
    deliveredPhone: row.deliveredPhone ?? row.delivered_phone ?? "",
    dispatchedAt: row.dispatchedAt ?? row.dispatched_at ?? null,
    deliveredAt: row.deliveredAt ?? row.delivered_at ?? null,
    note: row.note ?? "",
    totalItems: Number(row.totalItems ?? row.total_items ?? 0),
    totalQty: Number(row.totalQty ?? row.total_qty ?? 0),
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function normalizeDetail(result) {
  return {
    deliveryNote: result?.deliveryNote
      ? normalizeDeliveryNote(result.deliveryNote)
      : null,
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

  if (s === "ISSUED" || s === "DELIVERED") {
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

function CreateDeliveryNoteModal({ open, locations, onClose, onSaved }) {
  const [form, setForm] = useState({
    locationId: "",
    saleId: "",
    deliveryNoteNo: "",
    deliveredTo: "",
    deliveredPhone: "",
    dispatchedAt: "",
    deliveredAt: "",
    note: "",
  });
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      locationId: "",
      saleId: "",
      deliveryNoteNo: "",
      deliveredTo: "",
      deliveredPhone: "",
      dispatchedAt: "",
      deliveredAt: "",
      note: "",
    });
    setErrorText("");
  }, [open]);

  if (!open) return null;

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        locationId: Number(form.locationId),
        saleId: Number(form.saleId),
        deliveryNoteNo: form.deliveryNoteNo.trim() || undefined,
        deliveredTo: form.deliveredTo.trim() || undefined,
        deliveredPhone: form.deliveredPhone.trim() || undefined,
        dispatchedAt: form.dispatchedAt || undefined,
        deliveredAt: form.deliveredAt || undefined,
        note: form.note.trim() || undefined,
      };

      if (!payload.locationId) {
        throw new Error("Choose a branch");
      }

      if (!payload.saleId) {
        throw new Error("Enter a valid sale id");
      }

      const result = await apiFetch("/delivery-notes", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to create delivery note",
      );
    }
  }

  return (
    <ModalShell
      title="Create delivery note"
      subtitle="Issue a printable dispatch / handover document tied to a completed sale."
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
            Delivery note number
          </label>
          <FormInput
            value={form.deliveryNoteNo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, deliveryNoteNo: e.target.value }))
            }
            placeholder="Optional custom number"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Delivered to
          </label>
          <FormInput
            value={form.deliveredTo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, deliveredTo: e.target.value }))
            }
            placeholder="Receiver name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Delivered phone
          </label>
          <FormInput
            value={form.deliveredPhone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, deliveredPhone: e.target.value }))
            }
            placeholder="Receiver phone"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Dispatched at
          </label>
          <FormInput
            type="datetime-local"
            value={form.dispatchedAt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dispatchedAt: e.target.value }))
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Delivered at
          </label>
          <FormInput
            type="datetime-local"
            value={form.deliveredAt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, deliveredAt: e.target.value }))
            }
          />
        </div>

        <div className="md:col-span-2">
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
            placeholder="Optional delivery note"
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
          idleText="Create delivery note"
          loadingText="Creating..."
          successText="Created"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerDeliveryNotesTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [rows, setRows] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState({ deliveryNote: null, items: [] });

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [saleId, setSaleId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [creating, setCreating] = useState(false);

  const selectedDeliveryNote =
    detail?.deliveryNote ||
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
    let totalQty = 0;
    let totalItems = 0;

    for (const row of items) {
      totalQty += Number(row?.totalQty || 0);
      totalItems += Number(row?.totalItems || 0);
    }

    return {
      count,
      totalQty,
      totalItems,
    };
  }, [rows]);

  function buildParams(extra = {}) {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (locationId) params.set("locationId", locationId);
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
      const result = await apiFetch(`/delivery-notes?${params.toString()}`, {
        method: "GET",
      });

      const nextRows = normalizeRows(result)
        .map(normalizeDeliveryNote)
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
      setErrorText(
        e?.data?.error || e?.message || "Failed to load delivery notes",
      );
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
      const result = await apiFetch(`/delivery-notes?${params.toString()}`, {
        method: "GET",
      });

      const nextRows = normalizeRows(result)
        .map(normalizeDeliveryNote)
        .filter(Boolean);

      setRows((prev) => [...prev, ...nextRows]);
      setNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to load more delivery notes",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setDetail({ deliveryNote: null, items: [] });
      return;
    }

    setDetailLoading(true);

    try {
      const result = await apiFetch(`/delivery-notes/${id}`, { method: "GET" });
      setDetail(normalizeDetail(result));
    } catch {
      setDetail({ deliveryNote: null, items: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
  }, [q, locationId, saleId, from, to]);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId]);

  async function handleSaved(result) {
    setCreating(false);
    setSuccessText("Delivery note created");
    await loadFirstPage();

    const nextId = result?.deliveryNote?.id ?? null;
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
          title="Delivery notes"
          subtitle="Loading owner-wide delivery note visibility."
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
            title="Delivery note overview"
            subtitle="Cross-branch dispatch documentation and handover traceability."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Loaded"
                value={safeNumber(overview?.count)}
                sub="Delivery notes in current view"
              />
              <StatCard
                label="Item lines"
                value={safeNumber(overview?.totalItems)}
                sub="Documented dispatch lines"
              />
              <StatCard
                label="Total qty"
                value={safeNumber(overview?.totalQty)}
                sub="Units recorded for delivery"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Delivery note controls"
            subtitle="Filter by branch, sale, customer-related search, and date."
            right={
              <AsyncButton
                idleText="Create delivery note"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => setCreating(true)}
              />
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search note, customer, receiver"
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

          <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard
              title="Delivery note directory"
              subtitle="Select a document to inspect full dispatch detail and printable lines."
            >
              {rows.length === 0 ? (
                <EmptyState text="No delivery notes match the current filters." />
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
                                {safe(row.deliveryNoteNo) ||
                                  `Delivery Note #${row.id}`}
                              </h3>

                              <span
                                className={
                                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                                  (active
                                    ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                                    : statusTone(row.status))
                                }
                              >
                                {safe(row.status) || "ISSUED"}
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
                                <span className="font-medium">Sale:</span> #
                                {safe(row.saleId) || "-"}
                              </p>
                              <p className="truncate">
                                <span className="font-medium">Created:</span>{" "}
                                {safeDate(row.createdAt)}
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
                              Dispatch qty
                            </p>
                            <p className="mt-2 text-xl font-black sm:text-2xl">
                              {safeNumber(row.totalQty)}
                            </p>
                            <p
                              className={
                                "mt-1 text-xs " +
                                (active
                                  ? "text-stone-300 dark:text-stone-600"
                                  : "text-stone-500 dark:text-stone-400")
                              }
                            >
                              Across {safeNumber(row.totalItems)} item lines
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

            {selectedDeliveryNote ? (
              <SectionCard
                title="Selected delivery note detail"
                subtitle="Review dispatch metadata, receiving party, and printable goods lines."
                right={
                  <AsyncButton
                    idleText="Print / PDF"
                    loadingText="Opening..."
                    successText="Opened"
                    onClick={async () =>
                      openPrintPath(
                        `/delivery-notes/${selectedDeliveryNote.id}/print`,
                      )
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
                          safe(selectedDeliveryNote.deliveryNoteNo) ||
                          `#${safeNumber(selectedDeliveryNote.id)}`
                        }
                        sub={safe(selectedDeliveryNote.status) || "ISSUED"}
                      />
                      <StatCard
                        label="Sale"
                        value={`#${safeNumber(selectedDeliveryNote.saleId)}`}
                        sub={
                          safe(selectedDeliveryNote.customerName) ||
                          "No customer"
                        }
                      />
                      <StatCard
                        label="Branch"
                        value={displayBranch(selectedDeliveryNote)}
                        sub={createdByLabel(selectedDeliveryNote)}
                      />
                      <StatCard
                        label="Dispatch qty"
                        value={safeNumber(selectedDeliveryNote.totalQty)}
                        sub={`${safeNumber(selectedDeliveryNote.totalItems)} item lines`}
                      />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Customer & receiver
                        </p>

                        <div className="mt-4 grid gap-3">
                          {[
                            [
                              "Customer",
                              selectedDeliveryNote.customerName || "-",
                            ],
                            [
                              "Customer phone",
                              selectedDeliveryNote.customerPhone || "-",
                            ],
                            [
                              "Delivered to",
                              selectedDeliveryNote.deliveredTo || "-",
                            ],
                            [
                              "Delivered phone",
                              selectedDeliveryNote.deliveredPhone || "-",
                            ],
                            [
                              "Customer address",
                              selectedDeliveryNote.customerAddress || "-",
                            ],
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
                          Dispatch information
                        </p>

                        <div className="mt-4 grid gap-3">
                          {[
                            [
                              "Dispatched at",
                              safeDate(selectedDeliveryNote.dispatchedAt),
                            ],
                            [
                              "Delivered at",
                              safeDate(selectedDeliveryNote.deliveredAt),
                            ],
                            [
                              "Created",
                              safeDate(selectedDeliveryNote.createdAt),
                            ],
                            [
                              "Prepared by",
                              createdByLabel(selectedDeliveryNote),
                            ],
                            ["Note", selectedDeliveryNote.note || "No note"],
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
                    </div>

                    <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                        Delivery note lines
                      </p>

                      {(detail?.items || []).length === 0 ? (
                        <div className="mt-4">
                          <EmptyState text="No delivery items found." />
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
                                  Sale Item
                                </th>
                                <th className="px-3 py-3 font-semibold text-stone-600 dark:text-stone-300">
                                  Unit
                                </th>
                                <th className="px-3 py-3 text-right font-semibold text-stone-600 dark:text-stone-300">
                                  Qty
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
                                    {item?.saleItemId != null
                                      ? `#${safeNumber(item.saleItemId)}`
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-4 text-stone-700 dark:text-stone-300">
                                    {safe(item?.stockUnit) || "-"}
                                  </td>
                                  <td className="px-3 py-4 text-right font-semibold text-stone-900 dark:text-stone-100">
                                    {safeNumber(item?.qty)}
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
                title="Selected delivery note detail"
                subtitle="This section appears after a delivery note is selected."
              >
                <EmptyState text="Select a delivery note to inspect printable detail." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      <CreateDeliveryNoteModal
        open={creating}
        locations={locationOptions}
        onClose={() => setCreating(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
