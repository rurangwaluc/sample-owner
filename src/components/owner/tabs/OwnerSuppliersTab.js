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

function normalizeCurrency(v) {
  const s = String(v || "RWF")
    .trim()
    .toUpperCase();
  return s || "RWF";
}

function money(v, currency = "RWF") {
  return `${normalizeCurrency(currency)} ${safeNumber(v).toLocaleString()}`;
}

function supplierTone(sourceType) {
  const v = safe(sourceType).toUpperCase();
  if (v === "ABROAD") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300";
}

function activeTone(isActive) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
    : "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";
}

function neutralBadgeTone() {
  return "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300";
}

function normalizeSupplier(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    name: row.name ?? "",
    contactName: row.contactName ?? row.contact_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    country: row.country ?? "",
    city: row.city ?? "",
    sourceType: row.sourceType ?? row.source_type ?? "LOCAL",
    defaultCurrency: normalizeCurrency(
      row.defaultCurrency ?? row.default_currency ?? "RWF",
    ),
    address: row.address ?? "",
    notes: row.notes ?? "",
    isActive: row.isActive ?? row.is_active ?? true,
    billsCount: Number(row.billsCount ?? row.bills_count ?? 0),
    totalBilled: Number(row.totalBilled ?? row.total_billed ?? 0),
    totalPaid: Number(row.totalPaid ?? row.total_paid ?? 0),
    balanceDue: Number(row.balanceDue ?? row.balance_due ?? 0),
    overdueBillsCount: Number(
      row.overdueBillsCount ?? row.overdue_bills_count ?? 0,
    ),
    overdueAmount: Number(row.overdueAmount ?? row.overdue_amount ?? 0),
    lastBillDate: row.lastBillDate ?? row.last_bill_date ?? null,
    lastPaymentDate: row.lastPaymentDate ?? row.last_payment_date ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function SmallStat({ label, value, tone = "default", active = false }) {
  const classes =
    tone === "danger"
      ? active
        ? "border-rose-300/20 bg-rose-400/10 text-white dark:border-rose-900/20 dark:bg-rose-900/10 dark:text-stone-950"
        : "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
      : active
        ? "border-white/10 bg-white/5 dark:border-stone-900/10 dark:bg-stone-900/5"
        : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950";

  const labelClass =
    tone === "danger"
      ? active
        ? "text-rose-100 dark:text-rose-800"
        : "text-rose-700 dark:text-rose-300"
      : active
        ? "text-stone-300 dark:text-stone-600"
        : "text-stone-500 dark:text-stone-400";

  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <p className={`text-[11px] uppercase tracking-[0.14em] ${labelClass}`}>
        {label}
      </p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function SupplierCard({ row, active, onSelect }) {
  const currency = normalizeCurrency(row?.defaultCurrency);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "group w-full overflow-hidden rounded-[28px] border text-left transition-all duration-200 " +
        (active
          ? "border-stone-900 bg-stone-900 text-white shadow-lg dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-900")
      }
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold sm:text-lg">
                {safe(row?.name) || "-"}
              </h3>

              <Badge
                className={
                  active
                    ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                    : supplierTone(row?.sourceType)
                }
              >
                {safe(row?.sourceType) || "LOCAL"}
              </Badge>

              <Badge
                className={
                  active
                    ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                    : neutralBadgeTone()
                }
              >
                Default {currency}
              </Badge>

              <Badge
                className={
                  active
                    ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
                    : activeTone(!!row?.isActive)
                }
              >
                {row?.isActive ? "Active" : "Inactive"}
              </Badge>
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
                <span className="font-medium">Contact:</span>{" "}
                {safe(row?.contactName) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Phone:</span>{" "}
                {safe(row?.phone) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Email:</span>{" "}
                {safe(row?.email) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Country:</span>{" "}
                {safe(row?.country) || "-"}
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
              Current debt
            </p>
            <p className="mt-2 text-xl font-black sm:text-2xl">
              {money(row?.balanceDue, currency)}
            </p>
            <p
              className={
                "mt-1 text-xs " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              Based on current backend totals
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SmallStat
            label="Bills"
            value={safeNumber(row?.billsCount)}
            active={active}
          />
          <SmallStat
            label={`Billed (${currency})`}
            value={money(row?.totalBilled, currency)}
            active={active}
          />
          <SmallStat
            label={`Paid (${currency})`}
            value={money(row?.totalPaid, currency)}
            active={active}
          />
          <SmallStat
            label="Overdue bills"
            value={safeNumber(row?.overdueBillsCount)}
            tone="danger"
            active={active}
          />
          <SmallStat
            label={`Overdue (${currency})`}
            value={money(row?.overdueAmount, currency)}
            tone="danger"
            active={active}
          />
        </div>
      </div>
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-stone-900 sm:p-6">
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

function SupplierFormModal({ open, supplier, onClose, onSaved }) {
  const isEdit = !!supplier;

  const [form, setForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    country: "",
    city: "",
    sourceType: "LOCAL",
    defaultCurrency: "RWF",
    address: "",
    notes: "",
    isActive: true,
  });
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      name: safe(supplier?.name) || "",
      contactName: safe(supplier?.contactName) || "",
      phone: safe(supplier?.phone) || "",
      email: safe(supplier?.email) || "",
      country: safe(supplier?.country) || "",
      city: safe(supplier?.city) || "",
      sourceType: safe(supplier?.sourceType) || "LOCAL",
      defaultCurrency: normalizeCurrency(supplier?.defaultCurrency),
      address: safe(supplier?.address) || "",
      notes: safe(supplier?.notes) || "",
      isActive: supplier?.isActive ?? true,
    });
    setErrorText("");
  }, [open, supplier]);

  if (!open) return null;

  async function handleSave() {
    setErrorText("");

    const payload = {
      name: String(form.name || "").trim(),
      contactName: String(form.contactName || "").trim() || undefined,
      phone: String(form.phone || "").trim() || undefined,
      email: String(form.email || "").trim() || undefined,
      country: String(form.country || "").trim() || undefined,
      city: String(form.city || "").trim() || undefined,
      sourceType: String(form.sourceType || "LOCAL")
        .trim()
        .toUpperCase(),
      defaultCurrency: normalizeCurrency(form.defaultCurrency),
      address: String(form.address || "").trim() || undefined,
      notes: String(form.notes || "").trim() || undefined,
      ...(isEdit ? { isActive: !!form.isActive } : {}),
    };

    if (!payload.name) {
      setErrorText("Supplier name is required");
      return;
    }

    try {
      const result = await apiFetch(
        isEdit ? `/owner/suppliers/${supplier.id}` : "/owner/suppliers",
        {
          method: isEdit ? "PATCH" : "POST",
          body: payload,
        },
      );

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to save supplier");
    }
  }

  return (
    <ModalShell
      title={isEdit ? "Edit supplier" : "Create supplier"}
      subtitle="Suppliers are business-wide records. Branch belongs on bills, not the supplier master."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Supplier name
          </label>
          <FormInput
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Supplier name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Contact person
          </label>
          <FormInput
            value={form.contactName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, contactName: e.target.value }))
            }
            placeholder="Contact person"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Phone
          </label>
          <FormInput
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="Phone number"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Email
          </label>
          <FormInput
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Email address"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Country
          </label>
          <FormInput
            value={form.country}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, country: e.target.value }))
            }
            placeholder="Country"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            City
          </label>
          <FormInput
            value={form.city}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, city: e.target.value }))
            }
            placeholder="City"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Source type
          </label>
          <FormSelect
            value={form.sourceType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, sourceType: e.target.value }))
            }
          >
            <option value="LOCAL">Local</option>
            <option value="ABROAD">Abroad</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Default currency
          </label>
          <FormSelect
            value={form.defaultCurrency}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, defaultCurrency: e.target.value }))
            }
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </FormSelect>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Address
          </label>
          <textarea
            value={form.address}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, address: e.target.value }))
            }
            rows={3}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Supplier address"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={4}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Supplier notes"
          />
        </div>

        {isEdit ? (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              Status
            </label>
            <FormSelect
              value={form.isActive ? "true" : "false"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isActive: e.target.value === "true",
                }))
              }
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </FormSelect>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText={isEdit ? "Save supplier" : "Create supplier"}
          loadingText={isEdit ? "Saving..." : "Creating..."}
          successText={isEdit ? "Saved" : "Created"}
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function SupplierStatusModal({ open, supplier, mode, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
    setErrorText("");
  }, [open, supplier, mode]);

  if (!open || !supplier) return null;

  const isDeactivate = mode === "deactivate";
  const title = isDeactivate ? "Deactivate supplier" : "Reactivate supplier";
  const subtitle = isDeactivate
    ? "This hides the supplier from active operations without deleting history."
    : "This makes the supplier available again for future operations.";

  async function handleConfirm() {
    setErrorText("");

    try {
      const result = await apiFetch(
        isDeactivate
          ? `/owner/suppliers/${supplier.id}/deactivate`
          : `/owner/suppliers/${supplier.id}/reactivate`,
        {
          method: "POST",
          body: isDeactivate ? { reason: reason || undefined } : {},
        },
      );

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error ||
          e?.message ||
          `Failed to ${isDeactivate ? "deactivate" : "reactivate"} supplier`,
      );
    }
  }

  return (
    <ModalShell title={title} subtitle={subtitle} onClose={onClose}>
      <AlertBox message={errorText} />

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
        Supplier: <strong>{safe(supplier?.name) || "-"}</strong>
        <br />
        Default currency:{" "}
        <strong>{normalizeCurrency(supplier?.defaultCurrency)}</strong>
        <br />
        Current debt:{" "}
        <strong>
          {money(supplier?.balanceDue, supplier?.defaultCurrency)}
        </strong>
      </div>

      {isDeactivate ? (
        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Why is this supplier being deactivated?"
          />
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
          idleText={
            isDeactivate ? "Deactivate supplier" : "Reactivate supplier"
          }
          loadingText={isDeactivate ? "Deactivating..." : "Reactivating..."}
          successText={isDeactivate ? "Deactivated" : "Reactivated"}
          onClick={handleConfirm}
          variant="secondary"
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerSuppliersTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [active, setActive] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [editingSupplier, setEditingSupplier] = useState(null);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [statusSupplier, setStatusSupplier] = useState(null);
  const [statusMode, setStatusMode] = useState("deactivate");

  const selectedSupplier =
    selectedSupplierId == null
      ? null
      : suppliers.find(
          (row) => String(row.id) === String(selectedSupplierId),
        ) || null;

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const overview = useMemo(() => {
    const rows = Array.isArray(suppliers) ? suppliers : [];

    let suppliersCount = rows.length;
    let activeSuppliersCount = 0;
    let localSuppliersCount = 0;
    let abroadSuppliersCount = 0;
    let outstandingRWF = 0;
    let outstandingUSD = 0;
    let overdueRWF = 0;
    let overdueUSD = 0;

    for (const row of rows) {
      const currency = normalizeCurrency(row?.defaultCurrency);
      const outstanding = Number(row?.balanceDue || 0);
      const overdue = Number(row?.overdueAmount || 0);

      if (row?.isActive) activeSuppliersCount += 1;
      if (safe(row?.sourceType).toUpperCase() === "ABROAD")
        abroadSuppliersCount += 1;
      else localSuppliersCount += 1;

      if (currency === "USD") {
        outstandingUSD += outstanding;
        overdueUSD += overdue;
      } else {
        outstandingRWF += outstanding;
        overdueRWF += overdue;
      }
    }

    return {
      suppliersCount,
      activeSuppliersCount,
      localSuppliersCount,
      abroadSuppliersCount,
      outstandingRWF,
      outstandingUSD,
      overdueRWF,
      overdueUSD,
    };
  }, [suppliers]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, locationId, sourceType, active]);

  async function load() {
    setLoading(true);
    setErrorText("");

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (locationId) params.set("locationId", locationId);
    if (sourceType) params.set("sourceType", sourceType);
    if (active) params.set("active", active);

    const suffix = params.toString() ? `?${params.toString()}` : "";

    try {
      const result = await apiFetch(`/owner/suppliers${suffix}`, {
        method: "GET",
      });

      const rows = Array.isArray(result?.suppliers)
        ? result.suppliers.map(normalizeSupplier).filter(Boolean)
        : [];

      setSuppliers(rows);
      setSelectedSupplierId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev))
          ? prev
          : (rows[0]?.id ?? null),
      );
    } catch (e) {
      setSuppliers([]);
      setSelectedSupplierId(null);
      setErrorText(e?.data?.error || e?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [q, locationId, sourceType, active]);

  async function handleSaved(actionText, result) {
    setSuccessText(actionText);

    const nextId =
      result?.supplier?.id ?? result?.id ?? selectedSupplierId ?? null;

    setCreatingSupplier(false);
    setEditingSupplier(null);
    setStatusSupplier(null);

    await load();

    if (nextId) {
      setSelectedSupplierId(nextId);
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  const visibleRows = suppliers.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Suppliers"
          subtitle="Loading owner-wide supplier visibility."
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
            title="Supplier overview"
            subtitle="Owner-wide procurement visibility. Amounts currently follow backend supplier totals."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              <StatCard
                label="Suppliers"
                value={safeNumber(overview?.suppliersCount)}
                sub="Directory size"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Active"
                value={safeNumber(overview?.activeSuppliersCount)}
                sub="Operational suppliers"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Local"
                value={safeNumber(overview?.localSuppliersCount)}
                sub="Rwanda-based suppliers"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Abroad"
                value={safeNumber(overview?.abroadSuppliersCount)}
                sub="Foreign suppliers"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Outstanding (RWF)"
                value={money(overview?.outstandingRWF, "RWF")}
                sub="Frontend grouped"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Outstanding (USD)"
                value={money(overview?.outstandingUSD, "USD")}
                sub="Frontend grouped"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Overdue (RWF)"
                value={money(overview?.overdueRWF, "RWF")}
                sub="Frontend grouped"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Overdue (USD)"
                value={money(overview?.overdueUSD, "USD")}
                sub="Frontend grouped"
                valueClassName="text-[17px] leading-tight"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Supplier filters"
            subtitle="Suppliers are business-wide. Branch filter only changes the liability lens through bills."
            right={
              <AsyncButton
                idleText="Create supplier"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => setCreatingSupplier(true)}
              />
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search supplier, contact, phone, email, country"
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
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
              >
                <option value="">All source types</option>
                <option value="LOCAL">Local</option>
                <option value="ABROAD">Abroad</option>
              </FormSelect>

              <FormSelect
                value={active}
                onChange={(e) => setActive(e.target.value)}
              >
                <option value="">All activity states</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </FormSelect>
            </div>
          </SectionCard>

          <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard
              title="Supplier directory"
              subtitle="Select a supplier to inspect profile, liability, and payment behavior."
            >
              {suppliers.length === 0 ? (
                <EmptyState text="No suppliers match the current owner filters." />
              ) : (
                <div className="space-y-4">
                  {visibleRows.map((row) => (
                    <SupplierCard
                      key={row.id}
                      row={row}
                      active={String(row.id) === String(selectedSupplierId)}
                      onSelect={(picked) => setSelectedSupplierId(picked?.id)}
                    />
                  ))}
                </div>
              )}

              {visibleCount < suppliers.length ? (
                <div className="mt-5 flex justify-center">
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

            {selectedSupplier ? (
              <SectionCard
                title="Selected supplier detail"
                subtitle="Focused owner view of supplier identity, debt, and recent activity."
                right={
                  <div className="flex flex-wrap items-center gap-2">
                    <AsyncButton
                      idleText="Edit supplier"
                      loadingText="Opening..."
                      successText="Ready"
                      onClick={async () => setEditingSupplier(selectedSupplier)}
                      variant="secondary"
                    />

                    {selectedSupplier?.isActive ? (
                      <AsyncButton
                        idleText="Deactivate"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => {
                          setStatusMode("deactivate");
                          setStatusSupplier(selectedSupplier);
                        }}
                        variant="secondary"
                      />
                    ) : (
                      <AsyncButton
                        idleText="Reactivate"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => {
                          setStatusMode("reactivate");
                          setStatusSupplier(selectedSupplier);
                        }}
                        variant="secondary"
                      />
                    )}

                    <Badge
                      className={supplierTone(selectedSupplier?.sourceType)}
                    >
                      {safe(selectedSupplier?.sourceType) || "LOCAL"}
                    </Badge>

                    <Badge className={neutralBadgeTone()}>
                      Default{" "}
                      {normalizeCurrency(selectedSupplier?.defaultCurrency)}
                    </Badge>

                    <Badge className={activeTone(!!selectedSupplier?.isActive)}>
                      {selectedSupplier?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Supplier"
                    value={safe(selectedSupplier?.name) || "-"}
                    sub={
                      safe(selectedSupplier?.contactName) || "No contact name"
                    }
                  />
                  <StatCard
                    label={`Outstanding (${normalizeCurrency(
                      selectedSupplier?.defaultCurrency,
                    )})`}
                    value={money(
                      selectedSupplier?.balanceDue,
                      selectedSupplier?.defaultCurrency,
                    )}
                    sub="Current unpaid amount"
                  />
                  <StatCard
                    label={`Overdue (${normalizeCurrency(
                      selectedSupplier?.defaultCurrency,
                    )})`}
                    value={money(
                      selectedSupplier?.overdueAmount,
                      selectedSupplier?.defaultCurrency,
                    )}
                    sub={`${safeNumber(selectedSupplier?.overdueBillsCount)} overdue bills`}
                  />
                  <StatCard
                    label="Bills"
                    value={safeNumber(selectedSupplier?.billsCount)}
                    sub="Bills in current filter"
                  />
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Supplier profile
                    </p>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Contact person
                        </p>
                        <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                          {safe(selectedSupplier?.contactName) || "-"}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Phone
                          </p>
                          <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {safe(selectedSupplier?.phone) || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Email
                          </p>
                          <p className="mt-2 break-all text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {safe(selectedSupplier?.email) || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Country / City
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {[
                              safe(selectedSupplier?.country),
                              safe(selectedSupplier?.city),
                            ]
                              .filter(Boolean)
                              .join(" / ") || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Default currency
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {normalizeCurrency(
                              selectedSupplier?.defaultCurrency,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Address
                        </p>
                        <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                          {safe(selectedSupplier?.address) || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Notes
                        </p>
                        <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                          {safe(selectedSupplier?.notes) || "No notes recorded"}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Last bill date
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {safeDate(selectedSupplier?.lastBillDate)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Last payment date
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {safeDate(selectedSupplier?.lastPaymentDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Liability view
                    </p>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                          Total billed (
                          {normalizeCurrency(selectedSupplier?.defaultCurrency)}
                          )
                        </p>
                        <p className="mt-2 text-2xl font-black text-stone-950 dark:text-stone-50">
                          {money(
                            selectedSupplier?.totalBilled,
                            selectedSupplier?.defaultCurrency,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                          Total paid (
                          {normalizeCurrency(selectedSupplier?.defaultCurrency)}
                          )
                        </p>
                        <p className="mt-2 text-2xl font-black text-stone-950 dark:text-stone-50">
                          {money(
                            selectedSupplier?.totalPaid,
                            selectedSupplier?.defaultCurrency,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
                        <p className="text-xs uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">
                          Current debt (
                          {normalizeCurrency(selectedSupplier?.defaultCurrency)}
                          )
                        </p>
                        <p className="mt-2 text-2xl font-black text-rose-900 dark:text-rose-100">
                          {money(
                            selectedSupplier?.balanceDue,
                            selectedSupplier?.defaultCurrency,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            ) : (
              <SectionCard
                title="Selected supplier detail"
                subtitle="This section appears after a supplier is selected."
              >
                <EmptyState text="Select a supplier card above to inspect relationship and debt detail." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      <SupplierFormModal
        open={creatingSupplier || !!editingSupplier}
        supplier={editingSupplier}
        onClose={() => {
          setCreatingSupplier(false);
          setEditingSupplier(null);
        }}
        onSaved={(result) =>
          handleSaved(
            editingSupplier ? "Supplier updated" : "Supplier created",
            result,
          )
        }
      />

      <SupplierStatusModal
        open={!!statusSupplier}
        supplier={statusSupplier}
        mode={statusMode}
        onClose={() => setStatusSupplier(null)}
        onSaved={(result) =>
          handleSaved(
            statusMode === "deactivate"
              ? "Supplier deactivated"
              : "Supplier reactivated",
            result,
          )
        }
      />
    </div>
  );
}
