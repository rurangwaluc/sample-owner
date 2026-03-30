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
  safeDate,
  safeNumber,
} from "../OwnerShared";
import { useEffect, useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";
import { apiFetch } from "../../../lib/api";

const STOCK_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "LOW", label: "Low stock" },
  { value: "OUT", label: "Out of stock" },
  { value: "IN_STOCK", label: "In stock" },
];

const PAGE_SIZE = 20;

function money(v) {
  return safeNumber(v).toLocaleString();
}

function displayCategoryChip(row) {
  return safe(row?.systemCategory) || safe(row?.category) || "OTHER_PP_BAG";
}

function categoryTone(value) {
  const v = String(value || "").toUpperCase();

  if (v.includes("BOPP") || v.includes("LAMINATED")) {
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300";
  }

  if (v.includes("MESH") || v.includes("VENTILATED")) {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  if (v.includes("JUMBO") || v.includes("FIBC")) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (v.includes("VALVE") || v.includes("LINER")) {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function qtyTone(qty, reorderLevel = 0) {
  const n = safeNumber(qty);
  const threshold = Math.max(1, safeNumber(reorderLevel));

  if (n <= 0) {
    return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  }
  if (n <= threshold) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
}

function qtyLabel(qty, reorderLevel = 0) {
  const n = safeNumber(qty);
  const threshold = Math.max(1, safeNumber(reorderLevel));
  if (n <= 0) return "Out";
  if (n <= threshold) return "Low";
  return "Healthy";
}

function activeTone(isActive) {
  return isActive
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function normalizeInventoryRow(row) {
  if (!row) return null;

  return {
    productId: Number(row.productId ?? row.product_id ?? 0),
    locationId: Number(row.locationId ?? row.location_id ?? 0),
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    locationStatus: row.locationStatus ?? row.location_status ?? "",
    name: row.name ?? "",
    displayName: row.displayName ?? row.display_name ?? "",
    systemCategory: row.systemCategory ?? row.system_category ?? "WOVEN_PP_BAG",
    category: row.category ?? "",
    subcategory: row.subcategory ?? "",
    sku: row.sku ?? "",
    barcode: row.barcode ?? "",
    supplierSku: row.supplierSku ?? row.supplier_sku ?? "",
    brand: row.brand ?? "",
    model: row.model ?? "",
    size: row.size ?? "",
    color: row.color ?? "",
    material: row.material ?? "",
    variantSummary: row.variantSummary ?? row.variant_summary ?? "",
    unit: row.unit ?? "",
    stockUnit: row.stockUnit ?? row.stock_unit ?? row.unit ?? "",
    salesUnit: row.salesUnit ?? row.sales_unit ?? row.unit ?? "",
    purchaseUnit: row.purchaseUnit ?? row.purchase_unit ?? row.unit ?? "",
    purchaseUnitFactor: Number(
      row.purchaseUnitFactor ?? row.purchase_unit_factor ?? 1,
    ),
    sellingPrice: Number(row.sellingPrice ?? row.selling_price ?? 0),
    purchasePrice: Number(
      row.purchasePrice ??
        row.purchase_price ??
        row.costPrice ??
        row.cost_price ??
        0,
    ),
    maxDiscountPercent: Number(
      row.maxDiscountPercent ?? row.max_discount_percent ?? 0,
    ),
    reorderLevel: Number(row.reorderLevel ?? row.reorder_level ?? 0),
    trackInventory:
      row.trackInventory ?? row.track_inventory ?? row.trackinventory ?? true,
    attributes: row.attributes ?? null,
    isActive:
      row.isActive === undefined || row.isActive === null
        ? row.is_active !== false
        : row.isActive !== false,
    qtyOnHand: Number(row.qtyOnHand ?? row.qty_on_hand ?? 0),
    inventoryValue: Number(row.inventoryValue ?? row.inventory_value ?? 0),
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function normalizeProductInventoryDetail(row) {
  if (!row) return null;

  return {
    productId: Number(row.productId ?? row.product_id ?? 0),
    name: row.name ?? "",
    displayName: row.displayName ?? row.display_name ?? "",
    systemCategory: row.systemCategory ?? row.system_category ?? "WOVEN_PP_BAG",
    category: row.category ?? "",
    subcategory: row.subcategory ?? "",
    sku: row.sku ?? "",
    barcode: row.barcode ?? "",
    supplierSku: row.supplierSku ?? row.supplier_sku ?? "",
    unit: row.unit ?? "",
    stockUnit: row.stockUnit ?? row.stock_unit ?? row.unit ?? "",
    salesUnit: row.salesUnit ?? row.sales_unit ?? row.unit ?? "",
    purchaseUnit: row.purchaseUnit ?? row.purchase_unit ?? row.unit ?? "",
    purchaseUnitFactor: Number(
      row.purchaseUnitFactor ?? row.purchase_unit_factor ?? 1,
    ),
    reorderLevel: Number(row.reorderLevel ?? row.reorder_level ?? 0),
    trackInventory:
      row.trackInventory ?? row.track_inventory ?? row.trackinventory ?? true,
    attributes: row.attributes ?? null,
    branches: Array.isArray(row.branches)
      ? row.branches.map((branch) => ({
          locationId: Number(branch.locationId ?? branch.location_id ?? 0),
          locationName: branch.locationName ?? branch.location_name ?? "",
          locationCode: branch.locationCode ?? branch.location_code ?? "",
          locationStatus: branch.locationStatus ?? branch.location_status ?? "",
          qtyOnHand: Number(branch.qtyOnHand ?? branch.qty_on_hand ?? 0),
          inventoryValue: Number(
            branch.inventoryValue ?? branch.inventory_value ?? 0,
          ),
          sellingPrice: Number(
            branch.sellingPrice ?? branch.selling_price ?? 0,
          ),
          purchasePrice: Number(
            branch.purchasePrice ?? branch.purchase_price ?? 0,
          ),
          maxDiscountPercent: Number(
            branch.maxDiscountPercent ?? branch.max_discount_percent ?? 0,
          ),
          isActive:
            branch.isActive === undefined || branch.isActive === null
              ? branch.is_active !== false
              : branch.isActive !== false,
          updatedAt: branch.updatedAt ?? branch.updated_at ?? null,
        }))
      : [],
  };
}

function InventoryListRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[minmax(220px,2fr)_120px_150px_90px_120px_120px_140px_110px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
        (active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
          : "bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/70")
      }
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13px] font-semibold leading-5">
            {safe(row?.displayName) || safe(row?.name) || "-"}
          </p>
          <span
            className={
              "rounded-full px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] " +
              (active
                ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                : categoryTone(displayCategoryChip(row)))
            }
          >
            {displayCategoryChip(row)}
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
          {safe(row?.category) || "No business label"}
          {safe(row?.stockUnit) ? ` · ${safe(row.stockUnit)}` : ""}
        </p>
      </div>

      <div className="truncate text-sm font-medium">
        {safe(row?.sku) || "-"}
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

      <div className="text-sm font-bold">{safeNumber(row?.qtyOnHand)}</div>
      <div className="text-sm font-semibold">{money(row?.sellingPrice)}</div>
      <div className="text-sm font-semibold">{money(row?.purchasePrice)}</div>
      <div className="text-sm font-bold">{money(row?.inventoryValue)}</div>

      <div className="flex flex-wrap gap-2 justify-start">
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : qtyTone(row?.qtyOnHand, row?.reorderLevel))
          }
        >
          {qtyLabel(row?.qtyOnHand, row?.reorderLevel)}
        </span>
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : activeTone(row?.isActive !== false))
          }
        >
          {row?.isActive === false ? "Archived" : "Active"}
        </span>
      </div>
    </button>
  );
}

function InventoryMobileRow({ row, active, onSelect }) {
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
              {safe(row?.displayName) || safe(row?.name) || "-"}
            </p>
            <span
              className={
                "rounded-full px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] " +
                (active
                  ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                  : categoryTone(displayCategoryChip(row)))
              }
            >
              {displayCategoryChip(row)}
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
            SKU: {safe(row?.sku) || "-"}
          </p>
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
        </div>

        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : qtyTone(row?.qtyOnHand, row?.reorderLevel))
          }
        >
          {safeNumber(row?.qtyOnHand)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Sell
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.sellingPrice)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Buy
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.purchasePrice)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Value
          </p>
          <p className="mt-1 text-sm font-bold">{money(row?.inventoryValue)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Status
          </p>
          <p className="mt-1 text-sm font-bold">
            {row?.isActive === false ? "Archived" : "Active"}
          </p>
        </div>
      </div>
    </button>
  );
}

function BranchBreakdownCard({ branch, reorderLevel = 0 }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
            {safe(branch?.locationName) || "-"}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-stone-500 dark:text-stone-400">
            {safe(branch?.locationCode) || "-"} ·{" "}
            {safe(branch?.locationStatus) || "-"}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${qtyTone(
            branch?.qtyOnHand,
            reorderLevel,
          )}`}
        >
          {qtyLabel(branch?.qtyOnHand, reorderLevel)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Qty
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {safeNumber(branch?.qtyOnHand)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Value
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {money(branch?.inventoryValue)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Sell
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {money(branch?.sellingPrice)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Buy
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {money(branch?.purchasePrice)}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900 col-span-2 lg:col-span-1">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Updated
          </p>
          <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
            {safeDate(branch?.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function BranchValueRow({ row }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {safe(row?.locationName) || "-"}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {safe(row?.locationCode) || "-"} ·{" "}
            {safe(row?.locationStatus) || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-right dark:border-stone-800 dark:bg-stone-900">
          <p className="text-[11px] uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Inventory value
          </p>
          <p className="mt-1 text-base font-black text-stone-950 dark:text-stone-50">
            {money(row?.inventoryValue)} RWF
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Products
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {safeNumber(row?.productsCount)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Qty on hand
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {safeNumber(row?.totalQtyOnHand)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Low stock
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {safeNumber(row?.lowStockCount)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
            Out of stock
          </p>
          <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
            {safeNumber(row?.outOfStockCount)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerInventoryTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [summary, setSummary] = useState(null);
  const [inventoryRows, setInventoryRows] = useState([]);
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [productDetailLoading, setProductDetailLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("ALL");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadInventory() {
    setLoading(true);
    setErrorText("");

    const inventoryParams = new URLSearchParams();
    if (locationId) inventoryParams.set("locationId", locationId);
    if (search.trim()) inventoryParams.set("search", search.trim());
    if (stockStatus && stockStatus !== "ALL") {
      inventoryParams.set("stockStatus", stockStatus);
    }
    if (includeArchived) inventoryParams.set("includeInactive", "1");

    const summaryParams = new URLSearchParams();
    if (locationId) summaryParams.set("locationId", locationId);
    if (includeArchived) summaryParams.set("includeInactive", "1");

    const inventoryUrl = `/owner/inventory${
      inventoryParams.toString() ? `?${inventoryParams.toString()}` : ""
    }`;
    const summaryUrl = `/owner/inventory/summary${
      summaryParams.toString() ? `?${summaryParams.toString()}` : ""
    }`;

    const [summaryRes, inventoryRes] = await Promise.allSettled([
      apiFetch(summaryUrl, { method: "GET" }),
      apiFetch(inventoryUrl, { method: "GET" }),
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
        "Failed to load inventory summary";
    }

    if (inventoryRes.status === "fulfilled") {
      const rows = Array.isArray(inventoryRes.value?.inventory)
        ? inventoryRes.value.inventory
            .map(normalizeInventoryRow)
            .filter(Boolean)
        : [];

      setInventoryRows(rows);
      setSelectedRowKey((prev) =>
        prev && rows.some((x) => `${x.productId}-${x.locationId}` === prev)
          ? prev
          : rows[0]
            ? `${rows[0].productId}-${rows[0].locationId}`
            : null,
      );
    } else {
      setInventoryRows([]);
      firstError =
        firstError ||
        inventoryRes.reason?.data?.error ||
        inventoryRes.reason?.message ||
        "Failed to load owner inventory";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  function exportInventoryView() {
    const rows = [
      [
        "Product",
        "System Category",
        "Business Label",
        "SKU",
        "Branch",
        "Branch Code",
        "Qty On Hand",
        "Stock Unit",
        "Selling Price",
        "Purchase Price",
        "Inventory Value",
        "Reorder Level",
        "Status",
        "Updated At",
      ],
      ...inventoryRows.map((row) => [
        row?.displayName || row?.name || "",
        row?.systemCategory || "",
        row?.category || "",
        row?.sku || "",
        row?.locationName || "",
        row?.locationCode || "",
        safeNumber(row?.qtyOnHand),
        row?.stockUnit || row?.unit || "",
        safeNumber(row?.sellingPrice),
        safeNumber(row?.purchasePrice),
        safeNumber(row?.inventoryValue),
        safeNumber(row?.reorderLevel),
        row?.isActive === false ? "Archived" : "Active",
        row?.updatedAt || "",
      ]),
    ];

    downloadCSV("owner-inventory-view.csv", rows);
  }

  function exportSelectedProductBreakdown() {
    if (!selectedProductDetail) return;

    const rows = [
      [
        "Product",
        "System Category",
        "Business Label",
        "SKU",
        "Branch",
        "Branch Code",
        "Branch Status",
        "Qty On Hand",
        "Inventory Value",
        "Selling Price",
        "Purchase Price",
        "Updated At",
      ],
      ...(selectedProductDetail.branches || []).map((branch) => [
        selectedProductDetail.displayName || selectedProductDetail.name || "",
        selectedProductDetail.systemCategory || "",
        selectedProductDetail.category || "",
        selectedProductDetail.sku || "",
        branch?.locationName || "",
        branch?.locationCode || "",
        branch?.locationStatus || "",
        safeNumber(branch?.qtyOnHand),
        safeNumber(branch?.inventoryValue),
        safeNumber(branch?.sellingPrice),
        safeNumber(branch?.purchasePrice),
        branch?.updatedAt || "",
      ]),
    ];

    downloadCSV("owner-selected-product-branches.csv", rows);
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [locationId, stockStatus, includeArchived, search]);

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, stockStatus, includeArchived]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadInventory();
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const visibleRows = useMemo(
    () => inventoryRows.slice(0, visibleCount),
    [inventoryRows, visibleCount],
  );

  const hasMoreRows = visibleCount < inventoryRows.length;

  const selectedRow =
    selectedRowKey == null
      ? null
      : inventoryRows.find(
          (row) => `${row.productId}-${row.locationId}` === selectedRowKey,
        ) || null;

  useEffect(() => {
    async function loadProductDetail() {
      if (!selectedRow?.productId) {
        setSelectedProductDetail(null);
        return;
      }

      setProductDetailLoading(true);

      try {
        const result = await apiFetch(
          `/owner/products/${selectedRow.productId}/inventory?includeInactive=1`,
          { method: "GET" },
        );
        setSelectedProductDetail(
          normalizeProductInventoryDetail(result?.product || null),
        );
      } catch {
        setSelectedProductDetail(null);
      } finally {
        setProductDetailLoading(false);
      }
    }

    loadProductDetail();
  }, [selectedRow?.productId]);

  const summaryTotals = summary?.totals || {
    branchesCount: 0,
    productsCount: 0,
    totalQtyOnHand: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  const byLocation = Array.isArray(summary?.byLocation)
    ? summary.byLocation
    : [];

  const highestValueBranch = [...byLocation].sort((a, b) => {
    return safeNumber(b?.inventoryValue) - safeNumber(a?.inventoryValue);
  })[0];

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />

      {loading ? (
        <SectionCard
          title="Inventory"
          subtitle="Loading owner cross-branch inventory."
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
            title="Cross-branch inventory summary"
            subtitle="Owner-wide inventory visibility across all branches."
            right={
              <AsyncButton
                idleText="Export inventory view"
                loadingText="Exporting..."
                successText="Exported"
                onClick={async () => exportInventoryView()}
              />
            }
          >
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Branches"
                value={safeNumber(summaryTotals.branchesCount)}
                sub="Branches with inventory visibility"
                valueClassName="text-[20px] font-bold"
              />
              <StatCard
                label="Products"
                value={safeNumber(summaryTotals.productsCount)}
                sub="Visible bag product records"
                valueClassName="text-[20px] font-bold"
              />
              <StatCard
                label="Qty on hand"
                value={safeNumber(summaryTotals.totalQtyOnHand)}
                sub="Total stock across visible branches"
                valueClassName="text-[20px] font-bold"
              />
              <StatCard
                label="Inventory value"
                value={money(summaryTotals.inventoryValue)}
                sub="Total cost-based inventory value"
                valueClassName="text-[20px] font-bold"
              />
              <StatCard
                label="Low stock"
                value={safeNumber(summaryTotals.lowStockCount)}
                sub="Items at risk soon"
                valueClassName="text-[20px] font-bold"
              />
              <StatCard
                label="Out of stock"
                value={safeNumber(summaryTotals.outOfStockCount)}
                sub="Immediate stock issue items"
                valueClassName="text-[20px] font-bold"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
              {highestValueBranch
                ? `Highest visible inventory value is currently in ${safe(highestValueBranch.locationName)} (${safe(highestValueBranch.locationCode)}) at ${money(highestValueBranch.inventoryValue)} RWF.`
                : "No branch inventory leader is visible yet."}
            </div>
          </SectionCard>

          <SectionCard
            title="Per-branch inventory value"
            subtitle="Cost-based inventory value and stock signal for each branch."
          >
            {byLocation.length === 0 ? (
              <EmptyState text="No branch inventory totals available." />
            ) : (
              <div className="grid gap-3">
                {byLocation.map((row) => (
                  <BranchValueRow
                    key={`branch-value-${row.locationId}`}
                    row={row}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Inventory directory"
            subtitle="Search, filter, inspect, and export the owner inventory view."
          >
            <div className="grid gap-3 lg:grid-cols-4">
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bag product, SKU, branch, system category, business label"
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
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
              >
                {STOCK_FILTERS.map((row) => (
                  <option key={row.value} value={row.value}>
                    {row.label}
                  </option>
                ))}
              </FormSelect>

              <label className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                />
                <span>Include archived</span>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-stone-600 dark:text-stone-300">
              <p>
                Showing {Math.min(visibleRows.length, inventoryRows.length)} of{" "}
                {inventoryRows.length}
              </p>
              <p>
                Filtered inventory value:{" "}
                <b>
                  {money(
                    inventoryRows.reduce(
                      (sum, row) => sum + safeNumber(row?.inventoryValue),
                      0,
                    ),
                  )}
                </b>{" "}
                RWF
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[minmax(220px,2fr)_120px_150px_90px_120px_120px_140px_110px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Product</div>
                <div>SKU</div>
                <div>Branch</div>
                <div>Qty</div>
                <div>Selling</div>
                <div>Purchase</div>
                <div>Value</div>
                <div>Status</div>
              </div>

              {inventoryRows.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No inventory rows match the current owner filters." />
                </div>
              ) : (
                <div>
                  {visibleRows.map((row) => (
                    <div key={`${row.productId}-${row.locationId}`}>
                      <InventoryListRow
                        row={row}
                        active={
                          `${row.productId}-${row.locationId}` ===
                          selectedRowKey
                        }
                        onSelect={(picked) =>
                          setSelectedRowKey(
                            `${picked?.productId}-${picked?.locationId}`,
                          )
                        }
                      />
                      <div className="p-3 lg:hidden">
                        <InventoryMobileRow
                          row={row}
                          active={
                            `${row.productId}-${row.locationId}` ===
                            selectedRowKey
                          }
                          onSelect={(picked) =>
                            setSelectedRowKey(
                              `${picked?.productId}-${picked?.locationId}`,
                            )
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

          {selectedRow ? (
            <SectionCard
              title="Selected inventory detail"
              subtitle="Selected row detail plus cross-branch product visibility."
              right={
                <div className="flex flex-wrap gap-2">
                  <AsyncButton
                    idleText="Export selected product"
                    loadingText="Exporting..."
                    successText="Exported"
                    onClick={async () => exportSelectedProductBreakdown()}
                    variant="secondary"
                  />
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${categoryTone(
                      displayCategoryChip(selectedRow),
                    )}`}
                  >
                    {displayCategoryChip(selectedRow)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${qtyTone(
                      selectedRow.qtyOnHand,
                      selectedRow.reorderLevel,
                    )}`}
                  >
                    {qtyLabel(selectedRow.qtyOnHand, selectedRow.reorderLevel)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${activeTone(
                      selectedRow.isActive !== false,
                    )}`}
                  >
                    {selectedRow.isActive === false ? "Archived" : "Active"}
                  </span>
                </div>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                  <StatCard
                    label="Product"
                    value={
                      safe(selectedRow.displayName) ||
                      safe(selectedRow.name) ||
                      "-"
                    }
                    valueClassName="text-xl sm:text-lg leading-tight"
                    sub={`SKU: ${safe(selectedRow.sku) || "-"}`}
                  />
                  <StatCard
                    label="Branch"
                    value={safe(selectedRow.locationName) || "-"}
                    valueClassName="text-xl sm:text-lg leading-tight"
                    sub={safe(selectedRow.locationCode) || "-"}
                  />
                  <StatCard
                    label="Qty on hand"
                    value={safeNumber(selectedRow.qtyOnHand)}
                    sub="Current stock in selected branch"
                  />
                  <StatCard
                    label="Selling price"
                    value={money(selectedRow.sellingPrice)}
                    sub="Current selling price"
                  />
                  <StatCard
                    label="Purchase price"
                    value={money(selectedRow.purchasePrice)}
                    sub="Current purchase price"
                  />
                  <StatCard
                    label="Inventory value"
                    value={money(selectedRow.inventoryValue)}
                    sub="Qty × purchase price"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Selected branch detail
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Product
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedRow.displayName) ||
                            safe(selectedRow.name) ||
                            "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          System category
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedRow.systemCategory) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Business label
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedRow.category) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Branch
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedRow.locationName) || "-"}{" "}
                          {safe(selectedRow.locationCode)
                            ? `(${safe(selectedRow.locationCode)})`
                            : ""}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Branch status
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedRow.locationStatus) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Product status
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {selectedRow.isActive === false
                            ? "Archived"
                            : "Active"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Qty on hand
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safeNumber(selectedRow.qtyOnHand)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Stock / Sales / Purchase unit
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedRow.stockUnit || selectedRow.unit) ||
                            "-"}
                          {" / "}
                          {safe(selectedRow.salesUnit) || "-"}
                          {" / "}
                          {safe(selectedRow.purchaseUnit) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Purchase unit factor
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safeNumber(selectedRow.purchaseUnitFactor)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Reorder level
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safeNumber(selectedRow.reorderLevel)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Track inventory
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {selectedRow.trackInventory ? "Yes" : "No"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Max discount %
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safeNumber(selectedRow.maxDiscountPercent)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Inventory value
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {money(selectedRow.inventoryValue)} RWF
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Updated
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safeDate(selectedRow.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Owner guidance
                    </p>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      Inventory value is calculated from quantity on hand
                      multiplied by product purchase price. This is owner
                      capital visibility, not projected sales revenue.
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      Low stock uses the bag product reorder level. If reorder
                      level is zero, the screen falls back to a minimum
                      threshold of 1 so zero-stock and near-zero items still
                      surface fast.
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      The right owner habit is simple: inspect high-value
                      branches first, then low-stock bag products, then
                      cross-branch duplication or imbalance.
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Cross-branch product view
                  </p>

                  {productDetailLoading ? (
                    <div className="mt-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-24 animate-pulse rounded-2xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
                        />
                      ))}
                    </div>
                  ) : !selectedProductDetail ? (
                    <div className="mt-4">
                      <EmptyState text="No cross-branch product detail available." />
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                            {safe(selectedProductDetail.displayName) ||
                              safe(selectedProductDetail.name) ||
                              "-"}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] ${categoryTone(
                              displayCategoryChip(selectedProductDetail),
                            )}`}
                          >
                            {displayCategoryChip(selectedProductDetail)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                          SKU: {safe(selectedProductDetail.sku) || "-"} · Stock:{" "}
                          {safe(
                            selectedProductDetail.stockUnit ||
                              selectedProductDetail.unit,
                          ) || "-"}{" "}
                          · Sales:{" "}
                          {safe(selectedProductDetail.salesUnit) || "-"} ·
                          Purchase:{" "}
                          {safe(selectedProductDetail.purchaseUnit) || "-"}
                        </p>
                        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                          Business label:{" "}
                          {safe(selectedProductDetail.category) || "-"}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        {(selectedProductDetail.branches || []).map(
                          (branch) => (
                            <BranchBreakdownCard
                              key={`${selectedProductDetail.productId}-${branch.locationId}`}
                              branch={branch}
                              reorderLevel={selectedProductDetail.reorderLevel}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected inventory detail"
              subtitle="This section appears after the owner deliberately selects an inventory row."
            >
              <EmptyState text="Click any inventory row above to inspect row detail and cross-branch product visibility." />
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
