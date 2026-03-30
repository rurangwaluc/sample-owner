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

const PRODUCT_STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

const SYSTEM_CATEGORY_OPTIONS = [
  "WOVEN_PP_BAG",
  "LAMINATED_PP_BAG",
  "BOPP_LAMINATED_BAG",
  "LINER_PP_BAG",
  "VALVE_PP_BAG",
  "GUSSETED_PP_BAG",
  "VENTILATED_PP_BAG",
  "MESH_PP_BAG",
  "FIBC_JUMBO_BAG",
  "OTHER_PP_BAG",
];

const UNIT_OPTIONS = [
  "BAG",
  "BALE",
  "PIECE",
  "BUNDLE",
  "PACK",
  "DOZEN",
  "CARTON",
  "ROLL",
  "KILOGRAM",
];

const PAGE_SIZE = 20;

function money(v) {
  return safeNumber(v).toLocaleString();
}

function displayCategoryChip(row) {
  return safe(row?.systemCategory) || safe(row?.category) || "OTHER_PP_BAG";
}

function productStatusTone(isActive) {
  return isActive
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
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

function normalizeProduct(row) {
  if (!row) return null;

  return {
    productId: Number(row.productId ?? row.id ?? 0),
    id: Number(row.productId ?? row.id ?? 0),
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
      row.purchasePrice ?? row.purchase_price ?? row.costPrice ?? 0,
    ),
    costPrice: Number(
      row.costPrice ?? row.cost_price ?? row.purchasePrice ?? 0,
    ),
    maxDiscountPercent: Number(
      row.maxDiscountPercent ?? row.max_discount_percent ?? 0,
    ),
    trackInventory:
      row.trackInventory ?? row.track_inventory ?? row.trackinventory ?? true,
    reorderLevel: Number(row.reorderLevel ?? row.reorder_level ?? 0),
    attributes: row.attributes ?? null,
    notes: row.notes ?? "",
    isActive: row.isActive ?? row.is_active ?? row.isactive ?? true,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    qtyOnHand: Number(row.qtyOnHand ?? row.qty_on_hand ?? 0),
  };
}

function ProductListRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "hidden w-full grid-cols-[minmax(260px,2fr)_120px_160px_120px_120px_90px_120px] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left transition last:border-b-0 lg:grid " +
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
          {safe(row?.brand) || "-"}
          {safe(row?.model) ? ` · ${safe(row.model)}` : ""}
          {safe(row?.size) ? ` · ${safe(row.size)}` : ""}
          {safe(row?.color) ? ` · ${safe(row.color)}` : ""}
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

      <div className="text-sm font-semibold">{money(row?.sellingPrice)}</div>
      <div className="text-sm font-semibold">{money(row?.purchasePrice)}</div>
      <div className="text-sm font-bold">{safeNumber(row?.qtyOnHand)}</div>

      <div className="flex flex-wrap gap-2 justify-start">
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (active
              ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
              : productStatusTone(row?.isActive !== false))
          }
        >
          {row?.isActive === false ? "Archived" : "Active"}
        </span>
      </div>
    </button>
  );
}

function ProductMobileRow({ row, active, onSelect }) {
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
              : productStatusTone(row?.isActive !== false))
          }
        >
          {row?.isActive === false ? "Archived" : "Active"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
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
            Qty
          </p>
          <p className="mt-1 text-sm font-bold">{safeNumber(row?.qtyOnHand)}</p>
        </div>
      </div>
    </button>
  );
}

export default function OwnerProductsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductBranches, setSelectedProductBranches] = useState(null);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [includeArchived, setIncludeArchived] = useState(true);
  const [locationFilter, setLocationFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const [modalError, setModalError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    locationId: "",
    name: "",
    displayName: "",
    systemCategory: "WOVEN_PP_BAG",
    category: "",
    subcategory: "",
    sku: "",
    barcode: "",
    supplierSku: "",
    brand: "",
    model: "",
    size: "",
    color: "",
    material: "POLYPROPYLENE",
    variantSummary: "",
    stockUnit: "BAG",
    salesUnit: "BAG",
    purchaseUnit: "BALE",
    purchaseUnitFactor: "1",
    sellingPrice: "",
    costPrice: "",
    maxDiscountPercent: "0",
    openingQty: "0",
    reorderLevel: "0",
    trackInventory: true,
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    displayName: "",
    systemCategory: "WOVEN_PP_BAG",
    category: "",
    subcategory: "",
    sku: "",
    barcode: "",
    supplierSku: "",
    brand: "",
    model: "",
    size: "",
    color: "",
    material: "POLYPROPYLENE",
    variantSummary: "",
    unit: "PIECE",
    stockUnit: "BAG",
    salesUnit: "BAG",
    purchaseUnit: "BALE",
    purchaseUnitFactor: "1",
    reorderLevel: "0",
    trackInventory: true,
    notes: "",
  });

  const [pricingForm, setPricingForm] = useState({
    purchasePrice: "",
    sellingPrice: "",
    maxDiscountPercent: "",
  });

  const [archiveReason, setArchiveReason] = useState("");

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

  async function loadProducts() {
    setLoading(true);
    setErrorText("");

    const summaryParams = new URLSearchParams();
    if (includeArchived) summaryParams.set("includeInactive", "true");

    const listParams = new URLSearchParams();
    if (locationFilter) listParams.set("locationId", locationFilter);
    if (search.trim()) listParams.set("search", search.trim());
    if (statusFilter) listParams.set("status", statusFilter);
    if (includeArchived) listParams.set("includeInactive", "true");

    const summaryUrl = `/owner/products/summary${
      summaryParams.toString() ? `?${summaryParams.toString()}` : ""
    }`;
    const listUrl = `/owner/products${
      listParams.toString() ? `?${listParams.toString()}` : ""
    }`;

    const [summaryRes, listRes] = await Promise.allSettled([
      apiFetch(summaryUrl, { method: "GET" }),
      apiFetch(listUrl, { method: "GET" }),
    ]);

    let nextError = "";

    if (summaryRes.status === "fulfilled") {
      setSummary(summaryRes.value?.summary || null);
    } else {
      setSummary(null);
      nextError =
        summaryRes.reason?.data?.error ||
        summaryRes.reason?.message ||
        "Products summary request failed";
    }

    if (listRes.status === "fulfilled") {
      const rows = Array.isArray(listRes.value?.products)
        ? listRes.value.products.map(normalizeProduct).filter(Boolean)
        : [];

      setProducts(rows);

      setSelectedProductId((prev) =>
        prev && rows.some((x) => String(x.productId) === String(prev))
          ? prev
          : (rows[0]?.productId ?? null),
      );
    } else {
      setProducts([]);
      nextError =
        listRes.reason?.data?.error ||
        listRes.reason?.message ||
        "Products list request failed";
    }

    setErrorText(nextError);
    setLoading(false);
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [locationFilter, statusFilter, includeArchived, search]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, statusFilter, includeArchived]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const visibleRows = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount],
  );

  const hasMoreRows = visibleCount < products.length;

  const selectedProduct =
    selectedProductId == null
      ? null
      : products.find(
          (row) => String(row.productId) === String(selectedProductId),
        ) || null;

  useEffect(() => {
    async function loadBranches() {
      if (!selectedProduct?.productId) {
        setSelectedProductBranches(null);
        return;
      }

      setBranchesLoading(true);

      try {
        const result = await apiFetch(
          `/owner/products/${selectedProduct.productId}/branches?includeInactive=true`,
          { method: "GET" },
        );
        setSelectedProductBranches(result?.product || null);
      } catch {
        setSelectedProductBranches(null);
      } finally {
        setBranchesLoading(false);
      }
    }

    loadBranches();
  }, [selectedProduct?.productId]);

  const summaryTotals = summary?.totals || {
    branchesCount: 0,
    productsCount: products.length,
    activeProductsCount: products.filter((x) => x.isActive !== false).length,
    archivedProductsCount: products.filter((x) => x.isActive === false).length,
  };

  const categorySummary = useMemo(() => {
    const rows = Array.isArray(summary?.bySystemCategory)
      ? summary.bySystemCategory
      : [];
    const first = rows[0] || null;

    return {
      topCategory: safe(first?.systemCategory) || "-",
      topCategoryCount: safeNumber(first?.productsCount || 0),
    };
  }, [summary]);

  function resetCreateModal() {
    setCreateModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
    setCreateForm({
      locationId: activeLocationOptions[0]?.id
        ? String(activeLocationOptions[0].id)
        : "",
      name: "",
      displayName: "",
      systemCategory: "WOVEN_PP_BAG",
      category: "",
      subcategory: "",
      sku: "",
      barcode: "",
      supplierSku: "",
      brand: "",
      model: "",
      size: "",
      color: "",
      material: "POLYPROPYLENE",
      variantSummary: "",
      stockUnit: "BAG",
      salesUnit: "BAG",
      purchaseUnit: "BALE",
      purchaseUnitFactor: "1",
      sellingPrice: "",
      costPrice: "",
      maxDiscountPercent: "0",
      openingQty: "0",
      reorderLevel: "0",
      trackInventory: true,
      notes: "",
    });
  }

  function openCreateModal() {
    setCreateForm({
      locationId: activeLocationOptions[0]?.id
        ? String(activeLocationOptions[0].id)
        : "",
      name: "",
      displayName: "",
      systemCategory: "WOVEN_PP_BAG",
      category: "",
      subcategory: "",
      sku: "",
      barcode: "",
      supplierSku: "",
      brand: "",
      model: "",
      size: "",
      color: "",
      material: "POLYPROPYLENE",
      variantSummary: "",
      stockUnit: "BAG",
      salesUnit: "BAG",
      purchaseUnit: "BALE",
      purchaseUnitFactor: "1",
      sellingPrice: "",
      costPrice: "",
      maxDiscountPercent: "0",
      openingQty: "0",
      reorderLevel: "0",
      trackInventory: true,
      notes: "",
    });
    setModalError("");
    setCreateModalOpen(true);
  }

  function closeEditModal() {
    setEditModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
  }

  function openEditModal() {
    if (!selectedProduct) return;

    setEditForm({
      name: safe(selectedProduct.name),
      displayName: safe(selectedProduct.displayName),
      systemCategory: safe(selectedProduct.systemCategory) || "WOVEN_PP_BAG",
      category: safe(selectedProduct.category),
      subcategory: safe(selectedProduct.subcategory),
      sku: safe(selectedProduct.sku),
      barcode: safe(selectedProduct.barcode),
      supplierSku: safe(selectedProduct.supplierSku),
      brand: safe(selectedProduct.brand),
      model: safe(selectedProduct.model),
      size: safe(selectedProduct.size),
      color: safe(selectedProduct.color),
      material: safe(selectedProduct.material),
      variantSummary: safe(selectedProduct.variantSummary),
      unit:
        safe(selectedProduct.unit) || safe(selectedProduct.stockUnit) || "BAG",
      stockUnit:
        safe(selectedProduct.stockUnit) || safe(selectedProduct.unit) || "BAG",
      salesUnit:
        safe(selectedProduct.salesUnit) || safe(selectedProduct.unit) || "BAG",
      purchaseUnit:
        safe(selectedProduct.purchaseUnit) ||
        safe(selectedProduct.unit) ||
        "BAG",
      purchaseUnitFactor: String(
        safeNumber(selectedProduct.purchaseUnitFactor || 1),
      ),
      reorderLevel: String(safeNumber(selectedProduct.reorderLevel || 0)),
      trackInventory: !!selectedProduct.trackInventory,
      notes: safe(selectedProduct.notes),
    });

    setModalError("");
    setEditModalOpen(true);
  }

  function openPricingModal() {
    if (!selectedProduct) return;

    setPricingForm({
      purchasePrice: String(safeNumber(selectedProduct.purchasePrice)),
      sellingPrice: String(safeNumber(selectedProduct.sellingPrice)),
      maxDiscountPercent: String(
        safeNumber(selectedProduct.maxDiscountPercent),
      ),
    });
    setModalError("");
    setPricingModalOpen(true);
  }

  function openArchiveModal() {
    if (!selectedProduct) return;
    setArchiveReason("");
    setModalError("");
    setArchiveModalOpen(true);
  }

  function closePricingModal() {
    setPricingModalOpen(false);
    setModalError("");
    setModalSubmitting(false);
  }

  function closeArchiveModal() {
    setArchiveModalOpen(false);
    setArchiveReason("");
    setModalError("");
    setModalSubmitting(false);
  }

  async function createProduct() {
    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch("/owner/products", {
        method: "POST",
        body: {
          locationId: safeNumber(createForm.locationId),
          name: safe(createForm.name),
          displayName: safe(createForm.displayName) || undefined,
          systemCategory: safe(createForm.systemCategory) || "WOVEN_PP_BAG",
          category: safe(createForm.category) || undefined,
          subcategory: safe(createForm.subcategory) || undefined,
          sku: safe(createForm.sku) || undefined,
          barcode: safe(createForm.barcode) || undefined,
          supplierSku: safe(createForm.supplierSku) || undefined,
          brand: safe(createForm.brand) || undefined,
          model: safe(createForm.model) || undefined,
          size: safe(createForm.size) || undefined,
          color: safe(createForm.color) || undefined,
          material: safe(createForm.material) || undefined,
          variantSummary: safe(createForm.variantSummary) || undefined,
          unit: safe(createForm.stockUnit) || "BAG",
          stockUnit: safe(createForm.stockUnit) || undefined,
          salesUnit: safe(createForm.salesUnit) || undefined,
          purchaseUnit: safe(createForm.purchaseUnit) || undefined,
          purchaseUnitFactor: safeNumber(createForm.purchaseUnitFactor) || 1,
          sellingPrice: safeNumber(createForm.sellingPrice),
          costPrice: safeNumber(createForm.costPrice),
          maxDiscountPercent: safeNumber(createForm.maxDiscountPercent),
          openingQty: safeNumber(createForm.openingQty),
          reorderLevel: safeNumber(createForm.reorderLevel),
          trackInventory: !!createForm.trackInventory,
          notes: safe(createForm.notes) || undefined,
        },
      });

      resetCreateModal();
      await loadProducts();
      setSuccessText("Product created successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to create product",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function updateProduct() {
    if (!selectedProduct?.productId) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/products/${selectedProduct.productId}`, {
        method: "PATCH",
        body: {
          name: safe(editForm.name),
          displayName: safe(editForm.displayName) || undefined,
          systemCategory: safe(editForm.systemCategory) || "WOVEN_PP_BAG",
          category: safe(editForm.category) || undefined,
          subcategory: safe(editForm.subcategory) || undefined,
          sku: safe(editForm.sku) || undefined,
          barcode: safe(editForm.barcode) || undefined,
          supplierSku: safe(editForm.supplierSku) || undefined,
          brand: safe(editForm.brand) || undefined,
          model: safe(editForm.model) || undefined,
          size: safe(editForm.size) || undefined,
          color: safe(editForm.color) || undefined,
          material: safe(editForm.material) || undefined,
          variantSummary: safe(editForm.variantSummary) || undefined,
          unit: safe(editForm.unit) || undefined,
          stockUnit: safe(editForm.stockUnit) || undefined,
          salesUnit: safe(editForm.salesUnit) || undefined,
          purchaseUnit: safe(editForm.purchaseUnit) || undefined,
          purchaseUnitFactor: safeNumber(editForm.purchaseUnitFactor) || 1,
          reorderLevel: safeNumber(editForm.reorderLevel),
          trackInventory: !!editForm.trackInventory,
          notes: safe(editForm.notes) || undefined,
        },
      });

      closeEditModal();
      await loadProducts();
      setSelectedProductId(selectedProduct.productId);
      setSuccessText("Product updated successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to update product",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function updatePricing() {
    if (!selectedProduct?.productId) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/products/${selectedProduct.productId}/pricing`, {
        method: "PATCH",
        body: {
          purchasePrice: safeNumber(pricingForm.purchasePrice),
          sellingPrice: safeNumber(pricingForm.sellingPrice),
          maxDiscountPercent: safeNumber(pricingForm.maxDiscountPercent),
        },
      });

      closePricingModal();
      await loadProducts();
      setSelectedProductId(selectedProduct.productId);
      setSuccessText("Product pricing updated successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to update pricing",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function archiveProduct() {
    if (!selectedProduct?.productId) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/products/${selectedProduct.productId}/archive`, {
        method: "POST",
        body: {
          reason: safe(archiveReason) || undefined,
        },
      });

      closeArchiveModal();
      await loadProducts();
      setSelectedProductId(selectedProduct.productId);
      setSuccessText("Product archived successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to archive product",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function restoreProduct() {
    if (!selectedProduct?.productId) return;

    setErrorText("");
    setSuccessText("");

    try {
      await apiFetch(`/owner/products/${selectedProduct.productId}/restore`, {
        method: "POST",
      });

      await loadProducts();
      setSelectedProductId(selectedProduct.productId);
      setSuccessText("Product restored successfully.");
    } catch (error) {
      setErrorText(
        error?.data?.error || error?.message || "Failed to restore product",
      );
    }
  }

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Products"
          subtitle="Loading owner cross-branch products."
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
            title="Cross-branch products summary"
            subtitle="Owner-wide catalog visibility across branches, categories, and product states."
            right={
              <AsyncButton
                idleText="Create product"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => openCreateModal()}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Branches"
                value={safeNumber(summaryTotals.branchesCount)}
                sub="Branches with product records"
              />
              <StatCard
                label="Products"
                value={safeNumber(summaryTotals.productsCount)}
                sub="Catalog records across branches"
              />
              <StatCard
                label="Active"
                value={safeNumber(summaryTotals.activeProductsCount)}
                sub="Currently usable records"
              />
              <StatCard
                label="Archived"
                value={safeNumber(summaryTotals.archivedProductsCount)}
                sub="Hidden but preserved records"
              />
              <StatCard
                label="Top system type"
                value={categorySummary.topCategory}
                valueClassName="text-xl sm:text-lg leading-tight"
                sub={`${categorySummary.topCategoryCount} products`}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Products directory"
            subtitle="Search, filter, inspect, and manage products across all branches."
          >
            <div className="grid gap-3 lg:grid-cols-4">
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, display name, SKU, brand, barcode, branch"
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
                {PRODUCT_STATUS_FILTERS.map((row) => (
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
                Showing {Math.min(visibleRows.length, products.length)} of{" "}
                {products.length}
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="hidden grid-cols-[minmax(260px,2fr)_120px_160px_120px_120px_90px_120px] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-stone-950 dark:text-stone-400 lg:grid">
                <div>Product</div>
                <div>SKU</div>
                <div>Branch</div>
                <div>Selling</div>
                <div>Purchase</div>
                <div>Qty</div>
                <div>Status</div>
              </div>

              {products.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No products match the current owner filters." />
                </div>
              ) : (
                <div>
                  {visibleRows.map((row) => (
                    <div key={row.productId}>
                      <ProductListRow
                        row={row}
                        active={
                          String(row.productId) === String(selectedProductId)
                        }
                        onSelect={(picked) =>
                          setSelectedProductId(picked?.productId)
                        }
                      />
                      <div className="p-3 lg:hidden">
                        <ProductMobileRow
                          row={row}
                          active={
                            String(row.productId) === String(selectedProductId)
                          }
                          onSelect={(picked) =>
                            setSelectedProductId(picked?.productId)
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

          {selectedProduct ? (
            <SectionCard
              title="Selected product detail"
              subtitle="Focused cross-branch product detail with owner actions and branch-level distribution."
              right={
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${productStatusTone(
                      selectedProduct.isActive !== false,
                    )}`}
                  >
                    {selectedProduct.isActive === false ? "Archived" : "Active"}
                  </span>
                </div>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <StatCard
                    label="Product"
                    value={
                      safe(selectedProduct.displayName) ||
                      safe(selectedProduct.name) ||
                      "-"
                    }
                    valueClassName="text-xl sm:text-lg leading-tight"
                    sub={`SKU: ${safe(selectedProduct.sku) || "-"}`}
                  />
                  <StatCard
                    label="Branch"
                    value={safe(selectedProduct.locationName) || "-"}
                    valueClassName="text-xl sm:text-lg leading-tight"
                    sub={safe(selectedProduct.locationCode) || "-"}
                  />
                  <StatCard
                    label="Selling price"
                    value={money(selectedProduct.sellingPrice)}
                    sub="Current selling price"
                  />
                  <StatCard
                    label="Purchase price"
                    value={money(selectedProduct.purchasePrice)}
                    sub="Current purchase price"
                  />
                  <StatCard
                    label="Qty on hand"
                    value={safeNumber(selectedProduct.qtyOnHand)}
                    sub="Current recorded stock"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Product detail
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Product
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.displayName) ||
                            safe(selectedProduct.name) ||
                            "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Category
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.category) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Subcategory
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.subcategory) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          SKU
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.sku) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Barcode
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.barcode) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Supplier SKU
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.supplierSku) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Brand / Model
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.brand) || "-"}
                          {safe(selectedProduct.model)
                            ? ` / ${safe(selectedProduct.model)}`
                            : ""}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Size / Color
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.size) || "-"}
                          {safe(selectedProduct.color)
                            ? ` / ${safe(selectedProduct.color)}`
                            : ""}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Material
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.material) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Variant summary
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.variantSummary) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Stock / Sales / Purchase unit
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(
                            selectedProduct.stockUnit || selectedProduct.unit,
                          ) || "-"}
                          {" / "}
                          {safe(selectedProduct.salesUnit) || "-"}
                          {" / "}
                          {safe(selectedProduct.purchaseUnit) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Purchase unit factor
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safeNumber(selectedProduct.purchaseUnitFactor)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Reorder level
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safeNumber(selectedProduct.reorderLevel)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Track inventory
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {selectedProduct.trackInventory ? "Yes" : "No"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Max discount
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safeNumber(selectedProduct.maxDiscountPercent)}%
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Branch
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.locationName) || "-"}{" "}
                          {safe(selectedProduct.locationCode)
                            ? `(${safe(selectedProduct.locationCode)})`
                            : ""}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Branch status
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safe(selectedProduct.locationStatus) || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-stone-500 dark:text-stone-400">
                          Created
                        </span>
                        <span className="text-right text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                          {safeDate(selectedProduct.createdAt)}
                        </span>
                      </div>

                      <div className="border-t border-stone-200 pt-3 dark:border-stone-800">
                        <p className="text-stone-500 dark:text-stone-400">
                          Notes
                        </p>
                        <p className="mt-2 leading-6 text-stone-800 dark:text-stone-200">
                          {safe(selectedProduct.notes) || "No notes recorded."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Owner actions
                    </p>

                    <div className="mt-4 space-y-3">
                      <AsyncButton
                        idleText="Edit product"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => openEditModal()}
                        className="w-full"
                      />

                      <AsyncButton
                        idleText="Update pricing"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => openPricingModal()}
                        className="w-full"
                        variant="secondary"
                      />

                      {selectedProduct?.isActive !== false ? (
                        <AsyncButton
                          idleText="Archive product"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () => openArchiveModal()}
                          variant="secondary"
                          className="w-full"
                        />
                      ) : (
                        <AsyncButton
                          idleText="Restore product"
                          loadingText="Restoring..."
                          successText="Done"
                          onClick={async () => restoreProduct()}
                          className="w-full"
                        />
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      This owner tab now matches the richer backend product
                      model, including system category, business label, units,
                      pricing, and stock behavior.
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Product branches view
                  </p>

                  {branchesLoading ? (
                    <div className="mt-4 space-y-3">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-24 animate-pulse rounded-2xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
                        />
                      ))}
                    </div>
                  ) : !selectedProductBranches ? (
                    <div className="mt-4">
                      <EmptyState text="No branch product detail available." />
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {(selectedProductBranches.branches || []).map(
                        (branch) => (
                          <div
                            key={`${selectedProductBranches.productId}-${branch.locationId}`}
                            className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-[13px] font-semibold leading-5 text-stone-900 dark:text-stone-100">
                                  {safe(branch.locationName) || "-"}
                                </p>
                                <p className="mt-1 text-[11px] leading-5 text-stone-500 dark:text-stone-400">
                                  {safe(branch.locationCode) || "-"} ·{" "}
                                  {safe(branch.locationStatus) || "-"}
                                </p>
                              </div>

                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${productStatusTone(
                                  branch.isActive !== false,
                                )}`}
                              >
                                {branch.isActive === false
                                  ? "Archived"
                                  : "Active"}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-4">
                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                  Qty
                                </p>
                                <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                  {safeNumber(branch.qtyOnHand)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                  Sell
                                </p>
                                <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                  {money(branch.sellingPrice)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                  Buy
                                </p>
                                <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                                  {money(branch.purchasePrice)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                                  Updated
                                </p>
                                <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                                  {safeDate(branch.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Selected product detail"
              subtitle="This section appears after the owner deliberately selects a product."
            >
              <EmptyState text="Click any product row above to inspect details and manage the product." />
            </SectionCard>
          )}
        </>
      )}

      <OverlayModal
        open={createModalOpen}
        title="Create product"
        subtitle="Create a rich product record in a chosen active branch."
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
              onClick={createProduct}
              disabled={
                modalSubmitting ||
                !safe(createForm.locationId) ||
                !safe(createForm.name) ||
                safeNumber(createForm.sellingPrice) < 0
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Creating..." : "Create product"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />
          <div>
            <FieldLabel htmlFor="product-branch">Active branch</FieldLabel>
            <FormSelect
              id="product-branch"
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
                  {safe(row.name)} {safe(row.code) ? `(${safe(row.code)})` : ""}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="product-name">Product name</FieldLabel>
              <FormInput
                id="product-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. PP Woven Rice Bag 25KG"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-display-name">
                Display name
              </FieldLabel>
              <FormInput
                id="product-display-name"
                value={createForm.displayName}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Optional richer display name"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel htmlFor="product-category">
                System category
              </FieldLabel>
              <FormSelect
                id="product-category"
                value={createForm.systemCategory}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    systemCategory: e.target.value,
                  }))
                }
              >
                {SYSTEM_CATEGORY_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="product-business-category">
                Business label
              </FieldLabel>
              <FormInput
                id="product-business-category"
                value={createForm.category}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    systemCategory: e.target.value,
                  }))
                }
                placeholder="RICE, SUGAR, FLOUR EXPORT"
              />
            </div>
            <div>
              <FieldLabel htmlFor="product-subcategory">Subcategory</FieldLabel>
              <FormInput
                id="product-subcategory"
                value={createForm.subcategory}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    subcategory: e.target.value,
                  }))
                }
                placeholder="Optional subcategory"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-sku">SKU</FieldLabel>
              <FormInput
                id="product-sku"
                value={createForm.sku}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="Internal SKU"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel htmlFor="product-barcode">Barcode</FieldLabel>
              <FormInput
                id="product-barcode"
                value={createForm.barcode}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    barcode: e.target.value,
                  }))
                }
                placeholder="Optional barcode"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-supplier-sku">
                Supplier SKU
              </FieldLabel>
              <FormInput
                id="product-supplier-sku"
                value={createForm.supplierSku}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    supplierSku: e.target.value,
                  }))
                }
                placeholder="Supplier code"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-brand">Brand</FieldLabel>
              <FormInput
                id="product-brand"
                value={createForm.brand}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, brand: e.target.value }))
                }
                placeholder="Brand"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel htmlFor="product-model">Model</FieldLabel>
              <FormInput
                id="product-model"
                value={createForm.model}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder="Model"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-size">Size</FieldLabel>
              <FormInput
                id="product-size"
                value={createForm.size}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, size: e.target.value }))
                }
                placeholder="Size"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-color">Color</FieldLabel>
              <FormInput
                id="product-color"
                value={createForm.color}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, color: e.target.value }))
                }
                placeholder="Color"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-material">Material</FieldLabel>
              <FormInput
                id="product-material"
                value={createForm.material}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    material: e.target.value,
                  }))
                }
                placeholder="POLYPROPYLENE"
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="product-variant-summary">
              Variant summary
            </FieldLabel>
            <FormInput
              id="product-variant-summary"
              value={createForm.variantSummary}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  variantSummary: e.target.value,
                }))
              }
              placeholder="Optional variant summary"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel htmlFor="product-stock-unit">Stock unit</FieldLabel>
              <FormSelect
                id="product-stock-unit"
                value={createForm.stockUnit}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    stockUnit: e.target.value,
                  }))
                }
              >
                {UNIT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="product-sales-unit">Sales unit</FieldLabel>
              <FormSelect
                id="product-sales-unit"
                value={createForm.salesUnit}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    salesUnit: e.target.value,
                  }))
                }
              >
                {UNIT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="product-purchase-unit">
                Purchase unit
              </FieldLabel>
              <FormSelect
                id="product-purchase-unit"
                value={createForm.purchaseUnit}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    purchaseUnit: e.target.value,
                  }))
                }
              >
                {UNIT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="product-purchase-unit-factor">
                Purchase unit factor
              </FieldLabel>
              <FormInput
                id="product-purchase-unit-factor"
                type="number"
                min="1"
                value={createForm.purchaseUnitFactor}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    purchaseUnitFactor: e.target.value,
                  }))
                }
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <FieldLabel htmlFor="product-selling">Selling price</FieldLabel>
              <FormInput
                id="product-selling"
                type="number"
                min="0"
                value={createForm.sellingPrice}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    sellingPrice: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-cost">Purchase price</FieldLabel>
              <FormInput
                id="product-cost"
                type="number"
                min="0"
                value={createForm.costPrice}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    costPrice: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-discount">Max discount %</FieldLabel>
              <FormInput
                id="product-discount"
                type="number"
                min="0"
                max="100"
                value={createForm.maxDiscountPercent}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    maxDiscountPercent: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-opening-qty">Opening qty</FieldLabel>
              <FormInput
                id="product-opening-qty"
                type="number"
                min="0"
                value={createForm.openingQty}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    openingQty: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-reorder-level">
                Reorder level
              </FieldLabel>
              <FormInput
                id="product-reorder-level"
                type="number"
                min="0"
                value={createForm.reorderLevel}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    reorderLevel: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <label className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200">
            <input
              type="checkbox"
              checked={createForm.trackInventory}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  trackInventory: e.target.checked,
                }))
              }
            />
            <span>Track inventory for this product</span>
          </label>

          <div>
            <FieldLabel htmlFor="product-notes">Notes</FieldLabel>
            <FormTextarea
              id="product-notes"
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Optional notes"
            />
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={editModalOpen}
        title="Edit product"
        subtitle="Update product identity, classification, units, and operational details."
        onClose={closeEditModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeEditModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updateProduct}
              disabled={modalSubmitting || !safe(editForm.name)}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Saving..." : "Save product"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="edit-product-name">Product name</FieldLabel>
              <FormInput
                id="edit-product-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Product name"
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-display-name">
                Display name
              </FieldLabel>
              <FormInput
                id="edit-product-display-name"
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Optional richer display name"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel htmlFor="edit-product-category">
                System category
              </FieldLabel>
              <FormSelect
                id="edit-product-category"
                value={editForm.systemCategory}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              >
                {SYSTEM_CATEGORY_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-business-category">
                Business label
              </FieldLabel>
              <FormInput
                id="edit-product-business-category"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="RICE, SUGAR, FLOUR EXPORT"
              />
            </div>
            <div>
              <FieldLabel htmlFor="edit-product-subcategory">
                Subcategory
              </FieldLabel>
              <FormInput
                id="edit-product-subcategory"
                value={editForm.subcategory}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    subcategory: e.target.value,
                  }))
                }
                placeholder="Optional subcategory"
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-sku">SKU</FieldLabel>
              <FormInput
                id="edit-product-sku"
                value={editForm.sku}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="Internal SKU"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel htmlFor="edit-product-barcode">Barcode</FieldLabel>
              <FormInput
                id="edit-product-barcode"
                value={editForm.barcode}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    barcode: e.target.value,
                  }))
                }
                placeholder="Optional barcode"
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-supplier-sku">
                Supplier SKU
              </FieldLabel>
              <FormInput
                id="edit-product-supplier-sku"
                value={editForm.supplierSku}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    supplierSku: e.target.value,
                  }))
                }
                placeholder="Supplier code"
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-brand">Brand</FieldLabel>
              <FormInput
                id="edit-product-brand"
                value={editForm.brand}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, brand: e.target.value }))
                }
                placeholder="Brand"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel htmlFor="edit-product-model">Model</FieldLabel>
              <FormInput
                id="edit-product-model"
                value={editForm.model}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder="Model"
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-size">Size</FieldLabel>
              <FormInput
                id="edit-product-size"
                value={editForm.size}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, size: e.target.value }))
                }
                placeholder="Size"
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-color">Color</FieldLabel>
              <FormInput
                id="edit-product-color"
                value={editForm.color}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, color: e.target.value }))
                }
                placeholder="Color"
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-material">Material</FieldLabel>
              <FormInput
                id="edit-product-material"
                value={editForm.material}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    material: e.target.value,
                  }))
                }
                placeholder="POLYPROPYLENE"
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="edit-product-variant-summary">
              Variant summary
            </FieldLabel>
            <FormInput
              id="edit-product-variant-summary"
              value={editForm.variantSummary}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  variantSummary: e.target.value,
                }))
              }
              placeholder="Optional variant summary"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel htmlFor="edit-product-unit">Legacy unit</FieldLabel>
              <FormSelect
                id="edit-product-unit"
                value={editForm.unit}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    unit: e.target.value,
                  }))
                }
              >
                {UNIT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-stock-unit">
                Stock unit
              </FieldLabel>
              <FormSelect
                id="edit-product-stock-unit"
                value={editForm.stockUnit}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    stockUnit: e.target.value,
                  }))
                }
              >
                {UNIT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-sales-unit">
                Sales unit
              </FieldLabel>
              <FormSelect
                id="edit-product-sales-unit"
                value={editForm.salesUnit}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    salesUnit: e.target.value,
                  }))
                }
              >
                {UNIT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-purchase-unit">
                Purchase unit
              </FieldLabel>
              <FormSelect
                id="edit-product-purchase-unit"
                value={editForm.purchaseUnit}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    purchaseUnit: e.target.value,
                  }))
                }
              >
                {UNIT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="edit-product-purchase-unit-factor">
                Purchase unit factor
              </FieldLabel>
              <FormInput
                id="edit-product-purchase-unit-factor"
                type="number"
                min="1"
                value={editForm.purchaseUnitFactor}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    purchaseUnitFactor: e.target.value,
                  }))
                }
                placeholder="1"
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-product-reorder-level">
                Reorder level
              </FieldLabel>
              <FormInput
                id="edit-product-reorder-level"
                type="number"
                min="0"
                value={editForm.reorderLevel}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    reorderLevel: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <label className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200">
            <input
              type="checkbox"
              checked={editForm.trackInventory}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  trackInventory: e.target.checked,
                }))
              }
            />
            <span>Track inventory for this product</span>
          </label>

          <div>
            <FieldLabel htmlFor="edit-product-notes">Notes</FieldLabel>
            <FormTextarea
              id="edit-product-notes"
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Optional notes"
            />
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={pricingModalOpen}
        title="Update pricing"
        subtitle="Update pricing for the selected branch product record."
        onClose={closePricingModal}
        footer={
          <>
            <button
              type="button"
              onClick={closePricingModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updatePricing}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Saving..." : "Save pricing"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="pricing-purchase">Purchase price</FieldLabel>
              <FormInput
                id="pricing-purchase"
                type="number"
                min="0"
                value={pricingForm.purchasePrice}
                onChange={(e) =>
                  setPricingForm((prev) => ({
                    ...prev,
                    purchasePrice: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <FieldLabel htmlFor="pricing-selling">Selling price</FieldLabel>
              <FormInput
                id="pricing-selling"
                type="number"
                min="0"
                value={pricingForm.sellingPrice}
                onChange={(e) =>
                  setPricingForm((prev) => ({
                    ...prev,
                    sellingPrice: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <FieldLabel htmlFor="pricing-discount">Max discount %</FieldLabel>
              <FormInput
                id="pricing-discount"
                type="number"
                min="0"
                max="100"
                value={pricingForm.maxDiscountPercent}
                onChange={(e) =>
                  setPricingForm((prev) => ({
                    ...prev,
                    maxDiscountPercent: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={archiveModalOpen}
        title="Archive product"
        subtitle="Archive the selected branch product record without losing history."
        onClose={closeArchiveModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeArchiveModal}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={archiveProduct}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Archiving..." : "Confirm archive"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Product:{" "}
            <strong>
              {safe(selectedProduct?.displayName) ||
                safe(selectedProduct?.name)}
            </strong>{" "}
            — {safe(selectedProduct?.locationName)}
            {safe(selectedProduct?.locationCode)
              ? ` (${safe(selectedProduct.locationCode)})`
              : ""}
          </div>

          <div>
            <FieldLabel htmlFor="archive-reason">Reason</FieldLabel>
            <FormTextarea
              id="archive-reason"
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Why is this product being archived?"
            />
          </div>
        </div>
      </OverlayModal>
    </div>
  );
}
