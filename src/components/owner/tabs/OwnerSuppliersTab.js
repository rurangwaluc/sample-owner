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
    openBillsCount: Number(row.openBillsCount ?? row.open_bills_count ?? 0),
    partiallyPaidCount: Number(
      row.partiallyPaidCount ?? row.partially_paid_count ?? 0,
    ),
    paidBillsCount: Number(row.paidBillsCount ?? row.paid_bills_count ?? 0),
    lastBillDate: row.lastBillDate ?? row.last_bill_date ?? null,
    lastPaymentDate: row.lastPaymentDate ?? row.last_payment_date ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function supplierFormDefaults(supplier) {
  return {
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
  };
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

function SupplierCard({ row, active, onSelect }) {
  const currency = normalizeCurrency(row?.defaultCurrency);
  const sourceType = String(row?.sourceType || "LOCAL").toUpperCase();
  const activeTone = row?.isActive ? "success" : "danger";
  const sourceTone = sourceType === "ABROAD" ? "info" : "neutral";
  const locationLabel = [safe(row?.city), safe(row?.country)]
    .filter(Boolean)
    .join(", ");

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
              {safe(row?.name) || "-"}
            </div>
            <Pill tone={sourceTone}>{sourceType}</Pill>
            <Pill tone={activeTone}>
              {row?.isActive ? "ACTIVE" : "INACTIVE"}
            </Pill>
            <Pill tone="neutral">DEFAULT {currency}</Pill>
          </div>

          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Contact:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safe(row?.contactName) || "-"}
            </b>
            {safe(row?.phone) ? (
              <>
                {" "}
                • Phone:{" "}
                <b className="text-stone-900 dark:text-stone-100">
                  {safe(row?.phone)}
                </b>
              </>
            ) : null}
            {safe(row?.email) ? (
              <>
                {" "}
                • Email:{" "}
                <b className="text-stone-900 dark:text-stone-100">
                  {safe(row?.email)}
                </b>
              </>
            ) : null}
          </div>

          <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Location:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {locationLabel || "-"}
            </b>
          </div>

          {safe(row?.notes) ? (
            <div className="mt-2 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
              <b className="text-stone-900 dark:text-stone-100">Notes:</b>{" "}
              {safe(row?.notes)}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Current debt
          </div>
          <div className="mt-1 text-lg font-black text-stone-950 dark:text-stone-50">
            {money(row?.balanceDue, currency)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            {safeNumber(row?.billsCount)} bill(s)
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-[18px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Total billed
          </div>
          <div className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {money(row?.totalBilled, currency)}
          </div>
        </div>
        <div className="rounded-[18px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Total paid
          </div>
          <div className="mt-2 text-sm font-bold text-stone-950 dark:text-stone-50">
            {money(row?.totalPaid, currency)}
          </div>
        </div>
        <div className="rounded-[18px] border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-rose-700 dark:text-rose-300">
            Overdue
          </div>
          <div className="mt-2 text-sm font-bold text-rose-700 dark:text-rose-300">
            {money(row?.overdueAmount, currency)}
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

function SupplierFormModal({ open, supplier, onClose, onSaved }) {
  if (!open) return null;

  return (
    <SupplierFormModalInner
      key={supplier?.id ? `edit-${supplier.id}` : "create-supplier"}
      supplier={supplier}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function SupplierFormModalInner({ supplier, onClose, onSaved }) {
  const isEdit = !!supplier;
  const [form, setForm] = useState(() => supplierFormDefaults(supplier));
  const [errorText, setErrorText] = useState("");

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
      subtitle="Suppliers are business-wide master records."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
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
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
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
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
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
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
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
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
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
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
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
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
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
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
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
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Address
          </label>
          <textarea
            value={form.address}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, address: e.target.value }))
            }
            rows={3}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Supplier address"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Supplier notes"
          />
        </div>

        {isEdit ? (
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
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
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
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
  if (!open || !supplier) return null;

  return (
    <SupplierStatusModalInner
      key={`${mode}-${supplier.id}`}
      supplier={supplier}
      mode={mode}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function SupplierStatusModalInner({ supplier, mode, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState("");

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

      <Surface className="bg-stone-50 dark:bg-stone-950">
        <div className="text-sm text-stone-700 dark:text-stone-300">
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
      </Surface>

      {isDeactivate ? (
        <div className="mt-4">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Why is this supplier being deactivated?"
          />
        </div>
      ) : null}

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[18px] border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
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

export default function OwnerSuppliersTab() {
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [q, setQ] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [active, setActive] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [editingSupplier, setEditingSupplier] = useState(null);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [statusSupplier, setStatusSupplier] = useState(null);
  const [statusMode, setStatusMode] = useState("deactivate");

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
      if (safe(row?.sourceType).toUpperCase() === "ABROAD") {
        abroadSuppliersCount += 1;
      } else {
        localSuppliersCount += 1;
      }

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
  }, [q, sourceType, active]);

  async function load() {
    setLoading(true);
    setErrorText("");

    const params = new URLSearchParams();
    if (q) params.set("q", q);
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
      setSelectedSupplierId((prev) => {
        const next =
          prev && rows.some((x) => String(x.id) === String(prev))
            ? String(prev)
            : rows[0]?.id != null
              ? String(rows[0].id)
              : "";
        return next;
      });
    } catch (e) {
      setSuppliers([]);
      setSelectedSupplierId("");
      setSelectedSupplier(null);
      setErrorText(e?.data?.error || e?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setSelectedSupplier(null);
      return;
    }

    setDetailLoading(true);
    try {
      const result = await apiFetch(`/owner/suppliers/${id}`, {
        method: "GET",
      });

      setSelectedSupplier(normalizeSupplier(result?.supplier));
    } catch (e) {
      setSelectedSupplier(null);
      setErrorText(
        e?.data?.error || e?.message || "Failed to load supplier detail",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [q, sourceType, active]);

  useEffect(() => {
    loadDetail(selectedSupplierId);
  }, [selectedSupplierId]);

  async function handleSaved(actionText, result) {
    setSuccessText(actionText);

    const nextId =
      result?.supplier?.id ?? result?.id ?? selectedSupplierId ?? "";

    setCreatingSupplier(false);
    setEditingSupplier(null);
    setStatusSupplier(null);

    await load();

    if (nextId) {
      setSelectedSupplierId(String(nextId));
      await loadDetail(String(nextId));
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  const visibleRows = suppliers.slice(0, visibleCount);

  const headerRight = (
    <div className="flex flex-wrap items-center gap-2">
      <AsyncButton
        variant="secondary"
        state={loading || detailLoading ? "loading" : "idle"}
        idleText="Reload"
        loadingText="Loading..."
        successText="Done"
        onClick={async () => {
          await Promise.all([load(), loadDetail(selectedSupplierId)]);
        }}
      />

      <AsyncButton
        idleText="Create supplier"
        loadingText="Opening..."
        successText="Ready"
        onClick={async () => setCreatingSupplier(true)}
      />
    </div>
  );

  return (
    <div className="grid gap-4">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      <SectionShell
        title="Suppliers"
        hint="Supplier master records, contact detail, and liability context."
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
                  Supplier overview
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Suppliers"
                    value={safeNumber(overview?.suppliersCount)}
                    sub="Directory size"
                  />
                  <MetricCard
                    label="Active"
                    value={safeNumber(overview?.activeSuppliersCount)}
                    sub="Operational suppliers"
                  />
                  <MetricCard
                    label="Local"
                    value={safeNumber(overview?.localSuppliersCount)}
                    sub="Rwanda-based suppliers"
                  />
                  <MetricCard
                    label="Abroad"
                    value={safeNumber(overview?.abroadSuppliersCount)}
                    sub="Foreign suppliers"
                  />
                  <MetricCard
                    label="Outstanding (RWF)"
                    value={money(overview?.outstandingRWF, "RWF")}
                    sub="Grouped totals"
                  />
                  <MetricCard
                    label="Outstanding (USD)"
                    value={money(overview?.outstandingUSD, "USD")}
                    sub="Grouped totals"
                  />
                  <MetricCard
                    label="Overdue (RWF)"
                    value={money(overview?.overdueRWF, "RWF")}
                    sub="Late bills"
                    tone="danger"
                  />
                  <MetricCard
                    label="Overdue (USD)"
                    value={money(overview?.overdueUSD, "USD")}
                    sub="Late bills"
                    tone="danger"
                  />
                </div>
              </Surface>

              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Supplier filters
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FormInput
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search supplier, contact, phone, email, country"
                  />

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

                <div className="mt-4 rounded-[22px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                    Current supplier
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <FormSelect
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                    >
                      <option value="">All suppliers</option>
                      {suppliers
                        .slice()
                        .sort((a, b) =>
                          String(a?.name || "").localeCompare(
                            String(b?.name || ""),
                          ),
                        )
                        .map((s) => (
                          <option key={s.id} value={String(s.id)}>
                            {safe(s?.name) || `Supplier #${s.id}`}
                          </option>
                        ))}
                    </FormSelect>

                    <div className="rounded-[18px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
                      Current debt:{" "}
                      <b>
                        {detailLoading
                          ? "..."
                          : selectedSupplier
                            ? money(
                                selectedSupplier.balanceDue,
                                selectedSupplier.defaultCurrency,
                              )
                            : "—"}
                      </b>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                    Bills:{" "}
                    <b>
                      {selectedSupplier ? selectedSupplier.billsCount : "—"}
                    </b>{" "}
                    • Total billed:{" "}
                    <b>
                      {selectedSupplier
                        ? money(
                            selectedSupplier.totalBilled,
                            selectedSupplier.defaultCurrency,
                          )
                        : "—"}
                    </b>{" "}
                    • Total paid:{" "}
                    <b>
                      {selectedSupplier
                        ? money(
                            selectedSupplier.totalPaid,
                            selectedSupplier.defaultCurrency,
                          )
                        : "—"}
                    </b>
                  </div>
                </div>
              </Surface>
            </div>

            <div className="mt-4 grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Supplier directory
                </div>
                <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Select a supplier to inspect supplier master detail.
                </div>

                <div className="mt-4">
                  {suppliers.length === 0 ? (
                    <EmptyState text="No suppliers match the current owner filters." />
                  ) : (
                    <div className="grid gap-3">
                      {visibleRows.map((row) => (
                        <SupplierCard
                          key={row.id}
                          row={row}
                          active={String(row.id) === String(selectedSupplierId)}
                          onSelect={(picked) =>
                            setSelectedSupplierId(String(picked?.id || ""))
                          }
                        />
                      ))}
                    </div>
                  )}

                  {visibleCount < suppliers.length ? (
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

              {selectedSupplier ? (
                <Surface>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                        Selected supplier detail
                      </div>
                      <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        Focused owner view of supplier identity and liability
                        context.
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <AsyncButton
                        idleText="Edit supplier"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () =>
                          setEditingSupplier(selectedSupplier)
                        }
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
                        <Pill
                          tone={
                            String(
                              selectedSupplier?.sourceType || "",
                            ).toUpperCase() === "ABROAD"
                              ? "info"
                              : "neutral"
                          }
                        >
                          {safe(selectedSupplier?.sourceType) || "LOCAL"}
                        </Pill>
                        <Pill tone="neutral">
                          DEFAULT{" "}
                          {normalizeCurrency(selectedSupplier?.defaultCurrency)}
                        </Pill>
                        <Pill
                          tone={
                            selectedSupplier?.isActive ? "success" : "danger"
                          }
                        >
                          {selectedSupplier?.isActive ? "ACTIVE" : "INACTIVE"}
                        </Pill>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <MetricCard
                          label="Supplier"
                          value={safe(selectedSupplier?.name) || "-"}
                          sub={
                            safe(selectedSupplier?.contactName) ||
                            "No contact person"
                          }
                        />
                        <MetricCard
                          label={`Current debt (${normalizeCurrency(
                            selectedSupplier?.defaultCurrency,
                          )})`}
                          value={money(
                            selectedSupplier?.balanceDue,
                            selectedSupplier?.defaultCurrency,
                          )}
                          sub="Current unpaid amount"
                          tone="danger"
                        />
                        <MetricCard
                          label="Supplier bills"
                          value={safeNumber(selectedSupplier?.billsCount)}
                          sub="Current recorded bills"
                        />
                        <MetricCard
                          label="Overdue bills"
                          value={safeNumber(
                            selectedSupplier?.overdueBillsCount,
                          )}
                          sub="Late supplier bills"
                          tone="danger"
                        />
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Supplier master
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <InfoTile
                            label="Contact person"
                            value={safe(selectedSupplier?.contactName) || "-"}
                          />
                          <InfoTile
                            label="Phone"
                            value={safe(selectedSupplier?.phone) || "-"}
                          />
                          <InfoTile
                            label="Email"
                            value={safe(selectedSupplier?.email) || "-"}
                          />
                          <InfoTile
                            label="Country / City"
                            value={
                              [
                                safe(selectedSupplier?.country),
                                safe(selectedSupplier?.city),
                              ]
                                .filter(Boolean)
                                .join(" / ") || "-"
                            }
                          />
                          <InfoTile
                            label="Default currency"
                            value={normalizeCurrency(
                              selectedSupplier?.defaultCurrency,
                            )}
                          />
                          <InfoTile
                            label="Address"
                            value={safe(selectedSupplier?.address) || "-"}
                          />
                          <InfoTile
                            label="Created"
                            value={safeDate(selectedSupplier?.createdAt)}
                          />
                          <InfoTile
                            label="Updated"
                            value={safeDate(selectedSupplier?.updatedAt)}
                          />
                        </div>

                        <InfoTile
                          label="Notes"
                          value={
                            safe(selectedSupplier?.notes) || "No notes recorded"
                          }
                        />
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Liability context
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <InfoTile
                            label={`Total billed (${normalizeCurrency(
                              selectedSupplier?.defaultCurrency,
                            )})`}
                            value={money(
                              selectedSupplier?.totalBilled,
                              selectedSupplier?.defaultCurrency,
                            )}
                          />
                          <InfoTile
                            label={`Total paid (${normalizeCurrency(
                              selectedSupplier?.defaultCurrency,
                            )})`}
                            value={money(
                              selectedSupplier?.totalPaid,
                              selectedSupplier?.defaultCurrency,
                            )}
                          />
                          <InfoTile
                            label="Open bills"
                            value={String(
                              selectedSupplier?.openBillsCount ?? 0,
                            )}
                          />
                          <InfoTile
                            label="Partially paid"
                            value={String(
                              selectedSupplier?.partiallyPaidCount ?? 0,
                            )}
                          />
                          <InfoTile
                            label="Paid bills"
                            value={String(
                              selectedSupplier?.paidBillsCount ?? 0,
                            )}
                          />
                          <InfoTile
                            label="Overdue bills"
                            value={String(
                              selectedSupplier?.overdueBillsCount ?? 0,
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </Surface>
              ) : (
                <Surface>
                  <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                    Selected supplier detail
                  </div>
                  <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    This section appears after a supplier is selected.
                  </div>
                  <div className="mt-4">
                    <EmptyState text="Select a supplier card above to inspect supplier master detail." />
                  </div>
                </Surface>
              )}
            </div>
          </>
        )}
      </SectionShell>

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
