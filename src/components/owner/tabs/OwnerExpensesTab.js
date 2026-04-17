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
import { createExpense, listExpenses, voidExpense } from "../../../lib/api";
import { resolveAssetUrl, uploadExpenseProofs } from "../../../lib/apiUpload";
import { useCallback, useEffect, useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";

const PAGE_SIZE = 20;
const METHOD_OPTIONS = ["CASH", "BANK", "MOMO", "CARD", "OTHER"];
const STATUS_OPTIONS = ["POSTED", "VOID"];
const OWNER_EXPENSE_CATEGORY_OPTIONS = [
  "GENERAL",
  "TRANSPORT",
  "UTILITIES",
  "RENT",
  "SALARIES",
  "REPAIRS",
  "MARKETING",
  "OFFICE_SUPPLIES",
  "TAX_ADMIN_FEES",
  "PETTY_CASH",
  "OTHER_OPERATING",
];

function money(v, currency = "RWF") {
  return `${String(currency || "RWF").toUpperCase()} ${safeNumber(
    v,
  ).toLocaleString()}`;
}

function makeCreateForm() {
  return {
    locationId: "",
    category: "GENERAL",
    amount: "",
    expenseDate: "",
    method: "BANK",
    payeeName: "",
    reference: "",
    note: "",
    attachments: [],
  };
}

function normalizeExpensesResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.expenses)) return result.expenses;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeAttachment(row, index = 0) {
  if (!row) return null;

  const fileUrl = safe(row.fileUrl || row.file_url || row.url || row.path);
  if (!fileUrl) return null;

  return {
    id: row.id ?? `att-${index}-${fileUrl}`,
    fileUrl,
    absoluteUrl: resolveAssetUrl(fileUrl),
    originalName: row.originalName || row.original_name || "",
    contentType: row.contentType || row.content_type || "",
    fileSize:
      row.fileSize == null && row.file_size == null
        ? null
        : Number(row.fileSize ?? row.file_size ?? 0),
  };
}

function normalizeExpense(row) {
  if (!row) return null;

  const attachments = Array.isArray(row.attachments)
    ? row.attachments.map(normalizeAttachment).filter(Boolean)
    : [];

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    cashSessionId: row.cashSessionId ?? row.cash_session_id ?? null,
    cashierId: row.cashierId ?? row.cashier_id ?? null,
    cashierName: row.cashierName ?? row.cashier_name ?? "",
    cashierEmail: row.cashierEmail ?? row.cashier_email ?? "",
    category: row.category ?? "GENERAL",
    amount: Number(row.amount ?? 0),
    expenseDate: row.expenseDate ?? row.expense_date ?? null,
    method: row.method ?? "CASH",
    status: row.status ?? "POSTED",
    payeeName: row.payeeName ?? row.payee_name ?? "",
    reference: row.reference ?? "",
    note: row.note ?? "",
    voidedAt: row.voidedAt ?? row.voided_at ?? null,
    voidedByUserId: row.voidedByUserId ?? row.voided_by_user_id ?? null,
    voidReason: row.voidReason ?? row.void_reason ?? "",
    ledgerEntryId: row.ledgerEntryId ?? row.ledger_entry_id ?? null,
    attachmentCount: Number(
      row.attachmentCount ?? row.attachment_count ?? attachments.length ?? 0,
    ),
    attachments,
    createdAt: row.createdAt ?? row.created_at ?? null,
  };
}

function displayBranch(row) {
  if (safe(row?.locationName)) {
    return safe(row?.locationCode)
      ? `${safe(row.locationName)} (${safe(row.locationCode)})`
      : safe(row.locationName);
  }

  if (row?.locationId != null) {
    return `Branch #${row.locationId}`;
  }

  return "-";
}

function displayCashier(row) {
  if (safe(row?.cashierName)) return safe(row.cashierName);
  if (safe(row?.cashierEmail)) return safe(row.cashierEmail);
  if (row?.cashierId != null) return `User #${safeNumber(row.cashierId)}`;
  return "-";
}

function statusTone(status, active) {
  const value = String(status || "")
    .trim()
    .toUpperCase();

  if (active) {
    return "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950";
  }

  if (value === "VOID") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
}

function methodTone(method, active) {
  const value = String(method || "")
    .trim()
    .toUpperCase();

  if (active) {
    return "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950";
  }

  if (value === "BANK") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (value === "MOMO") {
    return "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300";
  }
  if (value === "CARD") {
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300";
  }
  if (value === "CASH") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function categoryTone(category, active) {
  const value = String(category || "")
    .trim()
    .toUpperCase();

  if (active) {
    return "bg-white/10 text-white dark:bg-stone-900/10 dark:text-stone-950";
  }

  if (value.includes("TRANSPORT")) {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  if (value.includes("UTILITY") || value.includes("BILL")) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (value.includes("SALARY") || value.includes("PAYROLL")) {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }

  if (value.includes("MARKETING")) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (value.includes("REPAIR")) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function fileSizeText(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

function AttachmentList({ attachments = [] }) {
  if (!attachments.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
        No proof attachments linked.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {attachments.map((file) => (
        <a
          key={file.id || file.fileUrl}
          href={file.absoluteUrl || resolveAssetUrl(file.fileUrl)}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
        >
          <p className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
            {safe(file.originalName) || safe(file.fileUrl) || "Attachment"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            {safe(file.contentType) ? (
              <span>{safe(file.contentType)}</span>
            ) : null}
            {fileSizeText(file.fileSize) ? (
              <span>{fileSizeText(file.fileSize)}</span>
            ) : null}
          </div>
        </a>
      ))}
    </div>
  );
}

function ExpenseCard({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row)}
      className={
        "group w-full overflow-hidden rounded-[28px] border text-left transition-all duration-200 " +
        (active
          ? "border-stone-900 bg-stone-900 text-white shadow-xl ring-1 ring-stone-700 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950 dark:ring-stone-300"
          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700")
      }
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold sm:text-lg">
                Expense #{safe(row?.id) || "-"}
              </h3>

              <span
                className={
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                  statusTone(row?.status, active)
                }
              >
                {safe(row?.status) || "POSTED"}
              </span>

              <span
                className={
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                  methodTone(row?.method, active)
                }
              >
                {safe(row?.method) || "CASH"}
              </span>

              <span
                className={
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                  categoryTone(row?.category, active)
                }
              >
                {safe(row?.category) || "GENERAL"}
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
                <span className="font-medium">Branch:</span>{" "}
                {displayBranch(row)}
              </p>
              <p className="truncate">
                <span className="font-medium">Payee:</span>{" "}
                {safe(row?.payeeName) || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Expense date:</span>{" "}
                {safeDate(row?.expenseDate)}
              </p>
              <p className="truncate">
                <span className="font-medium">Proofs:</span>{" "}
                {safeNumber(row?.attachmentCount || 0)}
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
              Expense amount
            </p>
            <p className="mt-2 text-xl font-black sm:text-2xl">
              {money(row?.amount, "RWF")}
            </p>
            <p
              className={
                "mt-1 text-xs " +
                (active
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400")
              }
            >
              {safe(row?.reference) || "No reference"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
          <p
            className={
              "text-[11px] uppercase tracking-[0.14em] " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            Note
          </p>
          <p
            className={
              "mt-2 text-sm " +
              (active
                ? "text-white dark:text-stone-950"
                : "text-stone-700 dark:text-stone-300")
            }
          >
            {safe(row?.note) || "No note recorded"}
          </p>
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

function CreateExpenseModal({ open, locations, onClose, onSaved }) {
  const [form, setForm] = useState(makeCreateForm);
  const [errorText, setErrorText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  const resetModal = useCallback(() => {
    setForm(makeCreateForm());
    setErrorText("");
    setUploading(false);
    setPendingFiles([]);
  }, []);

  function handleClose() {
    resetModal();
    onClose?.();
  }

  async function handleSave() {
    setErrorText("");

    try {
      let uploadedAttachments = [];

      if (pendingFiles.length) {
        setUploading(true);
        uploadedAttachments = await uploadExpenseProofs(pendingFiles);
        setUploading(false);
      }

      const payload = {
        locationId: Number(form.locationId),
        category: String(form.category || "").trim() || "GENERAL",
        amount: Number(form.amount),
        expenseDate: form.expenseDate || undefined,
        method: form.method || undefined,
        payeeName: form.payeeName.trim() || undefined,
        reference: form.reference.trim() || undefined,
        note: form.note.trim() || undefined,
        attachments: uploadedAttachments,
      };

      const result = await createExpense(payload);
      resetModal();
      onSaved?.(result);
    } catch (e) {
      setUploading(false);
      setErrorText(e?.data?.error || e?.message || "Failed to create expense");
    }
  }

  if (!open) return null;

  return (
    <ModalShell
      title="Create owner expense"
      subtitle="Record a controlled operating expense with funding source, payee, and proof."
      onClose={handleClose}
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
            Expense date
          </label>
          <FormInput
            type="date"
            value={form.expenseDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, expenseDate: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Category
          </label>
          <FormSelect
            value={form.category}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, category: e.target.value }))
            }
          >
            {OWNER_EXPENSE_CATEGORY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Source of money
          </label>
          <FormSelect
            value={form.method}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, method: e.target.value }))
            }
          >
            {METHOD_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Amount
          </label>
          <FormInput
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
            placeholder="Amount"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Payee
          </label>
          <FormInput
            value={form.payeeName}
            maxLength={120}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, payeeName: e.target.value }))
            }
            placeholder="Who received this payment?"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Reference
          </label>
          <FormInput
            value={form.reference}
            maxLength={80}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reference: e.target.value }))
            }
            placeholder="Receipt number, transfer reference, invoice code..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Reason / note
          </label>
          <textarea
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={4}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Explain why this expense happened"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Proof attachments
          </label>
          <div className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-950">
            <input
              type="file"
              multiple
              onChange={(e) =>
                setPendingFiles(Array.from(e.target.files || []))
              }
              className="block w-full text-sm text-stone-700 dark:text-stone-300"
            />
            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
              Upload receipts, invoices, transfer slips, or other evidence
              before saving.
            </p>

            {pendingFiles.length ? (
              <div className="mt-3 grid gap-2">
                {pendingFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-stone-800 dark:bg-stone-900"
                  >
                    <p className="truncate font-medium text-stone-900 dark:text-stone-100">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      {file.type || "Unknown type"}{" "}
                      {fileSizeText(file.size)
                        ? `• ${fileSizeText(file.size)}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText="Create expense"
          loadingText={uploading ? "Uploading proofs..." : "Creating..."}
          successText="Created"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function VoidExpenseModal({ open, expense, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState("");

  function handleClose() {
    setReason("");
    setErrorText("");
    onClose?.();
  }

  async function handleVoid() {
    setErrorText("");
    try {
      const result = await voidExpense(expense?.id, reason);
      setReason("");
      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to void expense");
    }
  }

  if (!open || !expense) return null;

  return (
    <ModalShell
      title={`Void expense #${safeNumber(expense?.id)}`}
      subtitle="This will keep the original record, mark it VOID, and post a reversing money movement."
      onClose={handleClose}
    >
      <AlertBox message={errorText} />

      <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
        <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
          Amount: {money(expense?.amount, "RWF")}
        </p>
        <p className="mt-1 text-sm text-rose-800 dark:text-rose-200">
          Category: {safe(expense?.category) || "GENERAL"}
        </p>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
          Void reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
          placeholder="Explain why this expense must be voided"
        />
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Cancel
        </button>

        <AsyncButton
          idleText="Void expense"
          loadingText="Voiding..."
          successText="Voided"
          onClick={handleVoid}
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerExpensesTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);

  const [q, setQ] = useState("");
  const [locationId, setLocationId] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [creatingExpense, setCreatingExpense] = useState(false);
  const [voidingExpense, setVoidingExpense] = useState(false);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const selectedExpense =
    selectedExpenseId == null
      ? null
      : expenses.find((row) => String(row.id) === String(selectedExpenseId)) ||
        null;

  const overview = useMemo(() => {
    const rows = Array.isArray(expenses) ? expenses : [];

    let totalCount = rows.length;
    let totalAmount = 0;
    let voidedCount = 0;
    let proofBackedCount = 0;

    const methods = new Set();
    const branches = new Set();

    for (const row of rows) {
      totalAmount += Number(row?.amount || 0);
      if (String(row?.status || "").toUpperCase() === "VOID") voidedCount += 1;
      if (Number(row?.attachmentCount || 0) > 0) proofBackedCount += 1;
      if (safe(row?.method)) methods.add(String(row.method).toUpperCase());
      if (row?.locationId != null) branches.add(String(row.locationId));
    }

    return {
      totalCount,
      totalAmount,
      voidedCount,
      proofBackedCount,
      methodCount: methods.size,
      branchCount: branches.size,
    };
  }, [expenses]);

  function buildParams(extra = {}) {
    return {
      q: q || undefined,
      locationId: locationId || undefined,
      category: category || undefined,
      method: method || undefined,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      limit: extra.limit || PAGE_SIZE,
      cursor: extra.cursor || undefined,
    };
  }

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setErrorText("");

    try {
      const result = await listExpenses(buildParams({ limit: PAGE_SIZE }));
      const rows = normalizeExpensesResponse(result)
        .map(normalizeExpense)
        .filter(Boolean);

      setExpenses(rows);
      setNextCursor(result?.nextCursor ?? null);
      setSelectedExpenseId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev))
          ? prev
          : (rows[0]?.id ?? null),
      );
    } catch (e) {
      setExpenses([]);
      setNextCursor(null);
      setSelectedExpenseId(null);
      setErrorText(e?.data?.error || e?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [q, locationId, category, method, status, from, to]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    setErrorText("");

    try {
      const result = await listExpenses(
        buildParams({ limit: PAGE_SIZE, cursor: nextCursor }),
      );

      const rows = normalizeExpensesResponse(result)
        .map(normalizeExpense)
        .filter(Boolean);

      setExpenses((prev) => [...prev, ...rows]);
      setNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to load more expenses",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [
    nextCursor,
    loadingMore,
    q,
    locationId,
    category,
    method,
    status,
    from,
    to,
  ]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  async function handleCreated(result) {
    setCreatingExpense(false);
    setSuccessText("Expense created");

    await loadFirstPage();

    const nextId = result?.expense?.id ?? null;
    if (nextId) setSelectedExpenseId(nextId);

    window.setTimeout(() => setSuccessText(""), 2500);
  }

  async function handleVoided(result) {
    setVoidingExpense(false);
    setSuccessText("Expense voided");

    await loadFirstPage();

    const nextId = result?.expense?.id ?? null;
    if (nextId) setSelectedExpenseId(nextId);

    window.setTimeout(() => setSuccessText(""), 2500);
  }

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Operating expenses"
          subtitle="Loading owner-wide operating expense visibility."
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
            title="Expense overview"
            subtitle="Owner-wide operating expense control across branches, money sources, and proof-backed records."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard
                label="Expenses"
                value={safeNumber(overview?.totalCount)}
                sub="Loaded expenses"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Expense total"
                value={money(overview?.totalAmount, "RWF")}
                sub="Loaded expense value"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Branches"
                value={safeNumber(overview?.branchCount)}
                sub="Branches in current view"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Methods"
                value={safeNumber(overview?.methodCount)}
                sub="Money sources used"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="With proofs"
                value={safeNumber(overview?.proofBackedCount)}
                sub="Proof-backed expenses"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="Voided"
                value={safeNumber(overview?.voidedCount)}
                sub="Voided records"
                valueClassName="text-[17px] leading-tight"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Expense filters"
            subtitle="Search owner expenses by branch, category, method, status, and date."
            right={
              <AsyncButton
                idleText="Create expense"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => setCreatingExpense(true)}
              />
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search note, reference, payee, branch"
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {OWNER_EXPENSE_CATEGORY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="">All methods</option>
                {METHOD_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
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

          <div className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
            <SectionCard
              title="Expense directory"
              subtitle="Cross-branch operating expense timeline. Select one to inspect money source, proofs, and void state."
            >
              {expenses.length === 0 ? (
                <EmptyState text="No expenses match the current filters." />
              ) : (
                <div className="space-y-4">
                  {expenses.map((row) => (
                    <ExpenseCard
                      key={row.id}
                      row={row}
                      active={String(row.id) === String(selectedExpenseId)}
                      onSelect={(picked) => setSelectedExpenseId(picked?.id)}
                    />
                  ))}
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

            {selectedExpense ? (
              <SectionCard
                title="Selected expense detail"
                subtitle="Owner-focused view of method, payee, proofs, traceability, and controlled voiding."
                right={
                  String(selectedExpense?.status || "").toUpperCase() ===
                  "POSTED" ? (
                    <button
                      type="button"
                      onClick={() => setVoidingExpense(true)}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-300 bg-white px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-800 dark:bg-stone-900 dark:text-rose-300 dark:hover:bg-rose-950/20"
                    >
                      Void expense
                    </button>
                  ) : null
                }
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Expense"
                    value={`#${safeNumber(selectedExpense?.id)}`}
                    sub={safeDate(selectedExpense?.createdAt)}
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Status"
                    value={safe(selectedExpense?.status) || "POSTED"}
                    sub={
                      selectedExpense?.voidedAt
                        ? `Voided ${safeDate(selectedExpense.voidedAt)}`
                        : "Active expense"
                    }
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Amount"
                    value={money(selectedExpense?.amount, "RWF")}
                    sub={safe(selectedExpense?.method) || "CASH"}
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Proofs"
                    value={safeNumber(selectedExpense?.attachmentCount || 0)}
                    sub={
                      selectedExpense?.ledgerEntryId
                        ? `Ledger #${safeNumber(selectedExpense.ledgerEntryId)}`
                        : "No ledger id"
                    }
                    valueClassName="text-[17px] leading-tight"
                  />
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Expense profile
                    </p>

                    <div className="mt-4 grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Category
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {safe(selectedExpense?.category) || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Expense date
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {safeDate(selectedExpense?.expenseDate)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Branch
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {displayBranch(selectedExpense)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Payee
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {safe(selectedExpense?.payeeName) || "No payee"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Reference
                        </p>
                        <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                          {safe(selectedExpense?.reference) || "No reference"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Reason / note
                        </p>
                        <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                          {safe(selectedExpense?.note) || "No note recorded"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Traceability
                    </p>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                          Recorded by
                        </p>
                        <p className="mt-2 text-xl font-black text-stone-950 dark:text-stone-50">
                          {displayCashier(selectedExpense)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                          Money source
                        </p>
                        <p className="mt-2 text-xl font-black text-stone-950 dark:text-stone-50">
                          {safe(selectedExpense?.method) || "-"}
                        </p>
                      </div>

                      {String(selectedExpense?.status || "").toUpperCase() ===
                      "VOID" ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
                          <p className="text-xs uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">
                            Void details
                          </p>
                          <p className="mt-2 text-sm font-semibold text-rose-900 dark:text-rose-100">
                            {safe(selectedExpense?.voidReason) ||
                              "No reason captured"}
                          </p>
                          <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                            Voided at {safeDate(selectedExpense?.voidedAt)}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                          <p className="text-xs uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                            Current state
                          </p>
                          <p className="mt-2 text-xl font-black text-emerald-900 dark:text-emerald-100">
                            Posted
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Proof attachments
                  </p>
                  <div className="mt-4">
                    <AttachmentList
                      attachments={selectedExpense?.attachments || []}
                    />
                  </div>
                </div>
              </SectionCard>
            ) : (
              <SectionCard
                title="Selected expense detail"
                subtitle="This section appears after an expense is selected."
              >
                <EmptyState text="Select an expense card above to inspect its detail." />
              </SectionCard>
            )}
          </div>
        </>
      )}

      <CreateExpenseModal
        open={creatingExpense}
        locations={locationOptions}
        onClose={() => setCreatingExpense(false)}
        onSaved={handleCreated}
      />

      <VoidExpenseModal
        open={voidingExpense}
        expense={selectedExpense}
        onClose={() => setVoidingExpense(false)}
        onSaved={handleVoided}
      />
    </div>
  );
}
