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
const SOURCE_TYPES = [
  "MANUAL",
  "PURCHASE_ORDER",
  "SUPPLIER_DELIVERY",
  "TRANSFER_IN",
  "OTHER",
];

function money(v) {
  return safeNumber(v).toLocaleString();
}

function sourceTone(value) {
  const v = String(value || "").toUpperCase();

  if (v === "PURCHASE_ORDER") {
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300";
  }
  if (v === "SUPPLIER_DELIVERY") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (v === "TRANSFER_IN") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function normalizeArrival(row) {
  if (!row) return null;

  return {
    id: Number(row.id ?? 0),
    locationId: Number(row.locationId ?? row.location_id ?? 0),
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    supplierId:
      row.supplierId == null ? null : Number(row.supplierId ?? row.supplier_id),
    supplierName: row.supplierName ?? row.supplier_name ?? "",
    reference: row.reference ?? "",
    documentNo: row.documentNo ?? row.document_no ?? "",
    sourceType: row.sourceType ?? row.source_type ?? "MANUAL",
    sourceId:
      row.sourceId == null ? null : Number(row.sourceId ?? row.source_id),
    notes: row.notes ?? "",
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    receivedByUserId:
      row.receivedByUserId == null
        ? null
        : Number(row.receivedByUserId ?? row.received_by_user_id),
    receivedByName: row.receivedByName ?? row.received_by_name ?? "",
    receivedByEmail: row.receivedByEmail ?? row.received_by_email ?? "",
    receivedAt: row.receivedAt ?? row.received_at ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    itemsCount: Number(row.itemsCount ?? row.items_count ?? 0),
    totalStockQtyReceived: Number(
      row.totalStockQtyReceived ?? row.total_stock_qty_received ?? 0,
    ),
  };
}

function normalizeArrivalItem(row) {
  if (!row) return null;

  return {
    id: Number(row.id ?? 0),
    arrivalId: Number(row.arrivalId ?? row.arrival_id ?? 0),
    productId: Number(row.productId ?? row.product_id ?? 0),
    productName: row.productName ?? row.product_name ?? "",
    productDisplayName:
      row.productDisplayName ?? row.product_display_name ?? "",
    productSku: row.productSku ?? row.product_sku ?? "",
    stockUnit: row.stockUnit ?? row.stock_unit ?? "PIECE",
    purchaseUnit: row.purchaseUnit ?? row.purchase_unit ?? "PIECE",
    purchaseUnitFactor: Number(
      row.purchaseUnitFactor ?? row.purchase_unit_factor ?? 1,
    ),
    qtyReceived: Number(row.qtyReceived ?? row.qty_received ?? 0),
    bonusQty: Number(row.bonusQty ?? row.bonus_qty ?? 0),
    stockQtyReceived: Number(
      row.stockQtyReceived ?? row.stock_qty_received ?? 0,
    ),
    unitCost: Number(row.unitCost ?? row.unit_cost ?? 0),
    lineTotal: Number(row.lineTotal ?? row.line_total ?? 0),
    note: row.note ?? "",
    createdAt: row.createdAt ?? row.created_at ?? null,
  };
}

function ArrivalListRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[90px_minmax(220px,2fr)_170px_120px_110px_120px_120px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
        (active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
          : "bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/70")
      }
    >
      <div className="text-sm font-bold">#{safeNumber(row?.id)}</div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13px] font-semibold leading-5">
            {safe(row?.reference) || safe(row?.documentNo) || "Arrival"}
          </p>
          <span
            className={
              "rounded-full px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] " +
              (active
                ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                : sourceTone(row?.sourceType))
            }
          >
            {safe(row?.sourceType) || "MANUAL"}
          </span>
        </div>

        <p
          className={
            "mt-1 truncate text-[11px] leading-5 " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          Supplier: {safe(row?.supplierName) || "-"} · By:{" "}
          {safe(row?.receivedByName) || safe(row?.receivedByEmail) || "-"}
        </p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold leading-5">
          {safe(row?.locationName) || "-"}
        </p>
        <p
          className={
            "mt-1 truncate text-[11px] leading-5 " +
            (active
              ? "text-stone-300 dark:text-stone-600"
              : "text-stone-500 dark:text-stone-400")
          }
        >
          {safe(row?.locationCode) || "-"}
        </p>
      </div>

      <div className="text-sm font-semibold">{safeNumber(row?.itemsCount)}</div>
      <div className="text-sm font-semibold">
        {safeNumber(row?.totalStockQtyReceived)}
      </div>
      <div className="text-sm font-semibold">{money(row?.totalAmount)}</div>
      <div className="text-sm font-medium">{safeDate(row?.receivedAt)}</div>
    </button>
  );
}

function ArrivalMobileRow({ row, active, onSelect }) {
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[13px] font-semibold leading-5">
              #{safeNumber(row?.id)} ·{" "}
              {safe(row?.reference) || safe(row?.documentNo) || "Arrival"}
            </p>
            <span
              className={
                "rounded-full px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] " +
                (active
                  ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                  : sourceTone(row?.sourceType))
              }
            >
              {safe(row?.sourceType) || "MANUAL"}
            </span>
          </div>

          <p
            className={
              "mt-1 truncate text-[11px] leading-5 " +
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
              "mt-1 truncate text-[11px] leading-5 " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            Supplier: {safe(row?.supplierName) || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-right dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Total
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.totalAmount)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Items
          </p>
          <p className="mt-1 text-sm font-bold">
            {safeNumber(row?.itemsCount)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Stock Qty
          </p>
          <p className="mt-1 text-sm font-bold">
            {safeNumber(row?.totalStockQtyReceived)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Date
          </p>
          <p className="mt-1 text-sm font-bold">{safeDate(row?.receivedAt)}</p>
        </div>
      </div>
    </button>
  );
}

function CreateArrivalItemRow({
  index,
  row,
  products,
  onChange,
  onRemove,
  canRemove,
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="grid gap-4 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <FieldLabel htmlFor={`arrival-item-product-${index}`}>
            Product
          </FieldLabel>
          <FormSelect
            id={`arrival-item-product-${index}`}
            value={row.productId}
            onChange={(e) => onChange(index, "productId", e.target.value)}
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {safe(product.displayName) || safe(product.name)}{" "}
                {safe(product.sku) ? `(${safe(product.sku)})` : ""}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <FieldLabel htmlFor={`arrival-item-qty-${index}`}>
            Qty received
          </FieldLabel>
          <FormInput
            id={`arrival-item-qty-${index}`}
            type="number"
            min="0"
            value={row.qtyReceived}
            onChange={(e) => onChange(index, "qtyReceived", e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <FieldLabel htmlFor={`arrival-item-bonus-${index}`}>
            Bonus qty
          </FieldLabel>
          <FormInput
            id={`arrival-item-bonus-${index}`}
            type="number"
            min="0"
            value={row.bonusQty}
            onChange={(e) => onChange(index, "bonusQty", e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <FieldLabel htmlFor={`arrival-item-cost-${index}`}>
            Unit cost
          </FieldLabel>
          <FormInput
            id={`arrival-item-cost-${index}`}
            type="number"
            min="0"
            value={row.unitCost}
            onChange={(e) => onChange(index, "unitCost", e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="flex items-end">
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

      <div className="mt-4">
        <FieldLabel htmlFor={`arrival-item-note-${index}`}>
          Line note
        </FieldLabel>
        <FormInput
          id={`arrival-item-note-${index}`}
          value={row.note}
          onChange={(e) => onChange(index, "note", e.target.value)}
          placeholder="Optional line note"
        />
      </div>
    </div>
  );
}

export default function OwnerArrivalsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [arrivals, setArrivals] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [selectedArrivalId, setSelectedArrivalId] = useState(null);
  const [arrivalDetail, setArrivalDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    locationId: "",
    supplierId: "",
    reference: "",
    documentNo: "",
    sourceType: "MANUAL",
    sourceId: "",
    notes: "",
    receivedAt: "",
    items: [
      {
        productId: "",
        qtyReceived: "",
        bonusQty: "0",
        unitCost: "",
        note: "",
      },
    ],
  });

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const activeLocationOptions = useMemo(() => {
    return locationOptions.filter(
      (row) => safe(row?.status).toUpperCase() === "ACTIVE",
    );
  }, [locationOptions]);

  const selectedArrival =
    arrivalDetail?.arrival ||
    arrivals.find((row) => String(row.id) === String(selectedArrivalId)) ||
    null;

  const overview = useMemo(() => {
    let totalCount = 0;
    let totalAmount = 0;
    let totalItems = 0;
    let totalStockQty = 0;

    for (const row of arrivals) {
      totalCount += 1;
      totalAmount += Number(row?.totalAmount || 0);
      totalItems += Number(row?.itemsCount || 0);
      totalStockQty += Number(row?.totalStockQtyReceived || 0);
    }

    return {
      totalCount,
      totalAmount,
      totalItems,
      totalStockQty,
    };
  }, [arrivals]);

  function buildParams(extra = {}) {
    const params = new URLSearchParams();

    if (locationId) params.set("locationId", locationId);
    if (search.trim()) params.set("q", search.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    params.set("limit", String(extra.limit || PAGE_SIZE));

    if (extra.cursor) {
      params.set("cursor", String(extra.cursor));
    }

    return params;
  }

  async function loadRefs() {
    setLoadingRefs(true);

    const [suppliersRes, productsRes] = await Promise.allSettled([
      apiFetch("/suppliers", { method: "GET" }),
      apiFetch("/owner/products?includeInactive=false", { method: "GET" }),
    ]);

    if (suppliersRes.status === "fulfilled") {
      const rows = Array.isArray(suppliersRes.value?.suppliers)
        ? suppliersRes.value.suppliers
        : [];
      setSuppliers(rows);
    } else {
      setSuppliers([]);
    }

    if (productsRes.status === "fulfilled") {
      const rows = Array.isArray(productsRes.value?.products)
        ? productsRes.value.products
        : [];
      setProducts(rows);
    } else {
      setProducts([]);
    }

    setLoadingRefs(false);
  }

  async function loadArrivals() {
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      const params = buildParams({ limit: PAGE_SIZE });
      const result = await apiFetch(
        `/inventory-arrivals?${params.toString()}`,
        {
          method: "GET",
        },
      );

      const rows = Array.isArray(result?.arrivals)
        ? result.arrivals.map(normalizeArrival).filter(Boolean)
        : [];

      setArrivals(rows);
      setNextCursor(result?.nextCursor ?? null);
      setSelectedArrivalId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev))
          ? prev
          : (rows[0]?.id ?? null),
      );
    } catch (error) {
      setArrivals([]);
      setNextCursor(null);
      setSelectedArrivalId(null);
      setErrorText(
        error?.data?.error || error?.message || "Failed to load arrivals",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) return;

    try {
      const params = buildParams({ limit: PAGE_SIZE, cursor: nextCursor });
      const result = await apiFetch(
        `/inventory-arrivals?${params.toString()}`,
        {
          method: "GET",
        },
      );

      const rows = Array.isArray(result?.arrivals)
        ? result.arrivals.map(normalizeArrival).filter(Boolean)
        : [];

      setArrivals((prev) => [...prev, ...rows]);
      setNextCursor(result?.nextCursor ?? null);
    } catch (error) {
      setErrorText(
        error?.data?.error || error?.message || "Failed to load more arrivals",
      );
    }
  }

  async function loadArrivalDetail(id) {
    if (!id) {
      setArrivalDetail(null);
      return;
    }

    setDetailLoading(true);

    try {
      const result = await apiFetch(`/inventory-arrivals/${id}`, {
        method: "GET",
      });

      setArrivalDetail({
        arrival: normalizeArrival(result?.arrival),
        items: Array.isArray(result?.items)
          ? result.items.map(normalizeArrivalItem).filter(Boolean)
          : [],
      });
    } catch {
      setArrivalDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadArrivals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, from, to]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadArrivals();
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    loadArrivalDetail(selectedArrivalId);
  }, [selectedArrivalId]);

  function resetCreateModal() {
    setCreateModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
    setCreateForm({
      locationId: activeLocationOptions[0]?.id
        ? String(activeLocationOptions[0].id)
        : "",
      supplierId: "",
      reference: "",
      documentNo: "",
      sourceType: "MANUAL",
      sourceId: "",
      notes: "",
      receivedAt: "",
      items: [
        {
          productId: "",
          qtyReceived: "",
          bonusQty: "0",
          unitCost: "",
          note: "",
        },
      ],
    });
  }

  async function openCreateModal() {
    resetCreateModal();
    setCreateModalOpen(true);
    await loadRefs();
  }

  function updateItem(index, key, value) {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addItemRow() {
    setCreateForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          qtyReceived: "",
          bonusQty: "0",
          unitCost: "",
          note: "",
        },
      ],
    }));
  }

  function removeItemRow(index) {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function createArrival() {
    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch("/inventory-arrivals", {
        method: "POST",
        body: {
          locationId: safeNumber(createForm.locationId),
          supplierId: createForm.supplierId
            ? safeNumber(createForm.supplierId)
            : undefined,
          reference: safe(createForm.reference) || undefined,
          documentNo: safe(createForm.documentNo) || undefined,
          sourceType: safe(createForm.sourceType) || "MANUAL",
          sourceId: createForm.sourceId
            ? safeNumber(createForm.sourceId)
            : undefined,
          notes: safe(createForm.notes) || undefined,
          receivedAt: safe(createForm.receivedAt) || undefined,
          items: createForm.items
            .map((item) => ({
              productId: safeNumber(item.productId),
              qtyReceived: safeNumber(item.qtyReceived),
              bonusQty: safeNumber(item.bonusQty),
              unitCost: safeNumber(item.unitCost),
              note: safe(item.note) || undefined,
            }))
            .filter((item) => item.productId > 0),
        },
      });

      resetCreateModal();
      await loadArrivals();
      setSuccessText("Inventory arrival recorded successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to create arrival",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Inventory arrivals"
          subtitle="Loading owner cross-branch arrivals."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
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
            title="Arrivals overview"
            subtitle="Owner-wide visibility of received stock across all branches."
            right={
              <AsyncButton
                idleText="Record arrival"
                loadingText="Opening..."
                successText="Ready"
                onClick={openCreateModal}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Arrivals"
                value={safeNumber(overview.totalCount)}
                sub="Loaded arrival records"
              />
              <StatCard
                label="Items"
                value={safeNumber(overview.totalItems)}
                sub="Loaded received lines"
              />
              <StatCard
                label="Stock qty"
                value={safeNumber(overview.totalStockQty)}
                sub="Total stock units received"
              />
              <StatCard
                label="Amount"
                value={money(overview.totalAmount)}
                sub="Loaded arrival value"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Arrival directory"
            subtitle="Search, filter, and inspect stock arrivals across branches."
          >
            <div className="grid gap-3 lg:grid-cols-4">
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search arrival, reference, supplier, document, branch"
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

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-stone-600 dark:text-stone-300">
              <p>Showing {safeNumber(arrivals.length)} loaded rows</p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[90px_minmax(220px,2fr)_170px_120px_110px_120px_120px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>ID</div>
                <div>Reference</div>
                <div>Branch</div>
                <div>Items</div>
                <div>Stock qty</div>
                <div>Amount</div>
                <div>Received</div>
              </div>

              {arrivals.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No arrivals match the current owner filters." />
                </div>
              ) : (
                <div>
                  {arrivals.map((row) => (
                    <div key={row.id}>
                      <ArrivalListRow
                        row={row}
                        active={String(row.id) === String(selectedArrivalId)}
                        onSelect={(picked) => setSelectedArrivalId(picked?.id)}
                      />
                      <div className="p-3 lg:hidden">
                        <ArrivalMobileRow
                          row={row}
                          active={String(row.id) === String(selectedArrivalId)}
                          onSelect={(picked) =>
                            setSelectedArrivalId(picked?.id)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {nextCursor ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  Load 20 more
                </button>
              </div>
            ) : null}
          </SectionCard>

          {selectedArrival ? (
            <SectionCard
              title="Selected arrival detail"
              subtitle="Focused view of the selected arrival header and received lines."
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
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      label="Arrival"
                      value={`#${safeNumber(selectedArrival.id)}`}
                      sub={safe(selectedArrival.sourceType) || "MANUAL"}
                    />
                    <StatCard
                      label="Branch"
                      value={safe(selectedArrival.locationName) || "-"}
                      valueClassName="text-xl sm:text-lg leading-tight"
                      sub={safe(selectedArrival.locationCode) || "-"}
                    />
                    <StatCard
                      label="Amount"
                      value={money(selectedArrival.totalAmount)}
                      sub="Total received value"
                    />
                    <StatCard
                      label="Stock qty"
                      value={safeNumber(selectedArrival.totalStockQtyReceived)}
                      sub="Total stock units received"
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                        Arrival header
                      </p>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-stone-500 dark:text-stone-400">
                            Supplier
                          </span>
                          <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                            {safe(selectedArrival.supplierName) || "-"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-stone-500 dark:text-stone-400">
                            Reference
                          </span>
                          <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                            {safe(selectedArrival.reference) || "-"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-stone-500 dark:text-stone-400">
                            Document no
                          </span>
                          <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                            {safe(selectedArrival.documentNo) || "-"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-stone-500 dark:text-stone-400">
                            Received by
                          </span>
                          <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                            {safe(selectedArrival.receivedByName) ||
                              safe(selectedArrival.receivedByEmail) ||
                              "-"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-stone-500 dark:text-stone-400">
                            Received at
                          </span>
                          <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                            {safeDate(selectedArrival.receivedAt)}
                          </span>
                        </div>

                        <div className="border-t border-stone-200 pt-3 dark:border-stone-800">
                          <p className="text-stone-500 dark:text-stone-400">
                            Notes
                          </p>
                          <p className="mt-2 leading-6 text-stone-800 dark:text-stone-200">
                            {safe(selectedArrival.notes) ||
                              "No notes recorded."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                        Received lines
                      </p>

                      {(arrivalDetail?.items || []).length === 0 ? (
                        <div className="mt-4">
                          <EmptyState text="No received lines found." />
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {(arrivalDetail?.items || []).map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                                    {safe(item.productDisplayName) ||
                                      safe(item.productName) ||
                                      "-"}
                                  </p>
                                  <p className="mt-1 truncate text-[11px] leading-5 text-stone-500 dark:text-stone-400">
                                    SKU: {safe(item.productSku) || "-"} ·
                                    Product #{safeNumber(item.productId)}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-right dark:border-stone-800 dark:bg-stone-950">
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Line total
                                  </p>
                                  <p className="mt-1 text-sm font-bold">
                                    {money(item.lineTotal)}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                    Qty received
                                  </p>
                                  <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                    {safeNumber(item.qtyReceived)}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                    Bonus qty
                                  </p>
                                  <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                    {safeNumber(item.bonusQty)}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                    Stock qty
                                  </p>
                                  <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                    {safeNumber(item.stockQtyReceived)}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                    Unit cost
                                  </p>
                                  <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                    {money(item.unitCost)}
                                  </p>
                                </div>
                              </div>

                              {safe(item.note) ? (
                                <div className="mt-3 border-t border-stone-200 pt-3 dark:border-stone-800">
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                    Note
                                  </p>
                                  <p className="mt-1 text-sm text-stone-800 dark:text-stone-200">
                                    {safe(item.note)}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected arrival detail"
              subtitle="This section appears after the owner selects an arrival."
            >
              <EmptyState text="Click any arrival row above to inspect header and received lines." />
            </SectionCard>
          )}
        </>
      )}

      <OverlayModal
        open={createModalOpen}
        title="Record inventory arrival"
        subtitle="Receive stock into a selected active branch."
        onClose={resetCreateModal}
        footer={
          <>
            <button
              type="button"
              onClick={resetCreateModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createArrival}
              disabled={modalSubmitting || !safe(createForm.locationId)}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Saving..." : "Save arrival"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="arrival-location">Active branch</FieldLabel>
              <FormSelect
                id="arrival-location"
                value={createForm.locationId}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    locationId: e.target.value,
                  }))
                }
              >
                <option value="">Select active branch</option>
                {activeLocationOptions.map((row) => (
                  <option key={row.id} value={row.id}>
                    {safe(row.name)}{" "}
                    {safe(row.code) ? `(${safe(row.code)})` : ""}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="arrival-supplier">Supplier</FieldLabel>
              <FormSelect
                id="arrival-supplier"
                value={createForm.supplierId}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    supplierId: e.target.value,
                  }))
                }
                disabled={loadingRefs}
              >
                <option value="">No supplier</option>
                {suppliers.map((row) => (
                  <option key={row.id} value={row.id}>
                    {safe(row.name)}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel htmlFor="arrival-reference">Reference</FieldLabel>
              <FormInput
                id="arrival-reference"
                value={createForm.reference}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
                placeholder="Supplier reference"
              />
            </div>

            <div>
              <FieldLabel htmlFor="arrival-document-no">Document no</FieldLabel>
              <FormInput
                id="arrival-document-no"
                value={createForm.documentNo}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    documentNo: e.target.value,
                  }))
                }
                placeholder="Delivery / invoice no"
              />
            </div>

            <div>
              <FieldLabel htmlFor="arrival-source-type">Source type</FieldLabel>
              <FormSelect
                id="arrival-source-type"
                value={createForm.sourceType}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    sourceType: e.target.value,
                  }))
                }
              >
                {SOURCE_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="arrival-received-at">Received at</FieldLabel>
              <FormInput
                id="arrival-received-at"
                type="datetime-local"
                value={createForm.receivedAt}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    receivedAt: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="arrival-notes">Notes</FieldLabel>
            <FormTextarea
              id="arrival-notes"
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Optional arrival notes"
            />
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  Arrival lines
                </p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  Add one or more received product lines.
                </p>
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Add line
              </button>
            </div>

            <div className="space-y-4">
              {createForm.items.map((row, index) => (
                <CreateArrivalItemRow
                  key={index}
                  index={index}
                  row={row}
                  products={products}
                  onChange={updateItem}
                  onRemove={removeItemRow}
                  canRemove={createForm.items.length > 1}
                />
              ))}
            </div>
          </div>
        </div>
      </OverlayModal>
    </div>
  );
}
