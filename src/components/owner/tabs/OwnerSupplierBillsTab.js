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

function normalizeBillsResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.bills)) return result.bills;
  if (Array.isArray(result?.supplierBills)) return result.supplierBills;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeBill(row) {
  if (!row) return null;

  const totalAmount = Number(row.totalAmount ?? row.total_amount ?? 0);
  const paidAmount = Number(row.paidAmount ?? row.paid_amount ?? 0);
  const balance =
    row.balance != null
      ? Number(row.balance)
      : Math.max(0, totalAmount - paidAmount);

  return {
    id: row.id ?? null,
    supplierId: row.supplierId ?? row.supplier_id ?? null,
    supplierName: row.supplierName ?? row.supplier_name ?? "Unknown supplier",
    supplierDefaultCurrency:
      row.supplierDefaultCurrency ?? row.supplier_default_currency ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    billNo: row.billNo ?? row.bill_no ?? "",
    currency: normalizeCurrency(row.currency),
    totalAmount,
    paidAmount,
    balance,
    status: row.status ?? "OPEN",
    issuedDate: row.issuedDate ?? row.issued_date ?? null,
    dueDate: row.dueDate ?? row.due_date ?? null,
    note: row.note ?? "",
    createdByUserId: row.createdByUserId ?? row.created_by_user_id ?? null,
    createdByName: row.createdByName ?? row.created_by_name ?? "",
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    isOverdue: !!(row.isOverdue ?? row.is_overdue),
    daysOverdue: Number(row.daysOverdue ?? row.days_overdue ?? 0),
  };
}

function normalizeBillDetail(result) {
  const rawBill = result?.bill || null;

  return {
    bill: rawBill ? normalizeBill(rawBill) : null,
    items: Array.isArray(result?.items) ? result.items : [],
    payments: Array.isArray(result?.payments) ? result.payments : [],
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

  if (row?.locationId != null) {
    return `Branch #${row.locationId}`;
  }

  return "-";
}

function displayBranchSub(row, locations = []) {
  if (safe(row?.locationCode)) return safe(row.locationCode);

  const meta = findLocationMeta(locations, row?.locationId);
  if (safe(meta?.code)) return safe(meta.code);

  return "No branch code";
}

function displayCreatedBy(row) {
  if (safe(row?.createdByName)) return safe(row.createdByName);
  if (row?.createdByUserId != null) return `User #${row.createdByUserId}`;
  return "-";
}

function statusTone(status) {
  const s = safe(status).toUpperCase();

  if (s === "PAID") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (s === "PARTIALLY_PAID") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (s === "OPEN" || s === "DRAFT") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (s === "VOID") {
    return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
  }

  return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function overdueTone(isOverdue) {
  return isOverdue
    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
    : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function surfaceTone(active) {
  return active
    ? "border-stone-900 bg-stone-900 text-white shadow-xl ring-1 ring-stone-700 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950 dark:ring-stone-300"
    : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-900";
}

function softPanelTone(active) {
  return active
    ? "border-white/10 bg-white/5 dark:border-stone-900/10 dark:bg-stone-900/5"
    : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950";
}

function dangerPanelTone(active) {
  return active
    ? "border-rose-300/20 bg-rose-400/10 text-white dark:border-rose-900/20 dark:bg-rose-900/10 dark:text-stone-950"
    : "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20";
}

function metaTextTone(active) {
  return active
    ? "text-stone-300 dark:text-stone-600"
    : "text-stone-500 dark:text-stone-400";
}

function BillCard({ row, active, onSelect, locations = [] }) {
  const currency = normalizeCurrency(row?.currency);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "group w-full overflow-hidden rounded-[28px] border text-left transition-all duration-200 " +
        surfaceTone(active)
      }
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold sm:text-lg">
                Bill #{safe(row?.billNo || row?.id) || "-"}
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
                    : statusTone(row?.status))
                }
              >
                {safe(row?.status) || "OPEN"}
              </span>

              <span
                className={
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                  (active
                    ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                    : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300")
                }
              >
                {currency}
              </span>

              <span
                className={
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                  (active
                    ? "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950"
                    : overdueTone(!!row?.isOverdue))
                }
              >
                {row?.isOverdue
                  ? `${safeNumber(row?.daysOverdue)}d overdue`
                  : "On time"}
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
                <span className="font-medium">Supplier:</span>{" "}
                {safe(row?.supplierName) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Branch:</span>{" "}
                {displayBranch(row, locations)}
              </p>
              <p className="truncate">
                <span className="font-medium">Issued:</span>{" "}
                {safeDate(row?.issuedDate)}
              </p>
              <p className="truncate">
                <span className="font-medium">Due:</span>{" "}
                {safeDate(row?.dueDate)}
              </p>
            </div>
          </div>

          <div
            className={
              "rounded-2xl border px-4 py-3 xl:min-w-[220px] " +
              softPanelTone(active)
            }
          >
            <p
              className={
                "text-[11px] font-semibold uppercase tracking-[0.18em] " +
                metaTextTone(active)
              }
            >
              Remaining balance
            </p>
            <p className="mt-2 text-xl font-black sm:text-2xl">
              {money(row?.balance, currency)}
            </p>
            <p className={"mt-1 text-xs " + metaTextTone(active)}>
              Outstanding in {currency}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={"rounded-2xl border p-4 " + softPanelTone(active)}>
            <p
              className={
                "text-[11px] uppercase tracking-[0.14em] " +
                metaTextTone(active)
              }
            >
              Total ({currency})
            </p>
            <p className="mt-2 text-lg font-bold">
              {money(row?.totalAmount, currency)}
            </p>
          </div>

          <div className={"rounded-2xl border p-4 " + softPanelTone(active)}>
            <p
              className={
                "text-[11px] uppercase tracking-[0.14em] " +
                metaTextTone(active)
              }
            >
              Paid ({currency})
            </p>
            <p className="mt-2 text-lg font-bold">
              {money(row?.paidAmount, currency)}
            </p>
          </div>

          <div className={"rounded-2xl border p-4 " + softPanelTone(active)}>
            <p
              className={
                "text-[11px] uppercase tracking-[0.14em] " +
                metaTextTone(active)
              }
            >
              Created by
            </p>
            <p className="mt-2 text-lg font-bold">{displayCreatedBy(row)}</p>
          </div>

          <div className={"rounded-2xl border p-4 " + dangerPanelTone(active)}>
            <p
              className={
                "text-[11px] uppercase tracking-[0.14em] " +
                (active
                  ? "text-rose-100 dark:text-rose-800"
                  : "text-rose-700 dark:text-rose-300")
              }
            >
              Balance ({currency})
            </p>
            <p className="mt-2 text-lg font-bold">
              {money(row?.balance, currency)}
            </p>
          </div>
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

function CreateBillModal({ open, suppliers, locations, onClose, onSaved }) {
  const [form, setForm] = useState({
    supplierId: "",
    locationId: "",
    billNo: "",
    currency: "RWF",
    totalAmount: "",
    issuedDate: "",
    dueDate: "",
    note: "",
    status: "OPEN",
  });
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      supplierId: "",
      locationId: "",
      billNo: "",
      currency: "RWF",
      totalAmount: "",
      issuedDate: "",
      dueDate: "",
      note: "",
      status: "OPEN",
    });
    setErrorText("");
  }, [open]);

  if (!open) return null;

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        supplierId: Number(form.supplierId),
        locationId: Number(form.locationId),
        billNo: form.billNo || undefined,
        currency: form.currency || undefined,
        totalAmount: Number(form.totalAmount),
        issuedDate: form.issuedDate || undefined,
        dueDate: form.dueDate || undefined,
        note: form.note || undefined,
        status: form.status || undefined,
      };

      const result = await apiFetch("/owner/supplier-bills", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to create bill");
    }
  }

  return (
    <ModalShell
      title="Create supplier bill"
      subtitle="Create a new supplier liability for a specific branch."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Supplier
          </label>
          <FormSelect
            value={form.supplierId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, supplierId: e.target.value }))
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
            Bill number
          </label>
          <FormInput
            value={form.billNo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, billNo: e.target.value }))
            }
            placeholder="INV-001"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Currency
          </label>
          <FormSelect
            value={form.currency}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currency: e.target.value }))
            }
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Total amount
          </label>
          <FormInput
            type="number"
            value={form.totalAmount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, totalAmount: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Status
          </label>
          <FormSelect
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Issued date
          </label>
          <FormInput
            type="date"
            value={form.issuedDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, issuedDate: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Due date
          </label>
          <FormInput
            type="date"
            value={form.dueDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dueDate: e.target.value }))
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
            placeholder="Bill note"
          />
        </div>
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
          idleText="Create bill"
          loadingText="Creating..."
          successText="Created"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function EditBillModal({ open, bill, suppliers, locations, onClose, onSaved }) {
  const [form, setForm] = useState({
    supplierId: "",
    locationId: "",
    billNo: "",
    currency: "RWF",
    totalAmount: "",
    issuedDate: "",
    dueDate: "",
    note: "",
    status: "OPEN",
  });
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!bill) return;
    setForm({
      supplierId: String(bill.supplierId || ""),
      locationId: String(bill.locationId || ""),
      billNo: safe(bill.billNo) || "",
      currency: normalizeCurrency(bill.currency),
      totalAmount: String(bill.totalAmount ?? ""),
      issuedDate: bill.issuedDate ? String(bill.issuedDate).slice(0, 10) : "",
      dueDate: bill.dueDate ? String(bill.dueDate).slice(0, 10) : "",
      note: safe(bill.note) || "",
      status: safe(bill.status) || "OPEN",
    });
    setErrorText("");
  }, [bill]);

  if (!open || !bill) return null;

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        supplierId: Number(form.supplierId),
        locationId: Number(form.locationId),
        billNo: form.billNo || undefined,
        currency: form.currency || undefined,
        totalAmount: Number(form.totalAmount),
        issuedDate: form.issuedDate || undefined,
        dueDate: form.dueDate || undefined,
        note: form.note || undefined,
        status: form.status || undefined,
      };

      const result = await apiFetch(`/owner/supplier-bills/${bill.id}`, {
        method: "PATCH",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to update bill");
    }
  }

  return (
    <ModalShell
      title={`Edit supplier bill #${bill.id}`}
      subtitle="Update branch, supplier, bill details, currency, dates, and amount."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Supplier
          </label>
          <FormSelect
            value={form.supplierId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, supplierId: e.target.value }))
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
            Bill number
          </label>
          <FormInput
            value={form.billNo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, billNo: e.target.value }))
            }
            placeholder="INV-001"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Currency
          </label>
          <FormSelect
            value={form.currency}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currency: e.target.value }))
            }
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Total amount
          </label>
          <FormInput
            type="number"
            value={form.totalAmount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, totalAmount: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Status
          </label>
          <FormSelect
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="PARTIALLY_PAID">Partially paid</option>
            <option value="PAID">Paid</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Issued date
          </label>
          <FormInput
            type="date"
            value={form.issuedDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, issuedDate: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Due date
          </label>
          <FormInput
            type="date"
            value={form.dueDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dueDate: e.target.value }))
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
            placeholder="Bill note"
          />
        </div>
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
          idleText="Save bill"
          loadingText="Saving..."
          successText="Saved"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function AddPaymentModal({ open, bill, onClose, onSaved }) {
  const [form, setForm] = useState({
    amount: "",
    method: "BANK",
    reference: "",
    note: "",
    paidAt: "",
  });
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!bill) return;
    setForm({
      amount: String(bill.balance ?? ""),
      method: "BANK",
      reference: "",
      note: "",
      paidAt: "",
    });
    setErrorText("");
  }, [bill]);

  if (!open || !bill) return null;

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference || undefined,
        note: form.note || undefined,
        paidAt: form.paidAt || undefined,
      };

      const result = await apiFetch(
        `/owner/supplier-bills/${bill.id}/payments`,
        {
          method: "POST",
          body: payload,
        },
      );

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to record supplier payment",
      );
    }
  }

  return (
    <ModalShell
      title={`Add payment to bill #${bill.id}`}
      subtitle={`Remaining balance: ${money(bill.balance, bill.currency)}`}
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Amount ({normalizeCurrency(bill.currency)})
          </label>
          <FormInput
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Method
          </label>
          <FormSelect
            value={form.method}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, method: e.target.value }))
            }
          >
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="MOMO">MoMo</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
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
            placeholder="Transaction reference"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Paid at
          </label>
          <FormInput
            type="datetime-local"
            value={form.paidAt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, paidAt: e.target.value }))
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
            placeholder="Payment note"
          />
        </div>
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
          idleText="Record payment"
          loadingText="Recording..."
          successText="Recorded"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function VoidBillModal({ open, bill, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    setReason("");
    setErrorText("");
  }, [bill]);

  if (!open || !bill) return null;

  async function handleVoid() {
    setErrorText("");

    try {
      const result = await apiFetch(`/owner/supplier-bills/${bill.id}/void`, {
        method: "POST",
        body: {
          reason: reason || undefined,
        },
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to void bill");
    }
  }

  return (
    <ModalShell
      title={`Void bill #${bill.id}`}
      subtitle="This should only be used for bills that should no longer count."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
        Bill amount: <strong>{money(bill.totalAmount, bill.currency)}</strong>
        <br />
        Paid so far: <strong>{money(bill.paidAmount, bill.currency)}</strong>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
          Reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
          placeholder="Why is this bill being voided?"
        />
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
          idleText="Void bill"
          loadingText="Voiding..."
          successText="Voided"
          onClick={handleVoid}
          variant="secondary"
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerSupplierBillsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [summary, setSummary] = useState(null);
  const [bills, setBills] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [billDetail, setBillDetail] = useState({
    bill: null,
    items: [],
    payments: [],
  });
  const [detailLoading, setDetailLoading] = useState(false);

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [creatingBill, setCreatingBill] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);
  const [voidBill, setVoidBill] = useState(null);

  const selectedBill =
    selectedBillId == null
      ? null
      : bills.find((row) => String(row.id) === String(selectedBillId)) || null;

  const detailBill = billDetail?.bill || selectedBill || null;

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  async function loadSupplierOptions() {
    try {
      const result = await apiFetch(`/owner/suppliers?limit=200`, {
        method: "GET",
      });
      setSupplierOptions(
        Array.isArray(result?.suppliers) ? result.suppliers : [],
      );
    } catch {
      setSupplierOptions([]);
    }
  }

  async function loadList() {
    setLoading(true);
    setErrorText("");

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (locationId) params.set("locationId", locationId);
    if (supplierId) params.set("supplierId", supplierId);
    if (status) params.set("status", status);

    const suffix = params.toString() ? `?${params.toString()}` : "";

    const [summaryRes, listRes] = await Promise.allSettled([
      apiFetch(`/owner/supplier-bills/summary${suffix}`, { method: "GET" }),
      apiFetch(`/owner/supplier-bills${suffix}`, { method: "GET" }),
    ]);

    let firstError = "";

    if (summaryRes.status === "fulfilled") {
      setSummary(summaryRes.value?.summary || null);
    } else {
      setSummary(null);
      firstError =
        summaryRes.reason?.data?.error ||
        summaryRes.reason?.message ||
        "Failed to load supplier bills summary";
    }

    if (listRes.status === "fulfilled") {
      const rows = normalizeBillsResponse(listRes.value)
        .map(normalizeBill)
        .filter(Boolean);

      setBills(rows);
      setSelectedBillId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev))
          ? prev
          : (rows[0]?.id ?? null),
      );
    } else {
      setBills([]);
      setSelectedBillId(null);
      firstError =
        firstError ||
        listRes.reason?.data?.error ||
        listRes.reason?.message ||
        "Failed to load supplier bills";
    }

    setErrorText(firstError);
    setLoading(false);
  }

  async function loadDetail(id) {
    if (!id) {
      setBillDetail({ bill: null, items: [], payments: [] });
      return;
    }

    setDetailLoading(true);
    try {
      const result = await apiFetch(`/owner/supplier-bills/${id}`, {
        method: "GET",
      });

      setBillDetail(normalizeBillDetail(result));
    } catch {
      setBillDetail({ bill: null, items: [], payments: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadSupplierOptions();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, locationId, supplierId, status]);

  useEffect(() => {
    loadList();
  }, [q, locationId, supplierId, status]);

  useEffect(() => {
    loadDetail(selectedBillId);
  }, [selectedBillId]);

  async function handleActionSaved(actionText, result) {
    setSuccessText(actionText);
    const nextBillId = result?.bill?.id ?? selectedBillId ?? null;

    setCreatingBill(false);
    setEditingBill(null);
    setPaymentBill(null);
    setVoidBill(null);

    await loadList();

    if (nextBillId) {
      setSelectedBillId(nextBillId);
      await loadDetail(nextBillId);
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  const visibleRows = bills.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Supplier bills"
          subtitle="Loading owner-wide supplier bill visibility."
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
            title="Supplier bills overview"
            subtitle="Owner-wide procurement liabilities with exact currency visibility."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              <StatCard
                label="Bills"
                value={safeNumber(summary?.billsCount)}
                sub="Recorded supplier invoices"
              />
              <StatCard
                label="Paid"
                value={safeNumber(summary?.paidAmount).toLocaleString()}
                sub="Settled amount across bills"
              />
              <StatCard
                label="Partial"
                value={safeNumber(summary?.partiallyPaidCount)}
                sub="Installment invoices"
              />
              <StatCard
                label="Overdue bills"
                value={safeNumber(summary?.overdueBillsCount)}
                sub="Invoices past due date"
              />
              <StatCard
                label="Outstanding (RWF)"
                value={money(summary?.balanceRWF, "RWF")}
                sub="Open RWF liability"
              />
              <StatCard
                label="Outstanding (USD)"
                value={money(summary?.balanceUSD, "USD")}
                sub="Open USD liability"
              />
              <StatCard
                label="Overdue (RWF)"
                value={money(summary?.overdueRWF, "RWF")}
                sub="Late RWF bills"
              />
              <StatCard
                label="Overdue (USD)"
                value={money(summary?.overdueUSD, "USD")}
                sub="Late USD bills"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Bill filters"
            subtitle="Click any bill card below to open full detail, items, and payments."
            right={
              <AsyncButton
                idleText="Create bill"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => setCreatingBill(true)}
              />
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search supplier, bill number, note, branch"
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
                <option value="OPEN">Open</option>
                <option value="PARTIALLY_PAID">Partially paid</option>
                <option value="PAID">Paid</option>
                <option value="VOID">Void</option>
              </FormSelect>
            </div>
          </SectionCard>

          <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard
              title="Supplier bills directory"
              subtitle="Select a bill to inspect details, items, and installment payments."
            >
              {bills.length === 0 ? (
                <EmptyState text="No supplier bills match the current owner filters." />
              ) : (
                <div className="space-y-4">
                  {visibleRows.map((row) => (
                    <BillCard
                      key={row.id}
                      row={row}
                      active={String(row.id) === String(selectedBillId)}
                      onSelect={(picked) => setSelectedBillId(picked?.id)}
                      locations={locationOptions}
                    />
                  ))}
                </div>
              )}

              {visibleCount < bills.length ? (
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

            {detailBill ? (
              <SectionCard
                title="Selected bill detail"
                subtitle="Focused owner view of supplier liability and bill activity."
                right={
                  <div className="flex flex-wrap gap-2">
                    <AsyncButton
                      idleText="Edit bill"
                      loadingText="Opening..."
                      successText="Ready"
                      onClick={async () => setEditingBill(detailBill)}
                      variant="secondary"
                    />

                    {String(detailBill?.status || "").toUpperCase() !==
                      "PAID" &&
                    String(detailBill?.status || "").toUpperCase() !==
                      "VOID" ? (
                      <AsyncButton
                        idleText="Add payment"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => setPaymentBill(detailBill)}
                        variant="secondary"
                      />
                    ) : null}

                    {Number(detailBill?.paidAmount || 0) <= 0 &&
                    String(detailBill?.status || "").toUpperCase() !==
                      "VOID" ? (
                      <AsyncButton
                        idleText="Void bill"
                        loadingText="Opening..."
                        successText="Ready"
                        onClick={async () => setVoidBill(detailBill)}
                        variant="secondary"
                      />
                    ) : null}
                  </div>
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
                        label="Supplier"
                        value={
                          <span className="text-[20px]">
                            {safe(detailBill?.supplierName) || "-"}
                          </span>
                        }
                        sub={`Bill #${safe(detailBill?.billNo) || safe(detailBill?.id) || "-"}`}
                      />

                      <StatCard
                        label="Branch"
                        value={
                          <span className="text-[20px]">
                            {displayBranch(detailBill, locationOptions)}
                          </span>
                        }
                        sub={displayBranchSub(detailBill, locationOptions)}
                      />

                      <StatCard
                        label={`Balance (${normalizeCurrency(detailBill?.currency)})`}
                        value={
                          <span className="text-[20px]">
                            {money(detailBill?.balance, detailBill?.currency)}
                          </span>
                        }
                        sub="Outstanding amount"
                      />

                      <StatCard
                        label="Created by"
                        value={
                          <span className="text-[20px]">
                            {displayCreatedBy(detailBill)}
                          </span>
                        }
                        sub={safe(detailBill?.status) || "-"}
                      />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Bill profile
                        </p>

                        <div className="mt-4 grid gap-3">
                          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Note
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                              {safe(detailBill?.note) || "No note recorded"}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Issued date
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {safeDate(detailBill?.issuedDate)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Due date
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {safeDate(detailBill?.dueDate)}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Created by
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {displayCreatedBy(detailBill)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Last updated
                              </p>
                              <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {safeDate(detailBill?.updatedAt)}
                              </p>
                            </div>
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
                              Total ({normalizeCurrency(detailBill?.currency)})
                            </p>
                            <p className="mt-2 text-2xl font-black text-stone-950 dark:text-stone-50">
                              {money(
                                detailBill?.totalAmount,
                                detailBill?.currency,
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                            <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                              Paid ({normalizeCurrency(detailBill?.currency)})
                            </p>
                            <p className="mt-2 text-2xl font-black text-stone-950 dark:text-stone-50">
                              {money(
                                detailBill?.paidAmount,
                                detailBill?.currency,
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
                            <p className="text-xs uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">
                              Remaining (
                              {normalizeCurrency(detailBill?.currency)})
                            </p>
                            <p className="mt-2 text-2xl font-black text-rose-900 dark:text-rose-100">
                              {money(detailBill?.balance, detailBill?.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Bill items
                        </p>

                        {(billDetail?.items || []).length === 0 ? (
                          <div className="mt-4">
                            <EmptyState text="No bill items found." />
                          </div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {(billDetail?.items || []).map((item) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                      {safe(item?.description) || "-"}
                                    </p>
                                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                      Product ID: {safe(item?.productId) || "-"}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                    {money(
                                      item?.lineTotal,
                                      detailBill?.currency,
                                    )}
                                  </span>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                      Qty
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                      {safeNumber(item?.qty)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                      Unit cost (
                                      {normalizeCurrency(detailBill?.currency)})
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">
                                      {money(
                                        item?.unitCost,
                                        detailBill?.currency,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                          Installment payments
                        </p>

                        {(billDetail?.payments || []).length === 0 ? (
                          <div className="mt-4">
                            <EmptyState text="No payment installments recorded yet." />
                          </div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {(billDetail?.payments || []).map((payment) => (
                              <div
                                key={payment.id}
                                className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                      {safe(payment?.method) || "-"}
                                    </p>
                                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                      {safeDate(payment?.paidAt)}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    {money(
                                      payment?.amount,
                                      detailBill?.currency,
                                    )}
                                  </span>
                                </div>

                                <div className="mt-3 space-y-2 text-sm">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-stone-500 dark:text-stone-400">
                                      Reference
                                    </span>
                                    <span className="text-right break-all font-semibold text-stone-900 dark:text-stone-100">
                                      {safe(payment?.reference) || "-"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-stone-500 dark:text-stone-400">
                                      Created by
                                    </span>
                                    <span className="text-right font-semibold text-stone-900 dark:text-stone-100">
                                      {safe(payment?.createdByName) ||
                                        (payment?.createdByUserId != null
                                          ? `User #${payment.createdByUserId}`
                                          : "-")}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                                  {safe(payment?.note) || "No note recorded."}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </SectionCard>
            ) : (
              <SectionCard
                title="Selected bill detail"
                subtitle="This section appears after a supplier bill is selected."
              >
                <EmptyState text="Select a supplier bill above to inspect details and payments." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      <CreateBillModal
        open={creatingBill}
        suppliers={supplierOptions}
        locations={locationOptions}
        onClose={() => setCreatingBill(false)}
        onSaved={(result) => handleActionSaved("Supplier bill created", result)}
      />

      <EditBillModal
        open={!!editingBill}
        bill={editingBill}
        suppliers={supplierOptions}
        locations={locationOptions}
        onClose={() => setEditingBill(null)}
        onSaved={(result) => handleActionSaved("Supplier bill updated", result)}
      />

      <AddPaymentModal
        open={!!paymentBill}
        bill={paymentBill}
        onClose={() => setPaymentBill(null)}
        onSaved={(result) =>
          handleActionSaved("Supplier bill payment recorded", result)
        }
      />

      <VoidBillModal
        open={!!voidBill}
        bill={voidBill}
        onClose={() => setVoidBill(null)}
        onSaved={(result) => handleActionSaved("Supplier bill voided", result)}
      />
    </div>
  );
}
