"use client";

import {
  AlertBox,
  EmptyState,
  FormInput,
  FormSelect,
  FormTextarea,
  safe,
  safeDate,
  safeNumber,
} from "../OwnerShared";
import {
  downloadPurchaseOrderPdf,
  previewPurchaseOrderPdf,
} from "../../../lib/purchaseOrdersPdf";
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePurchaseOrdersResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.purchaseOrders)) return result.purchaseOrders;
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
    isActive: row.isActive ?? row.is_active ?? true,
  };
}

function normalizeProduct(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    name: row.name ?? row.productName ?? "",
    sku: row.sku ?? "",
    costPrice: Number(row.costPrice ?? row.cost_price ?? 0),
    isActive: row.isActive ?? row.is_active ?? true,
  };
}

function normalizePurchaseOrder(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    supplierId: row.supplierId ?? row.supplier_id ?? null,
    supplierName: row.supplierName ?? row.supplier_name ?? "",
    poNo: row.poNo ?? row.po_no ?? "",
    reference: row.reference ?? "",
    currency: normalizeCurrency(row.currency),
    status: row.status ?? "DRAFT",
    notes: row.notes ?? row.note ?? "",
    orderedAt: row.orderedAt ?? row.ordered_at ?? null,
    expectedAt: row.expectedAt ?? row.expected_at ?? null,
    approvedAt: row.approvedAt ?? row.approved_at ?? null,
    createdByUserId: row.createdByUserId ?? row.created_by_user_id ?? null,
    createdByName: row.createdByName ?? row.created_by_name ?? "",
    approvedByUserId: row.approvedByUserId ?? row.approved_by_user_id ?? null,
    approvedByName: row.approvedByName ?? row.approved_by_name ?? "",
    subtotalAmount: Number(row.subtotalAmount ?? row.subtotal_amount ?? 0),
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    itemsCount: Number(row.itemsCount ?? row.items_count ?? 0),
    qtyOrderedTotal: Number(row.qtyOrderedTotal ?? row.qty_ordered_total ?? 0),
    qtyReceivedTotal: Number(
      row.qtyReceivedTotal ?? row.qty_received_total ?? 0,
    ),
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function normalizePurchaseOrderDetail(result) {
  return {
    purchaseOrder: result?.purchaseOrder
      ? normalizePurchaseOrder(result.purchaseOrder)
      : null,
    items: Array.isArray(result?.items) ? result.items : [],
  };
}

function findLocationMeta(locations, locationId) {
  const rows = Array.isArray(locations) ? locations : [];
  return rows.find((row) => String(row?.id) === String(locationId)) || null;
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

  if (row?.locationId != null) return `Branch #${row.locationId}`;
  return "-";
}

function statusTone(status) {
  const s = safe(status).toUpperCase();
  if (s === "APPROVED") return "success";
  if (s === "DRAFT") return "info";
  if (s === "PARTIALLY_RECEIVED") return "warn";
  if (s === "RECEIVED") return "success";
  if (s === "CANCELLED") return "danger";
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
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
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

function PurchaseOrderCard({ row, active, onSelect, locations = [] }) {
  const status = safe(row?.status) || "DRAFT";

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
              {safe(row?.poNo) || "No order number"}
            </div>
            <Pill tone={statusTone(status)}>{status}</Pill>
            <Pill tone="neutral">{normalizeCurrency(row?.currency)}</Pill>
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
            Ordered:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safeDate(row?.orderedAt)}
            </b>{" "}
            • Expected:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safeDate(row?.expectedAt)}
            </b>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Total
          </div>
          <div className="mt-1 text-lg font-black text-stone-950 dark:text-stone-50">
            {money(row?.totalAmount, row?.currency)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            {safeNumber(row?.itemsCount)} line
            {safeNumber(row?.itemsCount) === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-[18px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Qty ordered
          </div>
          <div className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {safeNumber(row?.qtyOrderedTotal)}
          </div>
        </div>
        <div className="rounded-[18px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Qty received
          </div>
          <div className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {safeNumber(row?.qtyReceivedTotal)}
          </div>
        </div>
        <div className="rounded-[18px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reference
          </div>
          <div className="mt-2 truncate text-sm font-bold text-stone-950 dark:text-stone-50">
            {safe(row?.reference) || "-"}
          </div>
        </div>
      </div>
    </button>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-5xl",
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-[2px]">
      <div
        className={cx(
          "max-h-[90vh] w-full overflow-y-auto rounded-[30px] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(2,6,23,0.22)] dark:border-stone-800 dark:bg-stone-900",
          maxWidth,
        )}
      >
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

function makeEmptyLine() {
  return {
    productId: "",
    productName: "",
    qtyOrdered: "1",
    unitCost: "",
    note: "",
  };
}

function buildCreateDefaults(suppliers, locations) {
  const firstSupplier = Array.isArray(suppliers) ? suppliers[0] : null;
  const firstLocation = Array.isArray(locations) ? locations[0] : null;

  return {
    supplierId: firstSupplier?.id ? String(firstSupplier.id) : "",
    locationId: firstLocation?.id ? String(firstLocation.id) : "",
    poNo: "",
    reference: "",
    currency: normalizeCurrency(firstSupplier?.defaultCurrency || "RWF"),
    orderedAt: "",
    expectedAt: "",
    notes: "",
    items: [makeEmptyLine()],
  };
}
function buildEditDefaults(purchaseOrder, items) {
  return {
    supplierId: purchaseOrder?.supplierId
      ? String(purchaseOrder.supplierId)
      : "",
    locationId: purchaseOrder?.locationId
      ? String(purchaseOrder.locationId)
      : "",
    poNo: safe(purchaseOrder?.poNo),
    reference: safe(purchaseOrder?.reference),
    currency: normalizeCurrency(purchaseOrder?.currency),
    orderedAt: purchaseOrder?.orderedAt
      ? String(purchaseOrder.orderedAt).slice(0, 10)
      : "",
    expectedAt: purchaseOrder?.expectedAt
      ? String(purchaseOrder.expectedAt).slice(0, 10)
      : "",
    notes: safe(purchaseOrder?.notes),
    items:
      Array.isArray(items) && items.length
        ? items.map((item) => ({
            productId: item?.productId != null ? String(item.productId) : "",
            productName: safe(item?.productName || item?.productDisplayName),
            qtyOrdered: String(safeNumber(item?.qtyOrdered) || 1),
            unitCost: String(safeNumber(item?.unitCost) || 0),
            note: safe(item?.note),
          }))
        : [makeEmptyLine()],
  };
}

function normalizeProductSearchText(product) {
  const name = safe(product?.name);
  const sku = safe(product?.sku);
  if (name && sku) return `${name} ${sku}`;
  return name || sku || "";
}

function ProductSearchPicker({ products = [], value = "", onSelect }) {
  const [query, setQuery] = useState("");

  const selectedProduct = useMemo(() => {
    return (
      (Array.isArray(products) ? products : []).find(
        (product) => String(product?.id) === String(value),
      ) || null
    );
  }, [products, value]);

  const filteredProducts = useMemo(() => {
    const rows = Array.isArray(products) ? products : [];
    const q = safe(query).toLowerCase();

    const activeRows = rows.filter((product) => product?.isActive !== false);

    if (!q) return activeRows.slice(0, 12);

    return activeRows
      .filter((product) =>
        normalizeProductSearchText(product).toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [products, query]);

  return (
    <div className="grid gap-3">
      <FormInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          selectedProduct
            ? `Selected: ${safe(selectedProduct.name)}${safe(selectedProduct.sku) ? ` (${safe(selectedProduct.sku)})` : ""}`
            : "Search by product name or SKU"
        }
      />

      <div className="max-h-56 overflow-auto rounded-[18px] border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900">
        <button
          type="button"
          onClick={() => {
            setQuery("");
            onSelect?.(null);
          }}
          className={cx(
            "mb-2 w-full rounded-[16px] border px-3 py-3 text-left transition",
            !value
              ? "border-stone-900 bg-stone-100 dark:border-stone-100 dark:bg-stone-950"
              : "border-stone-200 bg-stone-50 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-800",
          )}
        >
          <div className="text-sm font-semibold text-stone-950 dark:text-stone-50">
            Manual line / no linked product
          </div>
          <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Use this if the supplier item is not yet linked to a product.
          </div>
        </button>

        {filteredProducts.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-stone-300 px-3 py-4 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
            No matching product found.
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredProducts.map((product) => {
              const active = String(product?.id) === String(value);

              return (
                <button
                  key={String(product.id)}
                  type="button"
                  onClick={() => {
                    setQuery("");
                    onSelect?.(product);
                  }}
                  className={cx(
                    "w-full rounded-[16px] border px-3 py-3 text-left transition",
                    active
                      ? "border-stone-900 bg-stone-100 dark:border-stone-100 dark:bg-stone-950"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-800",
                  )}
                >
                  <div className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                    {safe(product?.name) || "Unnamed product"}
                  </div>
                  <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    {safe(product?.sku) ? `SKU: ${safe(product.sku)} • ` : ""}
                    Default cost: {money(product?.costPrice, "RWF")}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PurchaseOrderLineEditor({
  line,
  index,
  products,
  currency,
  onChange,
  onRemove,
  canRemove,
}) {
  const selectedProduct =
    Array.isArray(products) && line?.productId
      ? products.find((p) => String(p.id) === String(line.productId)) || null
      : null;

  const effectiveName = selectedProduct?.name || line?.productName || "";
  const effectiveCost =
    line?.unitCost !== ""
      ? safeNumber(line?.unitCost)
      : safeNumber(selectedProduct?.costPrice);

  const lineQty = safeNumber(line?.qtyOrdered) || 0;
  const lineTotal = lineQty * effectiveCost;

  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-stone-950 dark:text-stone-50">
          Line {index + 1}
        </div>

        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-[16px] border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Remove
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Search and choose product
          </label>
          <ProductSearchPicker
            products={products}
            value={line.productId}
            onSelect={(picked) => {
              if (!picked) {
                onChange({
                  ...line,
                  productId: "",
                });
                return;
              }

              onChange({
                ...line,
                productId: String(picked.id),
                productName: safe(picked.name),
                unitCost:
                  line?.unitCost !== "" && line?.unitCost != null
                    ? line.unitCost
                    : String(safeNumber(picked.costPrice) || 0),
              });
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Item name shown on the order
          </label>
          <FormInput
            value={line.productName}
            onChange={(e) =>
              onChange({ ...line, productName: e.target.value, productId: "" })
            }
            placeholder="What are you ordering?"
          />
          {selectedProduct ? (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Linked product: {effectiveName}
            </p>
          ) : (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              You can also keep this as a manual supplier item.
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Quantity to order
          </label>
          <FormInput
            type="number"
            min="1"
            value={line.qtyOrdered}
            onChange={(e) => onChange({ ...line, qtyOrdered: e.target.value })}
            placeholder="1"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Price for one item ({normalizeCurrency(currency)})
          </label>
          <FormInput
            type="number"
            min="0"
            value={line.unitCost}
            onChange={(e) => onChange({ ...line, unitCost: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Note
          </label>
          <FormInput
            value={line.note}
            onChange={(e) => onChange({ ...line, note: e.target.value })}
            placeholder="Optional line note"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoTile label="Item" value={effectiveName || "Manual line"} />
        <InfoTile label="Unit cost" value={money(effectiveCost, currency)} />
        <InfoTile label="Line total" value={money(lineTotal, currency)} />
      </div>
    </div>
  );
}

function buildReceiveDefaults(purchaseOrder, items) {
  return {
    locationId: purchaseOrder?.locationId
      ? String(purchaseOrder.locationId)
      : "",
    purchaseOrderId: purchaseOrder?.id ? String(purchaseOrder.id) : "",
    receiptNo: "",
    reference: "",
    receivedAt: "",
    note: "",
    items: (Array.isArray(items) ? items : [])
      .map((item) => {
        const qtyOrdered = safeNumber(item?.qtyOrdered);
        const qtyReceived = safeNumber(item?.qtyReceived);
        const remaining = Math.max(0, qtyOrdered - qtyReceived);

        if (remaining <= 0) return null;

        return {
          purchaseOrderItemId: String(item?.id || ""),
          productId: item?.productId != null ? String(item.productId) : "",
          productName: safe(item?.productDisplayName || item?.productName),
          qtyOrdered,
          qtyReceivedAlready: qtyReceived,
          qtyRemaining: remaining,
          qtyReceiveNow: String(remaining),
          purchaseUnit: safe(item?.purchaseUnit) || "PIECE",
          stockUnit: safe(item?.stockUnit) || "PIECE",
          purchaseUnitFactor: safeNumber(item?.purchaseUnitFactor) || 1,
          unitCost: safeNumber(item?.unitCost) || 0,
          note: "",
        };
      })
      .filter(Boolean),
  };
}

function ReceiveGoodsLineEditor({ line, currency, onChange }) {
  const qtyReceiveNow = safeNumber(line?.qtyReceiveNow) || 0;
  const lineTotal = qtyReceiveNow * (safeNumber(line?.unitCost) || 0);

  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black text-stone-950 dark:text-stone-50">
            {safe(line?.productName) || "Unknown item"}
          </div>
          <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            PO item #{safe(line?.purchaseOrderItemId) || "-"}
          </div>
        </div>

        <Pill tone={safeNumber(line?.qtyRemaining) > 0 ? "warn" : "neutral"}>
          Remaining {safeNumber(line?.qtyRemaining)}
        </Pill>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile
          label="Ordered"
          value={`${safeNumber(line?.qtyOrdered)} ${safe(line?.purchaseUnit) || ""}`.trim()}
        />
        <InfoTile
          label="Already received"
          value={`${safeNumber(line?.qtyReceivedAlready)} ${safe(line?.purchaseUnit) || ""}`.trim()}
        />
        <InfoTile
          label="Remaining"
          value={`${safeNumber(line?.qtyRemaining)} ${safe(line?.purchaseUnit) || ""}`.trim()}
        />
        <InfoTile label="Unit cost" value={money(line?.unitCost, currency)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Quantity to receive now ({safe(line?.purchaseUnit) || "PIECE"})
          </label>
          <FormInput
            type="number"
            min="0"
            max={String(safeNumber(line?.qtyRemaining))}
            value={line.qtyReceiveNow}
            onChange={(e) =>
              onChange({
                ...line,
                qtyReceiveNow: e.target.value,
              })
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Receipt note
          </label>
          <FormInput
            value={line.note}
            onChange={(e) =>
              onChange({
                ...line,
                note: e.target.value,
              })
            }
            placeholder="Optional note for this received line"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoTile
          label="Purchase unit factor"
          value={`${safeNumber(line?.purchaseUnitFactor)} ×`}
        />
        <InfoTile
          label={`Stock units added (${safe(line?.stockUnit) || "PIECE"})`}
          value={safeNumber(line?.purchaseUnitFactor) * qtyReceiveNow}
        />
        <InfoTile
          label="Line receipt value"
          value={money(lineTotal, currency)}
        />
      </div>
    </div>
  );
}

function buildPrintHtml({ purchaseOrder, items, locations = [] }) {
  const poRef = safe(purchaseOrder?.poNo) || `PO #${purchaseOrder?.id || "-"}`;
  const branch = displayBranch(purchaseOrder, locations);
  const notes = safe(purchaseOrder?.notes) || "No internal note recorded.";
  const rows = (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const name = safe(item?.productDisplayName || item?.productName) || "-";
      const sku = safe(item?.productSku) || "-";
      const qtyOrdered = safeNumber(item?.qtyOrdered);
      const qtyReceived = safeNumber(item?.qtyReceived);
      const unitCost = money(item?.unitCost, purchaseOrder?.currency);
      const lineTotal = money(item?.lineTotal, purchaseOrder?.currency);
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(sku)}</td>
          <td>${qtyOrdered}</td>
          <td>${qtyReceived}</td>
          <td>${escapeHtml(unitCost)}</td>
          <td>${escapeHtml(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(poRef)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 32px; color: #111827; }
    .top { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
    .title { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
    .muted { color: #6b7280; font-size: 12px; }
    .pill { display: inline-block; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-right: 8px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
    .card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px; }
    .label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 800; letter-spacing: .08em; }
    .value { margin-top: 8px; font-size: 14px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; vertical-align: top; }
    th { background: #f9fafb; text-transform: uppercase; font-size: 11px; letter-spacing: .06em; }
    .section-title { margin-top: 28px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
    .note { border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px; margin-top: 10px; font-size: 13px; white-space: pre-wrap; }
    .totals { margin-top: 20px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    @media print { body { margin: 18px; } }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <div class="title">Purchase Order</div>
      <div class="muted">Reference: ${escapeHtml(poRef)}</div>
    </div>
    <div>
      <span class="pill">${escapeHtml(safe(purchaseOrder?.status) || "DRAFT")}</span>
      <span class="pill">${escapeHtml(normalizeCurrency(purchaseOrder?.currency))}</span>
    </div>
  </div>

  <div class="grid">
    <div class="card"><div class="label">Supplier</div><div class="value">${escapeHtml(safe(purchaseOrder?.supplierName) || "-")}</div></div>
    <div class="card"><div class="label">Branch</div><div class="value">${escapeHtml(branch)}</div></div>
    <div class="card"><div class="label">Ordered date</div><div class="value">${escapeHtml(safeDate(purchaseOrder?.orderedAt))}</div></div>
    <div class="card"><div class="label">Expected date</div><div class="value">${escapeHtml(safeDate(purchaseOrder?.expectedAt))}</div></div>
    <div class="card"><div class="label">Approved at</div><div class="value">${escapeHtml(safeDate(purchaseOrder?.approvedAt))}</div></div>
    <div class="card"><div class="label">Created by</div><div class="value">${escapeHtml(safe(purchaseOrder?.createdByName) || (purchaseOrder?.createdByUserId != null ? `User #${purchaseOrder.createdByUserId}` : "-"))}</div></div>
  </div>

  <div class="section-title">Order lines</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th>SKU</th>
        <th>Qty ordered</th>
        <th>Qty received</th>
        <th>Unit cost</th>
        <th>Line total</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="7">No purchase order lines found.</td></tr>`}
    </tbody>
  </table>

  <div class="totals">
    <div class="card"><div class="label">Items count</div><div class="value">${safeNumber(purchaseOrder?.itemsCount)}</div></div>
    <div class="card"><div class="label">Qty ordered total</div><div class="value">${safeNumber(purchaseOrder?.qtyOrderedTotal)}</div></div>
    <div class="card"><div class="label">Qty received total</div><div class="value">${safeNumber(purchaseOrder?.qtyReceivedTotal)}</div></div>
    <div class="card"><div class="label">Subtotal</div><div class="value">${escapeHtml(money(purchaseOrder?.subtotalAmount, purchaseOrder?.currency))}</div></div>
    <div class="card"><div class="label">Total</div><div class="value">${escapeHtml(money(purchaseOrder?.totalAmount, purchaseOrder?.currency))}</div></div>
    <div class="card"><div class="label">Reference</div><div class="value">${escapeHtml(safe(purchaseOrder?.reference) || "-")}</div></div>
  </div>

  <div class="section-title">Internal note</div>
  <div class="note">${escapeHtml(notes)}</div>
</body>
</html>
  `;
}

function openPurchaseOrderPrintWindow({
  purchaseOrder,
  items,
  locations = [],
}) {
  if (typeof window === "undefined") return;

  const html = buildPrintHtml({ purchaseOrder, items, locations });
  const printWindow = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=1100,height=800",
  );
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    try {
      printWindow.print();
    } catch {
      // ignore
    }
  }, 250);
}

function CreatePurchaseOrderModal({
  open,
  suppliers,
  locations,
  products,
  onClose,
  onSaved,
}) {
  if (!open) return null;

  return (
    <CreatePurchaseOrderModalInner
      key={`create-po-${suppliers?.length || 0}-${locations?.length || 0}`}
      suppliers={suppliers}
      locations={locations}
      products={products}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function pad2(v) {
  return String(v).padStart(2, "0");
}

function buildAutoCodeDatePart(date = new Date()) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}${month}${day}`;
}

function buildAutoCodeBranchPart(locationCode = "") {
  return (
    safe(locationCode || "MAIN")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 8) || "MAIN"
  );
}

function buildAutoCode(
  prefix,
  locationCode = "",
  sequence = 1,
  date = new Date(),
) {
  const branchPart = buildAutoCodeBranchPart(locationCode);
  const datePart = buildAutoCodeDatePart(date);
  const seqPart = String(Math.max(1, safeNumber(sequence) || 1)).padStart(
    4,
    "0",
  );
  return `${prefix}-${branchPart}-${datePart}-${seqPart}`;
}

function padSequence(value, size = 3) {
  return String(Math.max(1, Number(value) || 1)).padStart(size, "0");
}

function formatCodeDate(value) {
  const raw = String(value || "").trim();

  if (raw) {
    const direct = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (direct) {
      return `${direct[1]}${direct[2]}${direct[3]}`;
    }

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

function formatIsoDay(value) {
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

function makeAutoPoNo(locationCode, sequence, codeDate) {
  const branch = safe(locationCode || "BRANCH").toUpperCase();
  return `PO-${branch}-${codeDate}-${padSequence(sequence, 3)}`;
}

function makeAutoReference(locationCode, sequence, codeDate) {
  const branch = safe(locationCode || "BRANCH").toUpperCase();
  return `REF-${branch}-${codeDate}-${padSequence(sequence, 3)}`;
}

async function buildNextAutoCodes({ locationId, locations, orderedAt = "" }) {
  const branchCode = findLocationCode(locations, locationId) || "BRANCH";
  const isoDay = formatIsoDay(orderedAt);
  const codeDate = formatCodeDate(orderedAt);

  const params = new URLSearchParams();
  params.set("locationId", String(locationId));
  params.set("from", isoDay);
  params.set("to", isoDay);
  params.set("limit", "200");

  const result = await apiFetch(`/purchase-orders?${params.toString()}`, {
    method: "GET",
  });

  const rows = normalizePurchaseOrdersResponse(result)
    .map(normalizePurchaseOrder)
    .filter(Boolean);

  const sameDayRows = rows.filter((row) => {
    if (String(row?.locationId || "") !== String(locationId)) return false;
    return formatIsoDay(row?.orderedAt) === isoDay;
  });

  const nextSequence = sameDayRows.length + 1;

  return {
    poNo: makeAutoPoNo(branchCode, nextSequence, codeDate),
    reference: makeAutoReference(branchCode, nextSequence, codeDate),
  };
}

function extractAutoCodeSequence(
  value = "",
  prefix = "",
  locationCode = "",
  date = new Date(),
) {
  const branchPart = buildAutoCodeBranchPart(locationCode);
  const datePart = buildAutoCodeDatePart(date);
  const expectedPrefix = `${prefix}-${branchPart}-${datePart}-`;
  const raw = safe(value);

  if (!raw.startsWith(expectedPrefix)) return 0;

  const tail = raw.slice(expectedPrefix.length);
  const seq = Number(tail);
  return Number.isInteger(seq) && seq > 0 ? seq : 0;
}

function findLocationCode(locations = [], locationId = "") {
  const row =
    (Array.isArray(locations) ? locations : []).find(
      (item) => String(item?.id) === String(locationId),
    ) || null;

  return safe(row?.code) || safe(row?.name) || "MAIN";
}

function CreatePurchaseOrderModalInner({
  suppliers,
  locations,
  products,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() =>
    buildCreateDefaults(suppliers, locations),
  );
  const [errorText, setErrorText] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const selectedSupplier = useMemo(
    () =>
      (Array.isArray(suppliers) ? suppliers : []).find(
        (row) => String(row.id) === String(form.supplierId),
      ) || null,
    [suppliers, form.supplierId],
  );

  const effectiveCurrency = selectedSupplier?.defaultCurrency
    ? normalizeCurrency(selectedSupplier.defaultCurrency)
    : normalizeCurrency(form.currency);

  const formItems = Array.isArray(form.items) ? form.items : [];

  const subtotal = formItems.reduce((sum, line) => {
    const qty = safeNumber(line?.qtyOrdered) || 0;
    const unitCost = safeNumber(line?.unitCost) || 0;
    return sum + qty * unitCost;
  }, 0);

  function updateLine(index, nextLine) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? nextLine : item)),
    }));
  }

  function addLine() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, makeEmptyLine()],
    }));
  }

  function removeLine(index) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  }

  function handleLocationChange(nextLocationId) {
    setForm((prev) => {
      if (String(prev.locationId || "") === String(nextLocationId || "")) {
        return prev;
      }

      return {
        ...prev,
        locationId: nextLocationId,
        poNo: "",
        reference: "",
      };
    });
  }

  useEffect(() => {
    let alive = true;

    const currentLocationId = String(form.locationId || "").trim();
    const currentOrderedAt = String(form.orderedAt || "").trim();

    async function refreshAutoCodes() {
      if (!currentLocationId) {
        setForm((prev) => ({
          ...prev,
          poNo: "",
          reference: "",
        }));
        return;
      }

      setCodeLoading(true);
      setErrorText("");

      try {
        const nextCodes = await buildNextAutoCodes({
          locationId: currentLocationId,
          locations,
          orderedAt: currentOrderedAt,
        });

        if (!alive) return;

        setForm((prev) => {
          if (String(prev.locationId || "").trim() !== currentLocationId) {
            return prev;
          }

          if (String(prev.orderedAt || "").trim() !== currentOrderedAt) {
            return prev;
          }

          const nextPoNo = safe(nextCodes?.poNo);
          const nextReference = safe(nextCodes?.reference);

          if (
            nextPoNo === safe(prev.poNo) &&
            nextReference === safe(prev.reference)
          ) {
            return prev;
          }

          return {
            ...prev,
            poNo: nextPoNo,
            reference: nextReference,
          };
        });
      } catch (e) {
        if (!alive) return;
        setErrorText(
          e?.data?.error ||
            e?.message ||
            "Failed to generate purchase order codes.",
        );
      } finally {
        if (alive) setCodeLoading(false);
      }
    }

    refreshAutoCodes();

    return () => {
      alive = false;
    };
  }, [form.locationId, form.orderedAt, locations]);

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
        setErrorText("Please choose the branch receiving this order.");
        return;
      }

      if (!formItems.length) {
        setErrorText("Please add at least one order line.");
        return;
      }

      if (codeLoading) {
        setErrorText(
          "Please wait a moment for the order number and reference to finish generating.",
        );
        return;
      }

      if (!safe(form.poNo) || !safe(form.reference)) {
        setErrorText(
          "Please wait a moment for the order number and reference to finish generating.",
        );
        return;
      }

      const normalizedItems = formItems.map((line) => ({
        ...(line.productId ? { productId: Number(line.productId) } : {}),
        ...(safe(line.productName)
          ? { productName: safe(line.productName) }
          : {}),
        qtyOrdered: Number(line.qtyOrdered),
        unitCost: Number(line.unitCost),
        ...(safe(line.note) ? { note: safe(line.note) } : {}),
      }));

      const invalidLine = normalizedItems.find(
        (line) =>
          !Number.isFinite(line.qtyOrdered) ||
          line.qtyOrdered <= 0 ||
          !Number.isFinite(line.unitCost) ||
          line.unitCost < 0 ||
          (!line.productId && !safe(line.productName)),
      );

      if (invalidLine) {
        setErrorText(
          "Please make sure every line has a product or item name, a valid quantity, and a valid unit cost.",
        );
        return;
      }

      const payload = {
        supplierId: Number(form.supplierId),
        locationId: Number(form.locationId),
        poNo: safe(form.poNo),
        reference: safe(form.reference),
        currency: effectiveCurrency || undefined,
        orderedAt: form.orderedAt || undefined,
        expectedAt: form.expectedAt || undefined,
        notes: safe(form.notes) || undefined,
        items: normalizedItems,
      };

      const result = await apiFetch("/purchase-orders", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      const msg =
        e?.data?.error || e?.message || "Failed to create purchase order";

      if (String(msg).toLowerCase().includes("forbidden")) {
        setErrorText(
          "You do not have permission to create purchase orders with this account. The backend is blocking POST /purchase-orders.",
        );
        return;
      }

      setErrorText(msg);
    }
  }

  return (
    <ModalShell
      title="Create purchase order"
      subtitle="Prepare what will be ordered, from which supplier, for which branch."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-4">
          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              Purchase order details
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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
                    }))
                  }
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
                      {safe(row.name)}
                      {safe(row.code) ? ` (${safe(row.code)})` : ""}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Purchase order number (automatic)
                </label>
                <FormInput
                  value={form.poNo}
                  readOnly
                  disabled
                  placeholder={codeLoading ? "Generating..." : "Auto-generated"}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Reference (automatic)
                </label>
                <FormInput
                  value={form.reference}
                  readOnly
                  disabled
                  placeholder={codeLoading ? "Generating..." : "Auto-generated"}
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
                  disabled={!!selectedSupplier?.defaultCurrency}
                >
                  <option value="RWF">RWF</option>
                  <option value="USD">USD</option>
                </FormSelect>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Ordered date
                </label>
                <FormInput
                  type="date"
                  value={form.orderedAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, orderedAt: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Expected date
                </label>
                <FormInput
                  type="date"
                  value={form.expectedAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expectedAt: e.target.value }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Internal note
                </label>
                <FormTextarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Why are we ordering this, any supplier instructions, urgency, or branch note"
                />
              </div>
            </div>
          </Surface>

          <Surface>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Order lines
                </div>
                <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Add linked products or manual lines for supplier-specific
                  items.
                </div>
              </div>

              <button
                type="button"
                onClick={addLine}
                className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Add line
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              {formItems.map((line, index) => (
                <PurchaseOrderLineEditor
                  key={`create-line-${index}`}
                  line={line}
                  index={index}
                  products={products}
                  currency={effectiveCurrency}
                  onChange={(next) => updateLine(index, next)}
                  onRemove={() => removeLine(index)}
                  canRemove={formItems.length > 1}
                />
              ))}
            </div>
          </Surface>
        </div>

        <div className="grid gap-4">
          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              Order preview
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetricCard
                label="Supplier"
                value={selectedSupplier?.name || "Not selected"}
                sub={selectedSupplier?.defaultCurrency || "No default currency"}
              />
              <MetricCard
                label="Branch"
                value={
                  findLocationMeta(locations, form.locationId)?.name ||
                  "Not selected"
                }
                sub={findLocationMeta(locations, form.locationId)?.code || "-"}
              />
              <MetricCard
                label="Lines"
                value={safeNumber(formItems.length)}
                sub="Items on this PO"
              />
              <MetricCard
                label={`Total (${effectiveCurrency})`}
                value={money(subtotal, effectiveCurrency)}
                sub="Estimated order total"
              />
            </div>
          </Surface>

          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              Ready to save
            </div>

            <div className="mt-4 space-y-3 text-sm text-stone-600 dark:text-stone-400">
              <p>
                The purchase order will be created as <b>DRAFT</b>.
              </p>
              <p>
                After review, it can be approved before stock starts arriving.
              </p>
              <p>
                The order number and reference are generated automatically from
                the selected branch and order date.
              </p>
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
                idleText="Create purchase order"
                loadingText={codeLoading ? "Preparing..." : "Creating..."}
                successText="Created"
                onClick={handleSave}
              />
            </div>
          </Surface>
        </div>
      </div>
    </ModalShell>
  );
}

function EditPurchaseOrderModal({
  open,
  purchaseOrder,
  items,
  suppliers,
  locations,
  products,
  onClose,
  onSaved,
}) {
  if (!open || !purchaseOrder) return null;

  return (
    <EditPurchaseOrderModalInner
      key={`edit-po-${purchaseOrder.id}-${purchaseOrder.updatedAt || ""}`}
      purchaseOrder={purchaseOrder}
      items={items}
      suppliers={suppliers}
      locations={locations}
      products={products}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function EditPurchaseOrderModalInner({
  purchaseOrder,
  items,
  suppliers,
  locations,
  products,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() =>
    buildEditDefaults(purchaseOrder, items),
  );
  const [errorText, setErrorText] = useState("");

  const statusUpper = safe(purchaseOrder?.status).toUpperCase();
  const linesLocked = statusUpper !== "DRAFT";

  const selectedSupplier = useMemo(
    () =>
      (Array.isArray(suppliers) ? suppliers : []).find(
        (row) => String(row.id) === String(form.supplierId),
      ) || null,
    [suppliers, form.supplierId],
  );

  const effectiveCurrency = selectedSupplier?.defaultCurrency
    ? normalizeCurrency(selectedSupplier.defaultCurrency)
    : normalizeCurrency(form.currency);

  const formItems = Array.isArray(form.items) ? form.items : [];
  const subtotal = formItems.reduce((sum, line) => {
    const qty = safeNumber(line?.qtyOrdered) || 0;
    const unitCost = safeNumber(line?.unitCost) || 0;
    return sum + qty * unitCost;
  }, 0);

  function updateLine(index, nextLine) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? nextLine : item)),
    }));
  }

  function addLine() {
    if (linesLocked) return;
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, makeEmptyLine()],
    }));
  }

  function removeLine(index) {
    if (linesLocked) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  }

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        supplierId: Number(form.supplierId),
        poNo: safe(form.poNo) || undefined,
        reference: safe(form.reference) || undefined,
        currency: effectiveCurrency || undefined,
        orderedAt: form.orderedAt || undefined,
        expectedAt: form.expectedAt || undefined,
        notes: safe(form.notes) || undefined,
        ...(linesLocked
          ? {}
          : {
              items: formItems.map((line) => ({
                ...(line.productId
                  ? { productId: Number(line.productId) }
                  : {}),
                ...(safe(line.productName)
                  ? { productName: safe(line.productName) }
                  : {}),
                qtyOrdered: Number(line.qtyOrdered),
                unitCost: Number(line.unitCost),
                ...(safe(line.note) ? { note: safe(line.note) } : {}),
              })),
            }),
      };

      const result = await apiFetch(`/purchase-orders/${purchaseOrder.id}`, {
        method: "PATCH",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to update purchase order",
      );
    }
  }

  return (
    <ModalShell
      title={`Edit purchase order ${safe(purchaseOrder?.poNo) || `#${purchaseOrder?.id}`}`}
      subtitle={
        linesLocked
          ? "This purchase order is already approved, so only header details can be adjusted."
          : "Update supplier, references, dates, notes, and order lines."
      }
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-4">
          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              Purchase order details
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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
                <FormInput
                  value={displayBranch(purchaseOrder, locations)}
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Purchase order number
                </label>
                <FormInput
                  value={form.poNo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, poNo: e.target.value }))
                  }
                  placeholder="Example: PO-2026-001"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Reference (automatic)
                </label>
                <FormInput
                  value={form.reference}
                  readOnly
                  disabled
                  placeholder="Auto-generated"
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
                  disabled={!!selectedSupplier?.defaultCurrency}
                >
                  <option value="RWF">RWF</option>
                  <option value="USD">USD</option>
                </FormSelect>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Ordered date
                </label>
                <FormInput
                  type="date"
                  value={form.orderedAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, orderedAt: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Expected date
                </label>
                <FormInput
                  type="date"
                  value={form.expectedAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expectedAt: e.target.value }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Internal note
                </label>
                <FormTextarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Why are we ordering this, any supplier instructions, urgency, or branch note"
                />
              </div>
            </div>
          </Surface>

          <Surface>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Order lines
                </div>
                <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {linesLocked
                    ? "Approved purchase order lines are locked."
                    : "Update order lines before saving."}
                </div>
              </div>

              {!linesLocked ? (
                <button
                  type="button"
                  onClick={addLine}
                  className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  Add line
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4">
              {formItems.map((line, index) => (
                <PurchaseOrderLineEditor
                  key={`edit-line-${index}`}
                  line={line}
                  index={index}
                  products={products}
                  currency={effectiveCurrency}
                  onChange={(next) => updateLine(index, next)}
                  onRemove={() => removeLine(index)}
                  canRemove={!linesLocked && formItems.length > 1}
                />
              ))}
            </div>
          </Surface>
        </div>

        <div className="grid gap-4">
          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              Order preview
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetricCard
                label="Status"
                value={safe(purchaseOrder?.status) || "DRAFT"}
                sub={linesLocked ? "Lines locked" : "Lines editable"}
                tone={statusUpper === "CANCELLED" ? "danger" : "default"}
              />
              <MetricCard
                label="Supplier"
                value={selectedSupplier?.name || "Not selected"}
                sub={selectedSupplier?.defaultCurrency || "No default currency"}
              />
              <MetricCard
                label="Lines"
                value={safeNumber(formItems.length)}
                sub="Items on this PO"
              />
              <MetricCard
                label={`Total (${effectiveCurrency})`}
                value={money(subtotal, effectiveCurrency)}
                sub="Estimated order total"
              />
            </div>
          </Surface>

          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              Save changes
            </div>

            <div className="mt-4 space-y-3 text-sm text-stone-600 dark:text-stone-400">
              <p>
                Keep order numbers and references readable for non-technical
                staff.
              </p>
              {linesLocked ? (
                <p>
                  This order is already approved, so only supplier, reference,
                  dates, currency, and notes can change.
                </p>
              ) : (
                <p>Draft orders can still be cleaned up before approval.</p>
              )}
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
                idleText="Save purchase order"
                loadingText="Saving..."
                successText="Saved"
                onClick={handleSave}
              />
            </div>
          </Surface>
        </div>
      </div>
    </ModalShell>
  );
}

function ApprovePurchaseOrderModal({ open, purchaseOrder, onClose, onSaved }) {
  const [errorText, setErrorText] = useState("");

  if (!open || !purchaseOrder) return null;

  async function handleApprove() {
    setErrorText("");

    try {
      const result = await apiFetch(
        `/purchase-orders/${purchaseOrder.id}/approve`,
        {
          method: "POST",
          body: {},
        },
      );

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to approve purchase order",
      );
    }
  }

  return (
    <ModalShell
      title={`Approve ${safe(purchaseOrder?.poNo) || `PO #${purchaseOrder?.id}`}`}
      subtitle="Approving confirms this purchase order is ready for real procurement work."
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <AlertBox message={errorText} />

      <Surface>
        <div className="text-sm text-stone-700 dark:text-stone-300">
          Supplier: <b>{safe(purchaseOrder?.supplierName) || "-"}</b>
          <br />
          Branch: <b>{displayBranch(purchaseOrder)}</b>
          <br />
          Total:{" "}
          <b>{money(purchaseOrder?.totalAmount, purchaseOrder?.currency)}</b>
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
          idleText="Approve purchase order"
          loadingText="Approving..."
          successText="Approved"
          onClick={handleApprove}
        />
      </div>
    </ModalShell>
  );
}

function CancelPurchaseOrderModal({ open, purchaseOrder, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState("");

  if (!open || !purchaseOrder) return null;

  async function handleCancel() {
    setErrorText("");

    try {
      const result = await apiFetch(
        `/purchase-orders/${purchaseOrder.id}/cancel`,
        {
          method: "POST",
          body: {
            reason: safe(reason) || undefined,
          },
        },
      );

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to cancel purchase order",
      );
    }
  }

  return (
    <ModalShell
      title={`Cancel ${safe(purchaseOrder?.poNo) || `PO #${purchaseOrder?.id}`}`}
      subtitle="Only cancel if this purchase order should no longer be used."
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <AlertBox message={errorText} />

      <Surface className="bg-rose-50 dark:bg-rose-950/20">
        <div className="text-sm text-rose-800 dark:text-rose-200">
          Supplier: <strong>{safe(purchaseOrder?.supplierName) || "-"}</strong>
          <br />
          Total:{" "}
          <strong>
            {money(purchaseOrder?.totalAmount, purchaseOrder?.currency)}
          </strong>
        </div>
      </Surface>

      <div className="mt-4">
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
          Reason
        </label>
        <FormTextarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this purchase order being cancelled?"
        />
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Back
        </button>

        <AsyncButton
          idleText="Cancel purchase order"
          loadingText="Cancelling..."
          successText="Cancelled"
          onClick={handleCancel}
          variant="secondary"
        />
      </div>
    </ModalShell>
  );
}

function ReceiveGoodsModal({
  open,
  purchaseOrder,
  items,
  locations,
  onClose,
  onSaved,
}) {
  if (!open || !purchaseOrder) return null;

  return (
    <ReceiveGoodsModalInner
      key={`receive-po-${purchaseOrder.id}-${purchaseOrder.updatedAt || ""}`}
      purchaseOrder={purchaseOrder}
      items={items}
      locations={locations}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function ReceiveGoodsModalInner({
  purchaseOrder,
  items,
  locations,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() =>
    buildReceiveDefaults(purchaseOrder, items),
  );
  const [errorText, setErrorText] = useState("");

  const receiveLines = Array.isArray(form.items) ? form.items : [];
  const activeLines = receiveLines.filter(
    (line) => safeNumber(line?.qtyReceiveNow) > 0,
  );

  const totalPurchaseUnits = activeLines.reduce(
    (sum, line) => sum + (safeNumber(line?.qtyReceiveNow) || 0),
    0,
  );

  const totalStockUnits = activeLines.reduce(
    (sum, line) =>
      sum +
      (safeNumber(line?.qtyReceiveNow) || 0) *
        (safeNumber(line?.purchaseUnitFactor) || 1),
    0,
  );

  const totalAmount = activeLines.reduce(
    (sum, line) =>
      sum +
      (safeNumber(line?.qtyReceiveNow) || 0) *
        (safeNumber(line?.unitCost) || 0),
    0,
  );

  function updateReceiveLine(index, nextLine) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? nextLine : item)),
    }));
  }

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        locationId: Number(form.locationId),
        purchaseOrderId: Number(form.purchaseOrderId),
        receiptNo: safe(form.receiptNo) || undefined,
        reference: safe(form.reference) || undefined,
        note: safe(form.note) || undefined,
        receivedAt: form.receivedAt || undefined,
        items: activeLines.map((line) => ({
          purchaseOrderItemId: Number(line.purchaseOrderItemId),
          qtyReceived: Number(line.qtyReceiveNow),
          ...(safe(line.note) ? { note: safe(line.note) } : {}),
        })),
      };

      const result = await apiFetch("/goods-receipts", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to receive goods");
    }
  }

  return (
    <ModalShell
      title={`Receive goods for ${safe(purchaseOrder?.poNo) || `PO #${purchaseOrder?.id}`}`}
      subtitle="Record what has actually arrived so stock and purchase order progress stay correct."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-4">
          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              Receipt details
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Supplier
                </label>
                <FormInput
                  value={safe(purchaseOrder?.supplierName) || "-"}
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Branch
                </label>
                <FormInput
                  value={displayBranch(purchaseOrder, locations)}
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Receipt number
                </label>
                <FormInput
                  value={form.receiptNo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, receiptNo: e.target.value }))
                  }
                  placeholder="Example: GR-2026-001"
                />
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
                  placeholder="Delivery note number, truck note, or supplier reference"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Received date
                </label>
                <FormInput
                  type="date"
                  value={form.receivedAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, receivedAt: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Purchase order
                </label>
                <FormInput
                  value={
                    safe(purchaseOrder?.poNo) || `PO #${purchaseOrder?.id}`
                  }
                  readOnly
                  disabled
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Receipt note
                </label>
                <FormTextarea
                  rows={4}
                  value={form.note}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="What arrived, condition of goods, delays, shortages, or receiving comments"
                />
              </div>
            </div>
          </Surface>

          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              Lines to receive
            </div>
            <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Enter only what has physically arrived now. Leave zero for lines
              not received yet.
            </div>

            <div className="mt-4 grid gap-4">
              {receiveLines.length === 0 ? (
                <EmptyState text="All order lines are already fully received." />
              ) : (
                receiveLines.map((line, index) => (
                  <ReceiveGoodsLineEditor
                    key={`receive-line-${line.purchaseOrderItemId}-${index}`}
                    line={line}
                    currency={purchaseOrder?.currency}
                    onChange={(next) => updateReceiveLine(index, next)}
                  />
                ))
              )}
            </div>
          </Surface>
        </div>

        <div className="grid gap-4">
          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              Receipt summary
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetricCard
                label="Active lines"
                value={safeNumber(activeLines.length)}
                sub="Lines being received now"
              />
              <MetricCard
                label="Purchase units"
                value={safeNumber(totalPurchaseUnits)}
                sub="Units in supplier purchase measure"
              />
              <MetricCard
                label="Stock units"
                value={safeNumber(totalStockUnits)}
                sub="What will be added to stock"
              />
              <MetricCard
                label={`Receipt value (${normalizeCurrency(purchaseOrder?.currency)})`}
                value={money(totalAmount, purchaseOrder?.currency)}
                sub="Estimated value of this receipt"
              />
            </div>
          </Surface>

          <Surface>
            <div className="text-sm font-black text-stone-950 dark:text-stone-50">
              What happens after save
            </div>

            <div className="mt-4 space-y-3 text-sm text-stone-600 dark:text-stone-400">
              <p>
                The selected quantities will increase inventory for this branch.
              </p>
              <p>
                The purchase order received quantities will be updated
                automatically.
              </p>
              <p>
                The purchase order status will move to <b>Partially received</b>{" "}
                or <b>Received</b> based on totals.
              </p>
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
                idleText="Receive goods"
                loadingText="Receiving..."
                successText="Received"
                onClick={handleSave}
              />
            </div>
          </Surface>
        </div>
      </div>
    </ModalShell>
  );
}

function PreviewPurchaseOrderModal({
  open,
  purchaseOrder,
  items,
  locations,
  onClose,
}) {
  if (!open || !purchaseOrder) return null;

  return (
    <ModalShell
      title={`Preview ${safe(purchaseOrder?.poNo) || `PO #${purchaseOrder?.id}`}`}
      subtitle="Use Print or Download PDF to open the browser print dialog. Choose Save as PDF there if you want a PDF file."
      onClose={onClose}
      maxWidth="max-w-6xl"
    >
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            openPurchaseOrderPrintWindow({ purchaseOrder, items, locations })
          }
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Print
        </button>
        <button
          type="button"
          onClick={() =>
            openPurchaseOrderPrintWindow({ purchaseOrder, items, locations })
          }
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Download PDF
        </button>
      </div>

      <div className="mt-4 rounded-[28px] border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-950">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5 dark:border-stone-800">
          <div>
            <div className="text-2xl font-black text-stone-950 dark:text-stone-50">
              Purchase Order
            </div>
            <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {safe(purchaseOrder?.poNo) || `PO #${purchaseOrder?.id}`}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={statusTone(purchaseOrder?.status)}>
              {safe(purchaseOrder?.status) || "DRAFT"}
            </Pill>
            <Pill tone="neutral">
              {normalizeCurrency(purchaseOrder?.currency)}
            </Pill>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InfoTile
            label="Supplier"
            value={safe(purchaseOrder?.supplierName) || "-"}
          />
          <InfoTile
            label="Branch"
            value={displayBranch(purchaseOrder, locations)}
          />
          <InfoTile
            label="Reference"
            value={safe(purchaseOrder?.reference) || "-"}
          />
          <InfoTile
            label="Ordered date"
            value={safeDate(purchaseOrder?.orderedAt)}
          />
          <InfoTile
            label="Expected date"
            value={safeDate(purchaseOrder?.expectedAt)}
          />
          <InfoTile
            label="Approved at"
            value={safeDate(purchaseOrder?.approvedAt)}
          />
          <InfoTile
            label="Created by"
            value={
              safe(purchaseOrder?.createdByName) ||
              (purchaseOrder?.createdByUserId != null
                ? `User #${purchaseOrder.createdByUserId}`
                : "-")
            }
          />
          <InfoTile
            label="Items count"
            value={safeNumber(purchaseOrder?.itemsCount)}
          />
          <InfoTile
            label={`Total (${normalizeCurrency(purchaseOrder?.currency)})`}
            value={money(purchaseOrder?.totalAmount, purchaseOrder?.currency)}
          />
        </div>

        <div className="mt-6">
          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Order lines
          </div>

          {(Array.isArray(items) ? items : []).length === 0 ? (
            <div className="mt-4">
              <EmptyState text="No purchase order lines found." />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-[22px] border border-stone-200 dark:border-stone-800">
              <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-800">
                <thead className="bg-stone-100 dark:bg-stone-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Qty ordered
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Qty received
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Unit cost
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white dark:divide-stone-800 dark:bg-stone-950">
                  {items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-stone-950 dark:text-stone-50">
                        {safe(item?.productDisplayName || item?.productName) ||
                          "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">
                        {safe(item?.productSku) || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">
                        {safeNumber(item?.qtyOrdered)}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">
                        {safeNumber(item?.qtyReceived)}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">
                        {money(item?.unitCost, purchaseOrder?.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">
                        {money(item?.lineTotal, purchaseOrder?.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Qty ordered total"
            value={safeNumber(purchaseOrder?.qtyOrderedTotal)}
            sub="All lines"
          />
          <MetricCard
            label="Qty received total"
            value={safeNumber(purchaseOrder?.qtyReceivedTotal)}
            sub="All receipts so far"
          />
          <MetricCard
            label={`Subtotal (${normalizeCurrency(purchaseOrder?.currency)})`}
            value={money(
              purchaseOrder?.subtotalAmount,
              purchaseOrder?.currency,
            )}
            sub="Before total"
          />
          <MetricCard
            label={`Total (${normalizeCurrency(purchaseOrder?.currency)})`}
            value={money(purchaseOrder?.totalAmount, purchaseOrder?.currency)}
            sub="Purchase order value"
          />
        </div>

        <div className="mt-6">
          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Internal note
          </div>
          <div className="mt-3 rounded-[20px] border border-stone-200 bg-white p-4 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
            {safe(purchaseOrder?.notes) || "No internal note recorded."}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export default function OwnerPurchaseOrdersTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState("");
  const [purchaseOrderDetail, setPurchaseOrderDetail] = useState({
    purchaseOrder: null,
    items: [],
  });
  const [detailLoading, setDetailLoading] = useState(false);

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [creatingPurchaseOrder, setCreatingPurchaseOrder] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState(null);
  const [approvingPurchaseOrder, setApprovingPurchaseOrder] = useState(null);
  const [cancellingPurchaseOrder, setCancellingPurchaseOrder] = useState(null);
  const [receivingPurchaseOrder, setReceivingPurchaseOrder] = useState(null);
  const [previewingPurchaseOrder, setPreviewingPurchaseOrder] = useState(null);

  const selectedPurchaseOrder = !selectedPurchaseOrderId
    ? null
    : purchaseOrders.find(
        (row) => String(row.id) === String(selectedPurchaseOrderId),
      ) || null;

  const detailPurchaseOrder =
    purchaseOrderDetail?.purchaseOrder || selectedPurchaseOrder || null;

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const summary = useMemo(() => {
    return purchaseOrders.reduce(
      (acc, row) => {
        const statusUpper = safe(row?.status).toUpperCase();
        acc.totalCount += 1;
        acc.totalAmount += safeNumber(row?.totalAmount);

        if (statusUpper === "DRAFT") acc.draftCount += 1;
        if (statusUpper === "APPROVED") acc.approvedCount += 1;
        if (statusUpper === "PARTIALLY_RECEIVED") acc.partialCount += 1;
        if (statusUpper === "RECEIVED") acc.receivedCount += 1;
        if (statusUpper === "CANCELLED") acc.cancelledCount += 1;

        return acc;
      },
      {
        totalCount: 0,
        totalAmount: 0,
        draftCount: 0,
        approvedCount: 0,
        partialCount: 0,
        receivedCount: 0,
        cancelledCount: 0,
      },
    );
  }, [purchaseOrders]);

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

  async function loadProductOptions() {
    try {
      const result = await apiFetch(`/owner/products?limit=300`, {
        method: "GET",
      });

      const rows = Array.isArray(result?.products)
        ? result.products
        : Array.isArray(result?.items)
          ? result.items
          : Array.isArray(result?.rows)
            ? result.rows
            : [];

      setProductOptions(rows.map(normalizeProduct).filter(Boolean));
    } catch {
      setProductOptions([]);
    }
  }

  async function loadList() {
    setLoading(true);
    setErrorText("");

    try {
      const params = new URLSearchParams();

      if (q) params.set("q", q);
      if (locationId) params.set("locationId", locationId);
      if (supplierId) params.set("supplierId", supplierId);
      if (status) params.set("status", status);

      const suffix = params.toString() ? `?${params.toString()}` : "";

      const result = await apiFetch(`/purchase-orders${suffix}`, {
        method: "GET",
      });

      const rows = normalizePurchaseOrdersResponse(result)
        .map(normalizePurchaseOrder)
        .filter(Boolean);

      setPurchaseOrders(rows);
      setSelectedPurchaseOrderId((prev) => {
        const next =
          prev && rows.some((x) => String(x.id) === String(prev))
            ? String(prev)
            : rows[0]?.id != null
              ? String(rows[0].id)
              : "";
        return next;
      });
    } catch (e) {
      setPurchaseOrders([]);
      setSelectedPurchaseOrderId("");
      setErrorText(
        e?.data?.error || e?.message || "Failed to load purchase orders",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setPurchaseOrderDetail({ purchaseOrder: null, items: [] });
      return;
    }

    setDetailLoading(true);

    try {
      const result = await apiFetch(`/purchase-orders/${id}`, {
        method: "GET",
      });

      setPurchaseOrderDetail(normalizePurchaseOrderDetail(result));
    } catch {
      setPurchaseOrderDetail({ purchaseOrder: null, items: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadSupplierOptions();
    loadProductOptions();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, locationId, supplierId, status]);

  useEffect(() => {
    loadList();
  }, [q, locationId, supplierId, status]);

  useEffect(() => {
    loadDetail(selectedPurchaseOrderId);
  }, [selectedPurchaseOrderId]);

  async function handleActionSaved(actionText, result) {
    const savedPurchaseOrder = result?.purchaseOrder
      ? normalizePurchaseOrder(result.purchaseOrder)
      : null;

    const nextId =
      savedPurchaseOrder?.id ??
      purchaseOrderDetail?.purchaseOrder?.id ??
      receivingPurchaseOrder?.id ??
      selectedPurchaseOrderId ??
      "";

    setSuccessText(actionText);
    setCreatingPurchaseOrder(false);
    setEditingPurchaseOrder(null);
    setApprovingPurchaseOrder(null);
    setCancellingPurchaseOrder(null);
    setReceivingPurchaseOrder(null);

    if (savedPurchaseOrder) {
      setPurchaseOrders((prev) => {
        const rows = Array.isArray(prev) ? prev : [];
        const withoutCurrent = rows.filter(
          (row) => String(row?.id) !== String(savedPurchaseOrder.id),
        );
        return [savedPurchaseOrder, ...withoutCurrent];
      });

      setPurchaseOrderDetail({
        purchaseOrder: savedPurchaseOrder,
        items: Array.isArray(result?.items) ? result.items : [],
      });
    }

    await loadList();

    if (nextId) {
      setSelectedPurchaseOrderId(String(nextId));
      await loadDetail(String(nextId));
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  const visibleRows = purchaseOrders.slice(0, visibleCount);

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
            loadProductOptions(),
            loadList(),
            loadDetail(selectedPurchaseOrderId),
          ]);
        }}
      />

      <AsyncButton
        idleText="Create purchase order"
        loadingText="Opening..."
        successText="Ready"
        onClick={async () => setCreatingPurchaseOrder(true)}
      />
    </div>
  );

  const detailStatusUpper = safe(detailPurchaseOrder?.status).toUpperCase();
  const hasReceivableLines = Array.isArray(purchaseOrderDetail?.items)
    ? purchaseOrderDetail.items.some((item) => {
        const qtyOrdered = safeNumber(item?.qtyOrdered);
        const qtyReceived = safeNumber(item?.qtyReceived);
        const productId = item?.productId;
        return productId != null && qtyOrdered > qtyReceived;
      })
    : false;

  return (
    <div className="grid gap-4">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      <SectionShell
        title="Purchase orders"
        hint="Prepare supplier orders clearly, approve them before procurement, and track what has been ordered for each branch."
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
                  Purchase order overview
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricCard
                    label="Purchase orders"
                    value={safeNumber(summary.totalCount)}
                    sub="Visible under current filters"
                  />
                  <MetricCard
                    label="Draft"
                    value={safeNumber(summary.draftCount)}
                    sub="Still being prepared"
                  />
                  <MetricCard
                    label="Approved"
                    value={safeNumber(summary.approvedCount)}
                    sub="Ready for procurement"
                  />
                  <MetricCard
                    label="Partially received"
                    value={safeNumber(summary.partialCount)}
                    sub="Some stock already arrived"
                    tone="warn"
                  />
                  <MetricCard
                    label="Received"
                    value={safeNumber(summary.receivedCount)}
                    sub="Fully received"
                  />
                  <MetricCard
                    label="Visible total"
                    value={money(summary.totalAmount, "RWF")}
                    sub="Mixed-currency display is normalized visually"
                  />
                </div>
              </Surface>

              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Purchase order filters
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <FormInput
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search PO number, supplier, branch, reference"
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
                    <option value="APPROVED">Approved</option>
                    <option value="PARTIALLY_RECEIVED">
                      Partially received
                    </option>
                    <option value="RECEIVED">Received</option>
                    <option value="CANCELLED">Cancelled</option>
                  </FormSelect>
                </div>

                <div className="mt-4 rounded-[22px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                    Current purchase order
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <FormSelect
                      value={selectedPurchaseOrderId}
                      onChange={(e) =>
                        setSelectedPurchaseOrderId(e.target.value)
                      }
                    >
                      <option value="">Select purchase order</option>
                      {purchaseOrders.map((row) => (
                        <option key={row.id} value={String(row.id)}>
                          {`${safe(row.poNo) || "No order number"} — ${safe(row.supplierName) || "-"}`}
                        </option>
                      ))}
                    </FormSelect>

                    <div className="rounded-[18px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
                      Total:{" "}
                      <b>
                        {detailLoading
                          ? "..."
                          : detailPurchaseOrder
                            ? money(
                                detailPurchaseOrder.totalAmount,
                                detailPurchaseOrder.currency,
                              )
                            : "—"}
                      </b>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                    Status:{" "}
                    <b>
                      {detailPurchaseOrder
                        ? safe(detailPurchaseOrder.status)
                        : "—"}
                    </b>{" "}
                    • Supplier:{" "}
                    <b>
                      {detailPurchaseOrder
                        ? safe(detailPurchaseOrder.supplierName)
                        : "—"}
                    </b>
                  </div>
                </div>
              </Surface>
            </div>

            <div className="mt-4 grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Purchase order directory
                </div>
                <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Select a purchase order to inspect its lines and next actions.
                </div>

                <div className="mt-4">
                  {purchaseOrders.length === 0 ? (
                    <EmptyState text="No purchase orders match the current filters." />
                  ) : (
                    <div className="grid gap-3">
                      {visibleRows.map((row) => (
                        <PurchaseOrderCard
                          key={row.id}
                          row={row}
                          active={
                            String(row.id) === String(selectedPurchaseOrderId)
                          }
                          onSelect={(picked) =>
                            setSelectedPurchaseOrderId(String(picked?.id || ""))
                          }
                          locations={locationOptions}
                        />
                      ))}
                    </div>
                  )}

                  {visibleCount < purchaseOrders.length ? (
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

              {detailPurchaseOrder ? (
                <Surface>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                        Selected purchase order
                      </div>
                      <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        Review supplier, branch, lines, dates, approval state,
                        and document output.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AsyncButton
                        idleText="Preview"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () =>
                          setPreviewingPurchaseOrder(detailPurchaseOrder)
                        }
                        variant="secondary"
                      />

                      <AsyncButton
                        idleText="Preview PDF"
                        loadingText="Opening..."
                        successText="Opened"
                        onClick={async () => {
                          await previewPurchaseOrderPdf(detailPurchaseOrder.id);
                        }}
                        variant="secondary"
                      />

                      <AsyncButton
                        idleText="Download PDF"
                        loadingText="Downloading..."
                        successText="Downloaded"
                        onClick={async () => {
                          await downloadPurchaseOrderPdf(
                            detailPurchaseOrder.id,
                            `${safe(detailPurchaseOrder?.poNo) || `purchase-order-${detailPurchaseOrder.id}`}.pdf`,
                          );
                        }}
                        variant="secondary"
                      />

                      {detailStatusUpper !== "CANCELLED" ? (
                        <AsyncButton
                          idleText="Edit purchase order"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () =>
                            setEditingPurchaseOrder(detailPurchaseOrder)
                          }
                          variant="secondary"
                        />
                      ) : null}

                      {detailStatusUpper === "DRAFT" ? (
                        <AsyncButton
                          idleText="Approve purchase order"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () =>
                            setApprovingPurchaseOrder(detailPurchaseOrder)
                          }
                          variant="secondary"
                        />
                      ) : null}

                      {["APPROVED", "PARTIALLY_RECEIVED"].includes(
                        detailStatusUpper,
                      ) && hasReceivableLines ? (
                        <AsyncButton
                          idleText="Receive goods"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () =>
                            setReceivingPurchaseOrder(detailPurchaseOrder)
                          }
                          variant="secondary"
                        />
                      ) : null}

                      {["DRAFT", "APPROVED"].includes(detailStatusUpper) ? (
                        <AsyncButton
                          idleText="Cancel purchase order"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () =>
                            setCancellingPurchaseOrder(detailPurchaseOrder)
                          }
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
                        <Pill tone={statusTone(detailPurchaseOrder?.status)}>
                          {safe(detailPurchaseOrder?.status) || "DRAFT"}
                        </Pill>
                        <Pill tone="neutral">
                          {normalizeCurrency(detailPurchaseOrder?.currency)}
                        </Pill>
                        <Pill tone="info">
                          {safe(detailPurchaseOrder?.poNo) || "No order number"}
                        </Pill>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <MetricCard
                          label="Supplier"
                          value={safe(detailPurchaseOrder?.supplierName) || "-"}
                          sub={
                            safe(detailPurchaseOrder?.reference) ||
                            "No reference"
                          }
                        />
                        <MetricCard
                          label="Branch"
                          value={displayBranch(
                            detailPurchaseOrder,
                            locationOptions,
                          )}
                          sub={safe(detailPurchaseOrder?.locationCode) || "-"}
                        />
                        <MetricCard
                          label={`Total (${normalizeCurrency(detailPurchaseOrder?.currency)})`}
                          value={money(
                            detailPurchaseOrder?.totalAmount,
                            detailPurchaseOrder?.currency,
                          )}
                          sub="Estimated purchase order amount"
                        />
                        <MetricCard
                          label="Qty ordered vs received"
                          value={`${safeNumber(detailPurchaseOrder?.qtyOrderedTotal)} / ${safeNumber(detailPurchaseOrder?.qtyReceivedTotal)}`}
                          sub="Ordered / received"
                          tone={
                            safeNumber(detailPurchaseOrder?.qtyReceivedTotal) >
                            0
                              ? "warn"
                              : "default"
                          }
                        />
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Purchase order profile
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <InfoTile
                            label="Ordered date"
                            value={safeDate(detailPurchaseOrder?.orderedAt)}
                          />
                          <InfoTile
                            label="Expected date"
                            value={safeDate(detailPurchaseOrder?.expectedAt)}
                          />
                          <InfoTile
                            label="Approved at"
                            value={safeDate(detailPurchaseOrder?.approvedAt)}
                          />
                          <InfoTile
                            label="Created by"
                            value={
                              safe(detailPurchaseOrder?.createdByName) ||
                              (detailPurchaseOrder?.createdByUserId != null
                                ? `User #${detailPurchaseOrder.createdByUserId}`
                                : "-")
                            }
                          />
                        </div>

                        <InfoTile
                          label="Internal note"
                          value={
                            safe(detailPurchaseOrder?.notes) ||
                            "No note recorded"
                          }
                        />
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Order lines
                        </div>

                        {(purchaseOrderDetail?.items || []).length === 0 ? (
                          <EmptyState text="No purchase order lines found." />
                        ) : (
                          <div className="space-y-3">
                            {(purchaseOrderDetail?.items || []).map((item) => (
                              <div
                                key={item.id}
                                className="rounded-[20px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                      {safe(
                                        item?.productDisplayName ||
                                          item?.productName,
                                      ) || "-"}
                                    </p>
                                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                      SKU: {safe(item?.productSku) || "-"} •
                                      Product ID:{" "}
                                      {item?.productId != null
                                        ? item.productId
                                        : "-"}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                    {money(
                                      item?.lineTotal,
                                      detailPurchaseOrder?.currency,
                                    )}
                                  </span>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                  <InfoTile
                                    label="Qty ordered"
                                    value={safeNumber(item?.qtyOrdered)}
                                  />
                                  <InfoTile
                                    label="Qty received"
                                    value={safeNumber(item?.qtyReceived)}
                                  />
                                  <InfoTile
                                    label="Unit cost"
                                    value={money(
                                      item?.unitCost,
                                      detailPurchaseOrder?.currency,
                                    )}
                                  />
                                  <InfoTile
                                    label="Line total"
                                    value={money(
                                      item?.lineTotal,
                                      detailPurchaseOrder?.currency,
                                    )}
                                  />
                                </div>

                                {safe(item?.note) ? (
                                  <div className="mt-3 rounded-[16px] border border-stone-200 bg-white p-3 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                                    {safe(item.note)}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </Surface>
              ) : (
                <Surface>
                  <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                    Selected purchase order
                  </div>
                  <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    This section appears after a purchase order is selected.
                  </div>
                  <div className="mt-4">
                    <EmptyState text="Select a purchase order above to inspect details and order lines." />
                  </div>
                </Surface>
              )}
            </div>
          </>
        )}
      </SectionShell>

      <CreatePurchaseOrderModal
        open={creatingPurchaseOrder}
        suppliers={supplierOptions}
        locations={locationOptions}
        products={productOptions}
        onClose={() => setCreatingPurchaseOrder(false)}
        onSaved={(result) =>
          handleActionSaved("Purchase order created", result)
        }
      />

      <EditPurchaseOrderModal
        open={!!editingPurchaseOrder}
        purchaseOrder={editingPurchaseOrder}
        items={purchaseOrderDetail?.items || []}
        suppliers={supplierOptions}
        locations={locationOptions}
        products={productOptions}
        onClose={() => setEditingPurchaseOrder(null)}
        onSaved={(result) =>
          handleActionSaved("Purchase order updated", result)
        }
      />

      <ApprovePurchaseOrderModal
        open={!!approvingPurchaseOrder}
        purchaseOrder={approvingPurchaseOrder}
        onClose={() => setApprovingPurchaseOrder(null)}
        onSaved={(result) =>
          handleActionSaved("Purchase order approved", result)
        }
      />

      <ReceiveGoodsModal
        open={!!receivingPurchaseOrder}
        purchaseOrder={receivingPurchaseOrder}
        items={purchaseOrderDetail?.items || []}
        locations={locationOptions}
        onClose={() => setReceivingPurchaseOrder(null)}
        onSaved={(result) => handleActionSaved("Goods received", result)}
      />

      <CancelPurchaseOrderModal
        open={!!cancellingPurchaseOrder}
        purchaseOrder={cancellingPurchaseOrder}
        onClose={() => setCancellingPurchaseOrder(null)}
        onSaved={(result) =>
          handleActionSaved("Purchase order cancelled", result)
        }
      />

      <PreviewPurchaseOrderModal
        open={!!previewingPurchaseOrder}
        purchaseOrder={previewingPurchaseOrder}
        items={purchaseOrderDetail?.items || []}
        locations={locationOptions}
        onClose={() => setPreviewingPurchaseOrder(null)}
      />
    </div>
  );
}
