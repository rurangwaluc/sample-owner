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
  { value: "ALL", label: "All stock" },
  { value: "LOW", label: "Low stock" },
  { value: "OUT", label: "Out of stock" },
  { value: "IN_STOCK", label: "In stock" },
];

const PAGE_SIZE = 20;

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(v) {
  return safeNumber(v).toLocaleString();
}

function displayCategoryChip(row) {
  return safe(row?.systemCategory) || safe(row?.category) || "OTHER_PP_BAG";
}

function qtyTone(qty, reorderLevel = 0) {
  const n = safeNumber(qty);
  const threshold = Math.max(1, safeNumber(reorderLevel));

  if (n <= 0) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300";
  }

  if (n <= threshold) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300";
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
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
    : "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";
}

function locationTone(status) {
  const value = safe(status).toUpperCase();

  if (value === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300";
  }

  if (value === "CLOSED") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300";
  }

  if (value === "ARCHIVED") {
    return "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";
  }

  return "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";
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

function Badge({ className = "", children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function FilterShell({ children }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      {children}
    </div>
  );
}

function MetricTile({ label, value, sub, tone = "default" }) {
  return (
    <div
      className={cx(
        "rounded-[22px] border p-4",
        tone === "danger"
          ? "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20"
          : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950",
      )}
    >
      <div
        className={cx(
          "text-[11px] font-black uppercase tracking-[0.12em]",
          tone === "danger"
            ? "text-rose-700 dark:text-rose-300"
            : "text-stone-500 dark:text-stone-400",
        )}
      >
        {label}
      </div>
      <div
        className={cx(
          "mt-2 text-lg font-black",
          tone === "danger"
            ? "text-rose-700 dark:text-rose-300"
            : "text-stone-950 dark:text-stone-50",
        )}
      >
        {value}
      </div>
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

function InventoryCard({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={cx(
        "w-full rounded-[26px] border p-4 text-left transition-all duration-200",
        active
          ? "border-stone-900 bg-stone-900 text-white shadow-lg dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-950",
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-black sm:text-base">
              {safe(row?.displayName) || safe(row?.name) || "-"}
            </div>

            <Badge
              className={
                active
                  ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                  : qtyTone(row?.qtyOnHand, row?.reorderLevel)
              }
            >
              {qtyLabel(row?.qtyOnHand, row?.reorderLevel)}
            </Badge>

            <Badge
              className={
                active
                  ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                  : activeTone(row?.isActive !== false)
              }
            >
              {row?.isActive === false ? "Archived" : "Active"}
            </Badge>

            <Badge
              className={
                active
                  ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                  : locationTone(row?.locationStatus)
              }
            >
              {safe(row?.locationStatus) || "Branch"}
            </Badge>

            <Badge
              className={
                active
                  ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                  : "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300"
              }
            >
              {displayCategoryChip(row)}
            </Badge>
          </div>

          <div
            className={cx(
              "mt-2 text-xs",
              active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400",
            )}
          >
            SKU:{" "}
            <b
              className={
                active
                  ? "text-white dark:text-stone-950"
                  : "text-stone-900 dark:text-stone-100"
              }
            >
              {safe(row?.sku) || "-"}
            </b>
            {" • "}
            Stock unit:{" "}
            <b
              className={
                active
                  ? "text-white dark:text-stone-950"
                  : "text-stone-900 dark:text-stone-100"
              }
            >
              {safe(row?.stockUnit || row?.unit) || "-"}
            </b>
          </div>

          <div
            className={cx(
              "mt-1 text-xs",
              active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400",
            )}
          >
            Branch:{" "}
            <b
              className={
                active
                  ? "text-white dark:text-stone-950"
                  : "text-stone-900 dark:text-stone-100"
              }
            >
              {safe(row?.locationName) || "-"}
              {safe(row?.locationCode) ? ` (${safe(row.locationCode)})` : ""}
            </b>
          </div>
        </div>

        <div
          className={cx(
            "rounded-[22px] border px-4 py-3 xl:min-w-[220px]",
            active
              ? "border-white/10 bg-white/5 dark:border-stone-900/10 dark:bg-stone-900/5"
              : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950",
          )}
        >
          <div
            className={cx(
              "text-[11px] font-black uppercase tracking-[0.12em]",
              active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400",
            )}
          >
            Inventory value
          </div>
          <div className="mt-2 text-xl font-black">
            {money(row?.inventoryValue)}
          </div>
          <div
            className={cx(
              "mt-1 text-xs",
              active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400",
            )}
          >
            Cost-based owner view
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Qty on hand"
          value={safeNumber(row?.qtyOnHand)}
          sub="Current branch stock"
        />
        <MetricTile
          label="Selling price"
          value={money(row?.sellingPrice)}
          sub="Per unit"
        />
        <MetricTile
          label="Purchase price"
          value={money(row?.purchasePrice)}
          sub="Per unit"
        />
        <MetricTile
          label="Max discount %"
          value={safeNumber(row?.maxDiscountPercent)}
          sub="Allowed ceiling"
        />
      </div>
    </button>
  );
}

function BranchBreakdownCard({ branch, reorderLevel = 0 }) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-stone-950 dark:text-stone-50">
              {safe(branch?.locationName) || "-"}
            </p>

            <Badge className={qtyTone(branch?.qtyOnHand, reorderLevel)}>
              {qtyLabel(branch?.qtyOnHand, reorderLevel)}
            </Badge>

            <Badge className={locationTone(branch?.locationStatus)}>
              {safe(branch?.locationStatus) || "Branch"}
            </Badge>

            <Badge className={activeTone(branch?.isActive !== false)}>
              {branch?.isActive === false ? "Archived" : "Active"}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {safe(branch?.locationCode) || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            Last updated
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
            {safeDate(branch?.updatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InfoTile
          label="Qty on hand"
          value={String(safeNumber(branch?.qtyOnHand))}
        />
        <InfoTile
          label="Selling price"
          value={`${money(branch?.sellingPrice)} RWF`}
        />
        <InfoTile
          label="Purchase price"
          value={`${money(branch?.purchasePrice)} RWF`}
        />
        <InfoTile
          label="Inventory value"
          value={`${money(branch?.inventoryValue)} RWF`}
        />
      </div>
    </div>
  );
}

function BranchValueRow({ row }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-950 dark:text-stone-50">
            {safe(row?.locationName) || "-"}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {safe(row?.locationCode) || "-"} ·{" "}
            {safe(row?.locationStatus) || "-"}
          </p>
        </div>

        <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Inventory value
          </div>
          <div className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
            {money(row?.inventoryValue)} RWF
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Products"
          value={safeNumber(row?.productsCount)}
          sub="Visible records"
        />
        <MetricTile
          label="Qty on hand"
          value={safeNumber(row?.totalQtyOnHand)}
          sub="Branch stock"
        />
        <MetricTile
          label="Low stock"
          value={safeNumber(row?.lowStockCount)}
          sub="Needs attention"
          tone={safeNumber(row?.lowStockCount) > 0 ? "danger" : "default"}
        />
        <MetricTile
          label="Out of stock"
          value={safeNumber(row?.outOfStockCount)}
          sub="Immediate issue"
          tone={safeNumber(row?.outOfStockCount) > 0 ? "danger" : "default"}
        />
      </div>
    </div>
  );
}

export default function OwnerInventoryTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [summary, setSummary] = useState(null);
  const [inventoryRows, setInventoryRows] = useState([]);
  const [inventoryMeta, setInventoryMeta] = useState({
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
    hasMore: false,
  });

  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [productDetailLoading, setProductDetailLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("ALL");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [locationId, setLocationId] = useState("");

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadInventory({ append = false, offsetOverride = 0 } = {}) {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setErrorText("");
    }

    const inventoryParams = new URLSearchParams();
    inventoryParams.set("limit", String(PAGE_SIZE));
    inventoryParams.set("offset", String(offsetOverride));

    if (locationId) inventoryParams.set("locationId", locationId);
    if (search.trim()) inventoryParams.set("search", search.trim());
    if (stockStatus && stockStatus !== "ALL") {
      inventoryParams.set("stockStatus", stockStatus);
    }
    if (includeArchived) inventoryParams.set("includeInactive", "1");

    const summaryParams = new URLSearchParams();
    if (includeArchived) summaryParams.set("includeInactive", "1");

    const inventoryUrl = `/owner/inventory?${inventoryParams.toString()}`;
    const summaryUrl = `/owner/inventory/summary${
      summaryParams.toString() ? `?${summaryParams.toString()}` : ""
    }`;

    const requests = append
      ? [
          Promise.resolve({ status: "skipped" }),
          apiFetch(inventoryUrl, { method: "GET" }),
        ]
      : [
          apiFetch(summaryUrl, { method: "GET" }),
          apiFetch(inventoryUrl, { method: "GET" }),
        ];

    const [summaryRaw, inventoryRaw] = await Promise.allSettled(requests);

    let firstError = "";

    if (!append) {
      if (summaryRaw.status === "fulfilled") {
        setSummary(summaryRaw.value?.summary || null);
      } else if (summaryRaw.status !== "skipped") {
        setSummary(null);
        firstError =
          firstError ||
          summaryRaw.reason?.data?.error ||
          summaryRaw.reason?.message ||
          "Failed to load inventory summary";
      }
    }

    if (inventoryRaw.status === "fulfilled") {
      const rows = Array.isArray(inventoryRaw.value?.inventory)
        ? inventoryRaw.value.inventory
            .map(normalizeInventoryRow)
            .filter(Boolean)
        : [];

      const meta = inventoryRaw.value?.meta || {
        total: rows.length,
        limit: PAGE_SIZE,
        offset: offsetOverride,
        hasMore: false,
      };

      setInventoryRows((prev) => (append ? [...prev, ...rows] : rows));
      setInventoryMeta({
        total: Number(meta.total ?? 0),
        limit: Number(meta.limit ?? PAGE_SIZE),
        offset: Number(meta.offset ?? offsetOverride),
        hasMore: !!meta.hasMore,
      });

      if (!append) {
        setSelectedRowKey((prev) =>
          prev && rows.some((x) => `${x.productId}-${x.locationId}` === prev)
            ? prev
            : rows[0]
              ? `${rows[0].productId}-${rows[0].locationId}`
              : null,
        );
      }
    } else {
      if (!append) {
        setInventoryRows([]);
        setInventoryMeta({
          total: 0,
          limit: PAGE_SIZE,
          offset: 0,
          hasMore: false,
        });
      }

      firstError =
        firstError ||
        inventoryRaw.reason?.data?.error ||
        inventoryRaw.reason?.message ||
        "Failed to load owner inventory";
    }

    if (!append) {
      setErrorText(firstError);
      setLoading(false);
    } else {
      if (firstError) setErrorText(firstError);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    loadInventory({ append: false, offsetOverride: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, stockStatus, includeArchived, search]);

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

  async function handleLoadMore() {
    if (loadingMore || !inventoryMeta.hasMore) return;
    await loadInventory({
      append: true,
      offsetOverride: inventoryRows.length,
    });
  }

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
          >
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Branches"
                value={safeNumber(summaryTotals.branchesCount)}
                sub="Branches with inventory visibility"
                valueClassName="text-[20px] font-bold"
              />
              <StatCard
                label="Products"
                value={safeNumber(summaryTotals.productsCount)}
                sub="Visible product records"
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
            subtitle="Search, filter, and inspect inventory across branches."
          >
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <FilterShell>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Inventory filters
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
                  <FormInput
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search product, SKU, unit, branch, code"
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

                  <label className="inline-flex min-h-[48px] items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
                    <input
                      type="checkbox"
                      checked={includeArchived}
                      onChange={(e) => setIncludeArchived(e.target.checked)}
                    />
                    <span>Include archived products</span>
                  </label>
                </div>
              </FilterShell>

              <FilterShell>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Inventory status
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MetricTile
                    label="Total matched"
                    value={safeNumber(inventoryMeta.total)}
                    sub="Server-side filtered"
                  />
                  <MetricTile
                    label="Loaded now"
                    value={safeNumber(inventoryRows.length)}
                    sub="Currently rendered"
                  />
                  <MetricTile
                    label="Selected branch"
                    value={locationId ? "Filtered" : "All"}
                    sub={locationId ? "One branch only" : "Cross-branch"}
                  />
                  <MetricTile
                    label="Stock mode"
                    value={
                      STOCK_FILTERS.find((x) => x.value === stockStatus)
                        ?.label || "All stock"
                    }
                    sub="Current stock lens"
                  />
                </div>
              </FilterShell>
            </div>

            <div className="mt-5">
              {inventoryRows.length === 0 ? (
                <EmptyState text="No inventory rows match the current owner filters." />
              ) : (
                <div className="grid gap-4">
                  {inventoryRows.map((row) => (
                    <InventoryCard
                      key={`${row.productId}-${row.locationId}`}
                      row={row}
                      active={
                        `${row.productId}-${row.locationId}` === selectedRowKey
                      }
                      onSelect={(picked) =>
                        setSelectedRowKey(
                          `${picked?.productId}-${picked?.locationId}`,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {inventoryMeta.hasMore ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  {loadingMore ? "Loading..." : "Load 20 more"}
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
                  <Badge className={qtyTone(selectedRow.qtyOnHand)}>
                    {qtyLabel(selectedRow.qtyOnHand)}
                  </Badge>
                  <Badge className={activeTone(selectedRow.isActive !== false)}>
                    {selectedRow.isActive === false ? "Archived" : "Active"}
                  </Badge>
                  <Badge className={locationTone(selectedRow.locationStatus)}>
                    {safe(selectedRow.locationStatus) || "Branch"}
                  </Badge>
                </div>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                  <StatCard
                    label="Product"
                    value={safe(selectedRow.name) || "-"}
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

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Selected branch detail
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoTile
                        label="Branch"
                        value={`${safe(selectedRow.locationName) || "-"}${
                          safe(selectedRow.locationCode)
                            ? ` (${safe(selectedRow.locationCode)})`
                            : ""
                        }`}
                      />
                      <InfoTile
                        label="Branch status"
                        value={safe(selectedRow.locationStatus) || "-"}
                      />
                      <InfoTile
                        label="Product status"
                        value={
                          selectedRow.isActive === false ? "Archived" : "Active"
                        }
                      />
                      <InfoTile
                        label="Qty on hand"
                        value={String(safeNumber(selectedRow.qtyOnHand))}
                      />
                      <InfoTile
                        label="Unit"
                        value={safe(selectedRow.unit) || "-"}
                      />
                      <InfoTile
                        label="Max discount %"
                        value={String(
                          safeNumber(selectedRow.maxDiscountPercent),
                        )}
                      />
                      <InfoTile
                        label="Inventory value"
                        value={`${money(selectedRow.inventoryValue)} RWF`}
                      />
                      <InfoTile
                        label="Updated"
                        value={safeDate(selectedRow.updatedAt)}
                      />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Owner guidance
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      Inventory value is calculated from quantity on hand
                      multiplied by purchase price. This is an owner capital
                      view, not projected sales revenue. Use this section to see
                      where capital is tied up, where shortages are forming, and
                      which branches need rebalancing.
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <MetricTile
                        label="Stock health"
                        value={qtyLabel(selectedRow.qtyOnHand)}
                        sub="Based on selected row qty"
                        tone={
                          safeNumber(selectedRow.qtyOnHand) <= 5
                            ? "danger"
                            : "default"
                        }
                      />
                      <MetricTile
                        label="Branch view"
                        value={safe(selectedRow.locationName) || "-"}
                        sub="Current selected branch"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Cross-branch product view
                  </div>

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
                    <div className="mt-4 space-y-4">
                      <div className="rounded-[22px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-bold text-stone-950 dark:text-stone-50">
                            {safe(selectedProductDetail.displayName) ||
                              safe(selectedProductDetail.name) ||
                              "-"}
                          </div>

                          <Badge className="border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                            {displayCategoryChip(selectedProductDetail)}
                          </Badge>
                        </div>

                        <div className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                          SKU: {safe(selectedProductDetail.sku) || "-"} · Stock:{" "}
                          {safe(
                            selectedProductDetail.stockUnit ||
                              selectedProductDetail.unit,
                          ) || "-"}{" "}
                          · Sales:{" "}
                          {safe(selectedProductDetail.salesUnit) || "-"} ·
                          Purchase:{" "}
                          {safe(selectedProductDetail.purchaseUnit) || "-"}
                        </div>

                        <div className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                          Business label:{" "}
                          {safe(selectedProductDetail.category) || "-"}
                        </div>
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
