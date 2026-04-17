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
} from "./../OwnerShared";
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

function normalizeListResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.movements)) return result.movements;
  if (Array.isArray(result?.payments)) return result.payments;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeSummaryResponse(result) {
  return result?.summary || result || {};
}

function normalizeBreakdownResponse(result) {
  return result?.breakdown || result || {};
}

function normalizeLoansResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.loans)) return result.loans;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeLoanSummaryResponse(result) {
  return result?.summary || result || {};
}

function normalizeCustomersResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.customers)) return result.customers;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeCustomer(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    name: row.name ?? row.customerName ?? row.customer_name ?? "",
    phone: row.phone ?? row.customerPhone ?? row.customer_phone ?? "",
    email: row.email ?? row.customerEmail ?? row.customer_email ?? "",
  };
}

function normalizeMovement(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    movementType: row.movementType ?? row.movement_type ?? "",
    direction: String(row.direction || "").toUpperCase(),

    saleId: row.saleId ?? row.sale_id ?? null,
    billId: row.billId ?? row.bill_id ?? null,
    expenseId: row.expenseId ?? row.expense_id ?? null,
    refundId: row.refundId ?? row.refund_id ?? null,
    depositId: row.depositId ?? row.deposit_id ?? null,
    ownerLoanId: row.ownerLoanId ?? row.owner_loan_id ?? null,
    repaymentId: row.repaymentId ?? row.repayment_id ?? null,

    locationId: row.location?.id ?? row.locationId ?? row.location_id ?? null,

    locationName:
      row.location?.name ?? row.locationName ?? row.location_name ?? "",

    locationCode:
      row.location?.code ?? row.locationCode ?? row.location_code ?? "",

    actorUserId: row.actorUserId ?? row.actor_user_id ?? null,
    actorName: row.actorName ?? row.actor_name ?? "",

    cashierId: row.cashierId ?? row.cashier_id ?? null,
    cashierName: row.cashierName ?? row.cashier_name ?? "",

    customerName: row.customerName ?? row.customer_name ?? "",
    customerPhone: row.customerPhone ?? row.customer_phone ?? "",

    supplierName: row.supplierName ?? row.supplier_name ?? "",
    payeeName: row.payeeName ?? row.payee_name ?? "",

    amount: Number(row.amount ?? 0),
    method: String(row.method || "OTHER").toUpperCase(),
    reference: row.reference ?? "",
    note: row.note ?? "",
    cashSessionId: row.cashSessionId ?? row.cash_session_id ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
  };
}

function normalizeLoan(row) {
  if (!row) return null;

  const principalAmount = Number(
    row.principalAmount ?? row.principal_amount ?? row.amount ?? 0,
  );
  const repaidAmount = Number(row.repaidAmount ?? row.repaid_amount ?? 0);
  const remainingAmount =
    row.remainingAmount != null
      ? Number(row.remainingAmount)
      : row.balanceAmount != null
        ? Number(row.balanceAmount)
        : Math.max(0, principalAmount - repaidAmount);

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    locationName: row.locationName ?? row.location_name ?? "",
    locationCode: row.locationCode ?? row.location_code ?? "",
    receiverType: String(
      row.receiverType ?? row.receiver_type ?? "OTHER",
    ).toUpperCase(),
    receiverName: row.receiverName ?? row.receiver_name ?? "",
    receiverPhone: row.receiverPhone ?? row.receiver_phone ?? "",
    receiverEmail: row.receiverEmail ?? row.receiver_email ?? "",
    customerId: row.customerId ?? row.customer_id ?? null,
    customerName: row.customerName ?? row.customer_name ?? "",
    principalAmount,
    repaidAmount,
    remainingAmount,
    currency: normalizeCurrency(row.currency),
    method: String(
      row.method ??
        row.disbursementMethod ??
        row.disbursement_method ??
        "OTHER",
    ).toUpperCase(),
    status: String(row.status || "OPEN").toUpperCase(),
    reference: row.reference ?? "",
    note: row.note ?? "",
    issuedAt:
      row.issuedAt ??
      row.issued_at ??
      row.disbursedAt ??
      row.disbursed_at ??
      row.createdAt ??
      row.created_at ??
      null,
    dueDate: row.dueDate ?? row.due_date ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    createdByUserId: row.createdByUserId ?? row.created_by_user_id ?? null,
    createdByName: row.createdByName ?? row.created_by_name ?? "",
    repaymentsCount: Number(row.repaymentsCount ?? row.repayments_count ?? 0),
  };
}

function displayBranch(row) {
  if (safe(row?.locationName)) {
    return safe(row?.locationCode)
      ? `${safe(row.locationName)} (${safe(row.locationCode)})`
      : safe(row.locationName);
  }

  if (row?.locationId != null && String(row.locationId).trim()) {
    return `Branch #${row.locationId}`;
  }

  return "-";
}

function displayActor(row) {
  if (safe(row?.actorName)) return safe(row.actorName);
  if (safe(row?.cashierName)) return safe(row.cashierName);
  if (safe(row?.createdByName)) return safe(row.createdByName);
  if (row?.actorUserId != null) return `User #${safeNumber(row.actorUserId)}`;
  if (row?.cashierId != null) return `User #${safeNumber(row.cashierId)}`;
  if (row?.createdByUserId != null)
    return `User #${safeNumber(row.createdByUserId)}`;
  return "-";
}

function movementTypeLabel(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v === "CUSTOMER_PAYMENT") return "Customer payment";
  if (v === "SUPPLIER_BILL_PAYMENT") return "Supplier bill payment";
  if (v === "EXPENSE") return "Expense";
  if (v === "REFUND") return "Refund";
  if (v === "DEPOSIT_OUT") return "Money sent out";
  if (v === "OWNER_LOAN_OUT") return "Money given out as loan";
  if (v === "OWNER_LOAN_REPAYMENT_IN") return "Loan repayment received";
  return safe(value) || "Movement";
}

function movementTone(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v === "CUSTOMER_PAYMENT" || v === "OWNER_LOAN_REPAYMENT_IN") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (v === "SUPPLIER_BILL_PAYMENT") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (v === "EXPENSE" || v === "OWNER_LOAN_OUT") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (v === "REFUND") {
    return "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300";
  }

  if (v === "DEPOSIT_OUT") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300";
}

function directionLabel(value) {
  return String(value || "").toUpperCase() === "OUT" ? "Money out" : "Money in";
}

function directionTone(value) {
  return String(value || "").toUpperCase() === "OUT"
    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
}

function methodTone(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v === "CASH") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (v === "BANK") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  }
  if (v === "MOMO") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }
  if (v === "CARD") {
    return "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300";
  }
  return "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300";
}

function methodLabel(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();

  if (v === "MOMO") return "Mobile money";
  if (v === "CARD") return "Card";
  if (v === "BANK") return "Bank";
  if (v === "CASH") return "Cash";
  if (v === "OTHER") return "Other";
  return safe(value) || "-";
}

function counterpartyLabel(row) {
  const movementType = String(row?.movementType || "")
    .trim()
    .toUpperCase();

  if (movementType === "CUSTOMER_PAYMENT") {
    if (safe(row?.customerName)) return safe(row.customerName);
    if (safe(row?.customerPhone)) return safe(row.customerPhone);
    return "Customer";
  }

  if (movementType === "SUPPLIER_BILL_PAYMENT") {
    if (safe(row?.supplierName)) return safe(row.supplierName);
    return "Supplier";
  }

  if (movementType === "EXPENSE") {
    if (safe(row?.payeeName)) return safe(row.payeeName);
    return "Business expense";
  }

  if (movementType === "REFUND") {
    if (safe(row?.customerName)) return safe(row.customerName);
    if (safe(row?.customerPhone)) return safe(row.customerPhone);
    return "Refund";
  }

  if (movementType === "DEPOSIT_OUT") {
    return "Money moved out";
  }

  if (
    movementType === "OWNER_LOAN_OUT" ||
    movementType === "OWNER_LOAN_REPAYMENT_IN"
  ) {
    if (safe(row?.payeeName)) return safe(row.payeeName);
    if (safe(row?.customerName)) return safe(row.customerName);
    return "Loan receiver";
  }

  return "-";
}

function movementEntityLabel(row) {
  const movementType = String(row?.movementType || "")
    .trim()
    .toUpperCase();

  if (movementType === "CUSTOMER_PAYMENT" && row?.saleId != null) {
    return `Sale #${safeNumber(row.saleId)}`;
  }

  if (movementType === "SUPPLIER_BILL_PAYMENT" && row?.billId != null) {
    return `Supplier bill #${safeNumber(row.billId)}`;
  }

  if (movementType === "EXPENSE" && row?.expenseId != null) {
    return `Expense #${safeNumber(row.expenseId)}`;
  }

  if (movementType === "REFUND" && row?.refundId != null) {
    return `Refund #${safeNumber(row.refundId)}`;
  }

  if (movementType === "DEPOSIT_OUT" && row?.depositId != null) {
    return `Money-out #${safeNumber(row.depositId)}`;
  }

  if (movementType === "OWNER_LOAN_OUT" && row?.ownerLoanId != null) {
    return `Loan #${safeNumber(row.ownerLoanId)}`;
  }

  if (
    movementType === "OWNER_LOAN_REPAYMENT_IN" &&
    row?.ownerLoanId != null &&
    row?.repaymentId != null
  ) {
    return `Loan #${safeNumber(row.ownerLoanId)} repayment #${safeNumber(row.repaymentId)}`;
  }

  return "-";
}

function MovementChip({ text, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {text}
    </span>
  );
}

function statusTone(status) {
  const v = String(status || "")
    .trim()
    .toUpperCase();
  if (v === "OPEN") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (v === "PARTIALLY_REPAID") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (v === "REPAID") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (v === "VOID") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }
  return "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300";
}

function loanReceiverLabel(loan) {
  if (String(loan?.receiverType || "").toUpperCase() === "CUSTOMER") {
    if (safe(loan?.customerName)) return safe(loan.customerName);
    if (safe(loan?.receiverName)) return safe(loan.receiverName);
    return "Customer";
  }

  if (safe(loan?.receiverName)) return safe(loan.receiverName);
  if (safe(loan?.receiverPhone)) return safe(loan.receiverPhone);
  return "Other receiver";
}

function loanReceiverSub(loan) {
  const parts = [];
  if (safe(loan?.receiverType)) {
    parts.push(
      String(loan.receiverType).toUpperCase() === "CUSTOMER"
        ? "Customer"
        : "Other person",
    );
  }
  if (safe(loan?.receiverPhone)) parts.push(safe(loan.receiverPhone));
  if (safe(loan?.receiverEmail)) parts.push(safe(loan.receiverEmail));
  return parts.length ? parts.join(" • ") : "-";
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

function SearchableCustomerPicker({
  disabled = false,
  locationId = "",
  selectedCustomer = null,
  onPick,
}) {
  const [query, setQuery] = useState(selectedCustomer?.name || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    setQuery(selectedCustomer?.name || "");
  }, [selectedCustomer?.id, selectedCustomer?.name]);

  useEffect(() => {
    if (disabled) {
      setResults([]);
      setOpen(false);
      setErrorText("");
      return;
    }

    const q = String(query || "").trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setErrorText("");
      return;
    }

    if (!locationId) {
      setResults([]);
      setOpen(false);
      setErrorText("Choose the branch first.");
      return;
    }

    let alive = true;

    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorText("");

      try {
        const result = await apiFetch(
          `/customers/search?q=${encodeURIComponent(q)}&locationId=${encodeURIComponent(locationId)}&limit=10`,
          { method: "GET" },
        );

        if (!alive) return;

        const rows = normalizeCustomersResponse(result)
          .map(normalizeCustomer)
          .filter(Boolean);

        setResults(rows);
        setOpen(true);
      } catch (e) {
        if (!alive) return;
        setResults([]);
        setOpen(false);
        setErrorText(
          e?.data?.error || e?.message || "Failed to search customers",
        );
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, disabled, locationId]);

  return (
    <div className="relative md:col-span-2">
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        Find customer
      </label>

      <FormInput
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Search by customer name or phone number"
        disabled={disabled || !locationId}
      />

      {selectedCustomer?.id ? (
        <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
          Chosen customer: <b>{selectedCustomer.name || "Unnamed customer"}</b>
          {selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}
          {selectedCustomer.email ? ` • ${selectedCustomer.email}` : ""}
        </div>
      ) : null}

      {errorText ? (
        <div className="mt-2 text-xs text-rose-600 dark:text-rose-300">
          {errorText}
        </div>
      ) : null}

      {open && !disabled && !!locationId ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl dark:border-stone-800 dark:bg-stone-950">
          {loading ? (
            <div className="px-3 py-3 text-sm text-stone-500 dark:text-stone-400">
              Looking for customers...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-stone-500 dark:text-stone-400">
              No matching customer found
            </div>
          ) : (
            <div className="grid gap-2">
              {results.map((customer) => (
                <button
                  key={String(customer.id)}
                  type="button"
                  onClick={() => {
                    onPick?.(customer);
                    setQuery(customer.name || customer.phone || "");
                    setOpen(false);
                  }}
                  className="rounded-xl border border-stone-200 px-3 py-3 text-left transition hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"
                >
                  <div className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                    {customer.name || "Unnamed customer"}
                  </div>
                  <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    {customer.phone || "No phone"}
                    {customer.email ? ` • ${customer.email}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CreateLoanModal({ open, locations = [], onClose, onSaved }) {
  if (!open) return null;

  return (
    <CreateLoanModalInner
      key={`create-loan-${locations.length}`}
      locations={locations}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function CreateLoanModalInner({ locations = [], onClose, onSaved }) {
  const [form, setForm] = useState({
    locationId: locations[0]?.id ? String(locations[0].id) : "",
    receiverType: "OTHER",
    customerId: "",
    receiverName: "",
    receiverPhone: "",
    receiverEmail: "",
    amount: "",
    currency: "RWF",
    method: "CASH",
    reference: "",
    note: "",
    dueDate: "",
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [errorText, setErrorText] = useState("");

  function handleReceiverTypeChange(nextType) {
    setForm((prev) => ({
      ...prev,
      receiverType: nextType,
      customerId: "",
      receiverName: nextType === "CUSTOMER" ? "" : prev.receiverName,
      receiverPhone: nextType === "CUSTOMER" ? "" : prev.receiverPhone,
      receiverEmail: nextType === "CUSTOMER" ? "" : prev.receiverEmail,
    }));
    setSelectedCustomer(null);
  }

  function handlePickCustomer(customer) {
    setSelectedCustomer(customer);

    setForm((prev) => ({
      ...prev,
      customerId: customer?.id ? String(customer.id) : "",
      receiverName: customer?.name || "",
      receiverPhone: customer?.phone || "",
      receiverEmail: customer?.email || "",
    }));
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setErrorText("");

    const parsedLocationId = Number(form.locationId);
    const parsedCustomerId =
      form.customerId === "" || form.customerId == null
        ? null
        : Number(form.customerId);
    const parsedAmount = Number(form.amount);

    if (
      !form.locationId ||
      !Number.isFinite(parsedLocationId) ||
      parsedLocationId <= 0
    ) {
      setErrorText("Please choose the branch giving out the money.");
      return;
    }

    if (!form.amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorText("Please enter a valid amount.");
      return;
    }

    if (form.receiverType === "CUSTOMER") {
      if (
        !parsedCustomerId ||
        !Number.isFinite(parsedCustomerId) ||
        parsedCustomerId <= 0
      ) {
        setErrorText("Please search and choose an existing customer.");
        return;
      }
    }

    if (!String(form.receiverName || "").trim()) {
      setErrorText("Please enter who received the money.");
      return;
    }

    try {
      const payload = {
        locationId: parsedLocationId,
        receiverType: form.receiverType,
        ...(parsedCustomerId ? { customerId: parsedCustomerId } : {}),
        receiverName: String(form.receiverName || "").trim(),
        ...(String(form.receiverPhone || "").trim()
          ? { receiverPhone: String(form.receiverPhone).trim() }
          : {}),
        ...(String(form.receiverEmail || "").trim()
          ? { receiverEmail: String(form.receiverEmail).trim() }
          : {}),
        principalAmount: parsedAmount,
        currency: form.currency || "RWF",
        disbursementMethod: form.method || "CASH",
        ...(String(form.reference || "").trim()
          ? { reference: String(form.reference).trim() }
          : {}),
        ...(String(form.note || "").trim()
          ? { note: String(form.note).trim() }
          : {}),
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      };

      const result = await apiFetch("/owner-loans", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result && typeof result === "object" ? result : {});
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to create loan.");
    }
  }

  function handleLocationChange(nextLocationId) {
    setSelectedCustomer(null);

    setForm((prev) => ({
      ...prev,
      locationId: nextLocationId,
      customerId: "",
      ...(prev.receiverType === "CUSTOMER"
        ? {
            receiverName: "",
            receiverPhone: "",
            receiverEmail: "",
          }
        : {}),
    }));
  }

  return (
    <ModalShell
      title="Record money given out"
      subtitle="Save money the business has given to someone and track what is still unpaid."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Branch giving out the money
          </label>
          <FormSelect
            value={form.locationId}
            onChange={(e) => handleLocationChange(e.target.value)}
          >
            <option value="">Choose branch</option>
            {locations.map((row) => (
              <option key={row?.id} value={String(row?.id)}>
                {safe(row?.name)}
                {safe(row?.code) ? ` (${safe(row.code)})` : ""}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Who got this money?
          </label>
          <FormSelect
            value={form.receiverType}
            onChange={(e) => handleReceiverTypeChange(e.target.value)}
          >
            <option value="OTHER">Someone else</option>
            <option value="CUSTOMER">A customer already in the system</option>
          </FormSelect>
        </div>

        {form.receiverType === "CUSTOMER" ? (
          <SearchableCustomerPicker
            locationId={form.locationId}
            selectedCustomer={selectedCustomer}
            onPick={handlePickCustomer}
          />
        ) : null}

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Name of the person who got the money
          </label>
          <FormInput
            value={form.receiverName}
            onChange={(e) => updateField("receiverName", e.target.value)}
            placeholder="Enter full name"
            disabled={form.receiverType === "CUSTOMER"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Phone number
          </label>
          <FormInput
            value={form.receiverPhone}
            onChange={(e) => updateField("receiverPhone", e.target.value)}
            placeholder="Enter phone number"
            disabled={form.receiverType === "CUSTOMER"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Email address
          </label>
          <FormInput
            value={form.receiverEmail}
            onChange={(e) => updateField("receiverEmail", e.target.value)}
            placeholder="Optional email address"
            disabled={form.receiverType === "CUSTOMER"}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            How much money was given?
          </label>
          <FormInput
            type="number"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            How was the money sent?
          </label>
          <FormSelect
            value={form.method}
            onChange={(e) => updateField("method", e.target.value)}
          >
            <option value="CASH">Cash</option>
            <option value="MOMO">Mobile money</option>
            <option value="BANK">Bank transfer</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Currency
          </label>
          <FormSelect
            value={form.currency}
            onChange={(e) => updateField("currency", e.target.value)}
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Expected repayment date
          </label>
          <FormInput
            type="date"
            value={form.dueDate}
            onChange={(e) => updateField("dueDate", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reference or proof
          </label>
          <FormInput
            value={form.reference}
            onChange={(e) => updateField("reference", e.target.value)}
            placeholder="Transfer code, receipt number, or short reference"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reason for giving out this money
          </label>
          <textarea
            value={form.note}
            onChange={(e) => updateField("note", e.target.value)}
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Describe why this money was given and any important details"
          />
        </div>
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
          idleText="Save loan"
          loadingText="Saving..."
          successText="Saved"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function RepayLoanModal({ open, loan, onClose, onSaved }) {
  if (!open || !loan) return null;

  return (
    <RepayLoanModalInner
      key={`repay-loan-${loan.id}-${loan.remainingAmount ?? 0}`}
      loan={loan}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function RepayLoanModalInner({ loan, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    amount: String(loan?.remainingAmount ?? ""),
    method: "CASH",
    reference: "",
    note: "",
  }));
  const [errorText, setErrorText] = useState("");

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        amount: Number(form.amount),
        method: form.method,
        ...(form.reference ? { reference: form.reference } : {}),
        ...(form.note ? { note: form.note } : {}),
      };

      const result = await apiFetch(`/owner-loans/${loan.id}/repayments`, {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to record repayment",
      );
    }
  }

  return (
    <ModalShell
      title={`Record repayment for loan #${loan.id}`}
      subtitle={`Remaining balance: ${money(loan?.remainingAmount, loan?.currency)}`}
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Amount being paid back
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
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            How was the money received?
          </label>
          <FormSelect
            value={form.method}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, method: e.target.value }))
            }
          >
            <option value="CASH">Cash</option>
            <option value="MOMO">Mobile money</option>
            <option value="BANK">Bank</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </FormSelect>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reference or proof
          </label>
          <FormInput
            value={form.reference}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reference: e.target.value }))
            }
            placeholder="Repayment reference"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Note
          </label>
          <textarea
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Add anything important about this repayment"
          />
        </div>
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
          idleText="Record repayment"
          loadingText="Recording..."
          successText="Recorded"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

function VoidLoanModal({ open, loan, onClose, onSaved }) {
  if (!open || !loan) return null;

  return (
    <VoidLoanModalInner
      key={`void-loan-${loan.id}-${loan.updatedAt || ""}`}
      loan={loan}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function VoidLoanModalInner({ loan, onClose, onSaved }) {
  const [note, setNote] = useState("");
  const [errorText, setErrorText] = useState("");

  async function handleVoid() {
    setErrorText("");

    if (!String(note || "").trim()) {
      setErrorText("Please explain why this loan is being cancelled.");
      return;
    }

    try {
      const result = await apiFetch(`/owner-loans/${loan.id}/void`, {
        method: "POST",
        body: {
          reason: String(note || "").trim(),
        },
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to void loan");
    }
  }

  return (
    <ModalShell
      title={`Void loan #${loan.id}`}
      subtitle="Only void a loan that should no longer count as active."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
        <div className="text-sm text-rose-800 dark:text-rose-200">
          Receiver: <strong>{loanReceiverLabel(loan)}</strong>
          <br />
          Principal:{" "}
          <strong>{money(loan?.principalAmount, loan?.currency)}</strong>
          <br />
          Repaid: <strong>{money(loan?.repaidAmount, loan?.currency)}</strong>
          <br />
          Remaining:{" "}
          <strong>{money(loan?.remainingAmount, loan?.currency)}</strong>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
          Reason for cancelling this loan
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
          placeholder="Explain why this loan should no longer count"
        />
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
          idleText="Void loan"
          loadingText="Voiding..."
          successText="Voided"
          onClick={handleVoid}
          variant="secondary"
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerPaymentsTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [refreshState, setRefreshState] = useState("idle");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [movements, setMovements] = useState([]);

  const [loanSummary, setLoanSummary] = useState(null);
  const [loans, setLoans] = useState([]);

  const [selectedMovementId, setSelectedMovementId] = useState(null);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [locationId, setLocationId] = useState("");
  const [method, setMethod] = useState("");
  const [direction, setDirection] = useState("");
  const [movementType, setMovementType] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [creatingLoan, setCreatingLoan] = useState(false);
  const [repayingLoan, setRepayingLoan] = useState(null);
  const [voidingLoan, setVoidingLoan] = useState(null);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations)
      ? locations.filter(
          (row) => String(row?.status || "").toUpperCase() !== "ARCHIVED",
        )
      : [];
  }, [locations]);

  const normalizedMovements = useMemo(() => {
    return (Array.isArray(movements) ? movements : [])
      .map(normalizeMovement)
      .filter(Boolean);
  }, [movements]);

  const normalizedLoans = useMemo(() => {
    return (Array.isArray(loans) ? loans : [])
      .map(normalizeLoan)
      .filter(Boolean);
  }, [loans]);

  const filteredMovements = useMemo(() => {
    const q = String(search || "")
      .trim()
      .toLowerCase();

    return normalizedMovements.filter((row) => {
      if (direction) {
        const rowDirection = String(row?.direction || "").toUpperCase();
        if (rowDirection !== String(direction).toUpperCase()) return false;
      }

      if (movementType) {
        const rowType = String(row?.movementType || "").toUpperCase();
        if (rowType !== String(movementType).toUpperCase()) return false;
      }

      if (!q) return true;

      const hay = [
        row?.id,
        row?.movementType,
        row?.direction,
        row?.amount,
        row?.method,
        row?.reference,
        row?.note,
        row?.customerName,
        row?.customerPhone,
        row?.supplierName,
        row?.payeeName,
        row?.actorName,
        row?.cashierName,
        row?.locationName,
        row?.locationCode,
        row?.saleId,
        row?.billId,
        row?.expenseId,
        row?.refundId,
        row?.depositId,
        row?.ownerLoanId,
        row?.repaymentId,
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [normalizedMovements, search, direction, movementType]);

  const filteredLoans = useMemo(() => {
    const q = String(search || "")
      .trim()
      .toLowerCase();

    return normalizedLoans.filter((loan) => {
      if (locationId && String(loan?.locationId) !== String(locationId)) {
        return false;
      }

      if (method) {
        const loanMethod = String(loan?.method || "").toUpperCase();
        if (loanMethod !== String(method).toUpperCase()) return false;
      }

      if (!q) return true;

      const hay = [
        loan?.id,
        loan?.receiverType,
        loan?.receiverName,
        loan?.receiverPhone,
        loan?.receiverEmail,
        loan?.customerName,
        loan?.reference,
        loan?.note,
        loan?.method,
        loan?.status,
        loan?.locationName,
        loan?.locationCode,
        loan?.principalAmount,
        loan?.repaidAmount,
        loan?.remainingAmount,
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [normalizedLoans, search, locationId, method]);

  const visibleRows = useMemo(() => {
    return filteredMovements.slice(0, visibleCount);
  }, [filteredMovements, visibleCount]);

  const hasMoreRows = visibleCount < filteredMovements.length;

  const selectedMovement = useMemo(() => {
    if (selectedMovementId == null)
      return visibleRows[0] || filteredMovements[0] || null;

    return (
      filteredMovements.find(
        (row) => String(row.id) === String(selectedMovementId),
      ) || null
    );
  }, [filteredMovements, selectedMovementId, visibleRows]);

  const selectedLoan = useMemo(() => {
    if (selectedLoanId == null) return filteredLoans[0] || null;
    return (
      filteredLoans.find(
        (loan) => String(loan.id) === String(selectedLoanId),
      ) || null
    );
  }, [filteredLoans, selectedLoanId]);

  const cards = useMemo(() => {
    const totals = summary?.totals || {};
    return {
      totalMoneyIn: Number(totals.totalMoneyIn ?? 0),
      totalMoneyOut: Number(totals.totalMoneyOut ?? 0),
      netAmount: Number(totals.netAmount ?? 0),
      movementsCount: Number(totals.movementsCount ?? 0),
      branchesCount: Number(totals.branchesCount ?? 0),
      moneyInCount: Number(totals.moneyInCount ?? 0),
      moneyOutCount: Number(totals.moneyOutCount ?? 0),
    };
  }, [summary]);

  const ownerLoanCards = useMemo(() => {
    return {
      loansCount: Number(loanSummary?.loansCount ?? 0),
      openLoansCount: Number(loanSummary?.openCount ?? 0),
      partiallyRepaidCount: Number(loanSummary?.partialCount ?? 0),
      repaidLoansCount: Number(loanSummary?.repaidCount ?? 0),
      totalPrincipalAmount: Number(loanSummary?.totalPrincipalAmount ?? 0),
      totalRepaidAmount: Number(loanSummary?.totalRepaidAmount ?? 0),
      totalRemainingAmount: Number(loanSummary?.outstandingAmount ?? 0),
    };
  }, [loanSummary]);

  const byMethodRows = useMemo(() => {
    return Array.isArray(breakdown?.byMethod) ? breakdown.byMethod : [];
  }, [breakdown]);

  const byLocationMethodRows = useMemo(() => {
    return Array.isArray(breakdown?.byLocationMethod)
      ? breakdown.byLocationMethod
      : [];
  }, [breakdown]);

  const quickStats = useMemo(() => {
    let cashNet = 0;
    let momoNet = 0;
    let bankNet = 0;
    let cardNet = 0;

    for (const row of byMethodRows) {
      const amt = Number(row?.netAmount ?? 0);

      switch (String(row?.method || "").toUpperCase()) {
        case "CASH":
          cashNet += amt;
          break;
        case "MOMO":
          momoNet += amt;
          break;
        case "BANK":
          bankNet += amt;
          break;
        case "CARD":
          cardNet += amt;
          break;
        default:
          break;
      }
    }

    return { cashNet, momoNet, bankNet, cardNet };
  }, [byMethodRows]);

  function buildParams() {
    const params = new URLSearchParams();

    if (locationId) params.set("locationId", locationId);
    if (method) params.set("method", method);
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);

    params.set("limit", String(200));
    params.set("offset", String(0));

    return params.toString();
  }

  async function loadData(locationIdOverride = null) {
    setLoading(true);
    setErrorText("");

    try {
      const query = buildParams();

      const selectedLoanLocationId =
        locationIdOverride ||
        locationId ||
        (locationOptions[0]?.id ? String(locationOptions[0].id) : "");

      const loanParams = new URLSearchParams();
      if (selectedLoanLocationId) {
        loanParams.set("locationId", selectedLoanLocationId);
      }
      if (search) {
        loanParams.set("q", search);
      }
      loanParams.set("limit", "100");
      loanParams.set("offset", "0");

      const loanQuery = loanParams.toString();

      const summaryUrl = `/owner/payments/summary${query ? `?${query}` : ""}`;
      const breakdownUrl = `/owner/payments/breakdown${query ? `?${query}` : ""}`;
      const listUrl = `/owner/payments${query ? `?${query}` : ""}`;
      const loanSummaryUrl = `/owner-loans/summary${loanQuery ? `?${loanQuery}` : ""}`;
      const loansUrl = `/owner-loans${loanQuery ? `?${loanQuery}` : ""}`;

      const [summaryRes, breakdownRes, listRes, loanSummaryRes, loansRes] =
        await Promise.allSettled([
          apiFetch(summaryUrl, { method: "GET" }),
          apiFetch(breakdownUrl, { method: "GET" }),
          apiFetch(listUrl, { method: "GET" }),
          apiFetch(loanSummaryUrl, { method: "GET" }),
          apiFetch(loansUrl, { method: "GET" }),
        ]);

      let nextError = "";

      if (summaryRes.status === "fulfilled") {
        setSummary(normalizeSummaryResponse(summaryRes.value));
      } else {
        setSummary(null);
        nextError =
          summaryRes.reason?.data?.error ||
          summaryRes.reason?.message ||
          "Payments summary request failed";
      }

      if (breakdownRes.status === "fulfilled") {
        setBreakdown(normalizeBreakdownResponse(breakdownRes.value));
      } else {
        setBreakdown(null);
        nextError =
          breakdownRes.reason?.data?.error ||
          breakdownRes.reason?.message ||
          nextError ||
          "Payments breakdown request failed";
      }

      if (listRes.status === "fulfilled") {
        const rows = normalizeListResponse(listRes.value)
          .map(normalizeMovement)
          .filter(Boolean);

        setMovements(rows);
        setSelectedMovementId((prev) =>
          prev && rows.some((x) => String(x.id) === String(prev))
            ? prev
            : (rows[0]?.id ?? null),
        );
      } else {
        setMovements([]);
        setSelectedMovementId(null);
        nextError =
          listRes.reason?.data?.error ||
          listRes.reason?.message ||
          nextError ||
          "Payments list request failed";
      }

      if (loanSummaryRes.status === "fulfilled") {
        setLoanSummary(normalizeLoanSummaryResponse(loanSummaryRes.value));
      } else {
        setLoanSummary(null);
        nextError =
          loanSummaryRes.reason?.data?.error ||
          loanSummaryRes.reason?.message ||
          nextError ||
          "Owner loans summary request failed";
      }

      if (loansRes.status === "fulfilled") {
        const rows = normalizeLoansResponse(loansRes.value)
          .map(normalizeLoan)
          .filter(Boolean);

        setLoans(rows);
        setSelectedLoanId((prev) =>
          prev && rows.some((x) => String(x.id) === String(prev))
            ? prev
            : (rows[0]?.id ?? null),
        );
      } else {
        setLoans([]);
        setSelectedLoanId(null);
        nextError =
          loansRes.reason?.data?.error ||
          loansRes.reason?.message ||
          nextError ||
          "Owner loans list request failed";
      }

      setErrorText(nextError);
    } catch (e) {
      setSummary(null);
      setBreakdown(null);
      setMovements([]);
      setSelectedMovementId(null);
      setLoanSummary(null);
      setLoans([]);
      setSelectedLoanId(null);
      setErrorText(
        e?.data?.error || e?.message || "Failed to load owner payments",
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshNow() {
    setRefreshState("loading");
    await loadData();
    setRefreshState("success");
    setTimeout(() => setRefreshState("idle"), 900);
  }

  async function handleLoanActionSaved(actionText, result) {
    setSuccessText(actionText);

    const createdLoan = result?.loan || result || null;
    const nextLoanId = createdLoan?.id ?? selectedLoanId ?? null;
    const nextLoanLocationId =
      createdLoan?.locationId != null ? String(createdLoan.locationId) : null;

    setCreatingLoan(false);
    setRepayingLoan(null);
    setVoidingLoan(null);

    if (nextLoanLocationId) {
      setLocationId(nextLoanLocationId);
    }

    await loadData(nextLoanLocationId);

    if (nextLoanId != null) {
      setSelectedLoanId(nextLoanId);
    }

    setTimeout(() => setSuccessText(""), 2200);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 220);

    return () => clearTimeout(timeout);
  }, [locationId, method, from, to]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, direction, movementType, locationId, method, from, to]);

  const totalInTone =
    cards.totalMoneyIn >= cards.totalMoneyOut
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-stone-950 dark:text-stone-50";

  const totalOutTone =
    cards.totalMoneyOut > 0
      ? "text-rose-700 dark:text-rose-300"
      : "text-stone-950 dark:text-stone-50";

  const netTone =
    cards.netAmount >= 0
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-rose-700 dark:text-rose-300";

  return (
    <div className="space-y-5">
      {errorText ? <AlertBox tone="danger">{errorText}</AlertBox> : null}
      {successText ? <AlertBox tone="success">{successText}</AlertBox> : null}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Money in, money out, and net position"
          subtitle="Owner view of money received, money that left, and the net result across branches and payment methods."
        >
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <StatCard
                label="Money in"
                value={money(cards.totalMoneyIn)}
                sub={`${safeNumber(cards.moneyInCount)} record(s)`}
                valueClassName={`text-[17px] leading-tight ${totalInTone}`}
              />

              <StatCard
                label="Money out"
                value={money(cards.totalMoneyOut)}
                sub={`${safeNumber(cards.moneyOutCount)} record(s)`}
                valueClassName={`text-[17px] leading-tight ${totalOutTone}`}
              />

              <StatCard
                label="Net"
                value={money(cards.netAmount)}
                sub="Money in minus money out"
                valueClassName={`text-[17px] leading-tight ${netTone}`}
              />

              <StatCard
                label="Branches involved"
                value={safeNumber(cards.branchesCount)}
                sub={`${safeNumber(cards.movementsCount)} total movement(s)`}
                valueClassName="text-[17px] leading-tight"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Cash net
                </p>
                <p className="mt-1 sm:mt-2 text-sm sm:text-lg font-black text-stone-950 dark:text-stone-50">
                  {money(quickStats.cashNet)}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Mobile money net
                </p>
                <p className="mt-1 sm:mt-2 text-sm sm:text-lg font-black text-stone-950 dark:text-stone-50">
                  {money(quickStats.momoNet)}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Bank net
                </p>
                <p className="mt-1 sm:mt-2 text-sm sm:text-lg font-black text-stone-950 dark:text-stone-50">
                  {money(quickStats.bankNet)}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Card net
                </p>
                <p className="mt-1 sm:mt-2 text-sm sm:text-lg font-black text-stone-950 dark:text-stone-50">
                  {money(quickStats.cardNet)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Filters"
          subtitle="Narrow the owner money view by branch, method, date, direction, or movement type."
        >
          <div className="grid gap-3">
            <FormSelect
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">All branches</option>
              {locationOptions.map((row) => (
                <option key={row?.id} value={String(row?.id)}>
                  {safe(row?.name)}
                  {safe(row?.code) ? ` (${safe(row.code)})` : ""}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="">All methods</option>
              <option value="CASH">Cash</option>
              <option value="MOMO">Mobile money</option>
              <option value="BANK">Bank</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </FormSelect>

            <div className="grid gap-3 sm:grid-cols-2">
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

            <div className="flex flex-wrap gap-2 pt-1">
              <AsyncButton
                variant="secondary"
                idleText="Refresh"
                loadingText="Refreshing..."
                successText="Done"
                onClick={refreshNow}
              />

              <button
                type="button"
                onClick={() => {
                  setLocationId("");
                  setMethod("");
                  setDirection("");
                  setMovementType("");
                  setSearch("");
                  setFrom("");
                  setTo("");
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Clear filters
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Owner loans"
        subtitle="Track money the business lent out, how much has been repaid, and what remains unpaid."
        right={
          <AsyncButton
            idleText="Create loan"
            loadingText="Opening..."
            successText="Ready"
            onClick={async () => setCreatingLoan(true)}
          />
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Loans"
              value={safeNumber(ownerLoanCards.loansCount)}
              sub="All visible loans"
              valueClassName="text-[17px] leading-tight"
            />
            <StatCard
              label="Open loans"
              value={safeNumber(ownerLoanCards.openLoansCount)}
              sub="Still unpaid"
              valueClassName="text-[17px] leading-tight text-amber-700 dark:text-amber-300"
            />
            <StatCard
              label="Total lent out"
              value={money(ownerLoanCards.totalPrincipalAmount)}
              sub="Principal amount"
              valueClassName="text-[17px] leading-tight text-rose-700 dark:text-rose-300"
            />
            <StatCard
              label="Still remaining"
              value={money(ownerLoanCards.totalRemainingAmount)}
              sub="Outstanding balance"
              valueClassName="text-[17px] leading-tight text-amber-700 dark:text-amber-300"
            />
          </div>

          {loading ? (
            <div className="grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <EmptyState text="No owner loans found for the selected filters." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="grid gap-3">
                {filteredLoans.map((loan) => {
                  const isSelected =
                    selectedLoan && String(selectedLoan.id) === String(loan.id);

                  return (
                    <button
                      key={`loan-${loan.id}`}
                      type="button"
                      onClick={() => setSelectedLoanId(loan.id)}
                      className={cx(
                        "w-full rounded-[24px] border p-4 text-left transition",
                        isSelected
                          ? "border-stone-900 bg-stone-100 dark:border-stone-100 dark:bg-stone-900"
                          : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <MovementChip
                              text={String(loan?.status || "OPEN")}
                              className={statusTone(loan?.status)}
                            />
                            <MovementChip
                              text={methodLabel(loan?.method)}
                              className={methodTone(loan?.method)}
                            />
                            <MovementChip
                              text={
                                String(
                                  loan?.receiverType || "OTHER",
                                ).toUpperCase() === "CUSTOMER"
                                  ? "Customer"
                                  : "Other person"
                              }
                              className="bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300"
                            />
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Receiver
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {loanReceiverLabel(loan)}
                              </p>
                              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                {loanReceiverSub(loan)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Branch
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {displayBranch(loan)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Principal
                              </p>
                              <p className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
                                {money(loan?.principalAmount, loan?.currency)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Remaining
                              </p>
                              <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                                {money(loan?.remainingAmount, loan?.currency)}
                              </p>
                            </div>
                          </div>

                          {(safe(loan?.reference) || safe(loan?.note)) && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Reference
                                </p>
                                <p className="mt-1 break-words text-sm text-stone-700 dark:text-stone-300">
                                  {safe(loan?.reference) || "No reference"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Note
                                </p>
                                <p className="mt-1 break-words text-sm text-stone-700 dark:text-stone-300">
                                  {safe(loan?.note) || "No note"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Repaid
                          </p>
                          <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-300">
                            {money(loan?.repaidAmount, loan?.currency)}
                          </p>
                          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                            {safeDate(loan?.issuedAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedLoan ? (
                <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-stone-950 dark:text-stone-50">
                        Selected loan
                      </p>
                      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        Review owner loan profile and take the next action.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {String(selectedLoan?.status || "").toUpperCase() !==
                        "REPAID" &&
                      String(selectedLoan?.status || "").toUpperCase() !==
                        "VOID" ? (
                        <AsyncButton
                          idleText="Record repayment"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () => setRepayingLoan(selectedLoan)}
                          variant="secondary"
                        />
                      ) : null}

                      {String(selectedLoan?.status || "").toUpperCase() !==
                        "VOID" &&
                      safeNumber(selectedLoan?.repaidAmount) <= 0 ? (
                        <AsyncButton
                          idleText="Void loan"
                          loadingText="Opening..."
                          successText="Ready"
                          onClick={async () => setVoidingLoan(selectedLoan)}
                          variant="secondary"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <StatCard
                      label="Receiver"
                      value={loanReceiverLabel(selectedLoan)}
                      sub={loanReceiverSub(selectedLoan)}
                      valueClassName="text-[17px] leading-tight"
                    />
                    <StatCard
                      label="Branch"
                      value={displayBranch(selectedLoan)}
                      sub={safeDate(selectedLoan?.issuedAt)}
                      valueClassName="text-[17px] leading-tight"
                    />
                    <StatCard
                      label="Principal"
                      value={money(
                        selectedLoan?.principalAmount,
                        selectedLoan?.currency,
                      )}
                      sub={methodLabel(selectedLoan?.method)}
                      valueClassName="text-[17px] leading-tight text-rose-700 dark:text-rose-300"
                    />
                    <StatCard
                      label="Remaining"
                      value={money(
                        selectedLoan?.remainingAmount,
                        selectedLoan?.currency,
                      )}
                      sub={`${safeNumber(selectedLoan?.repaymentsCount)} repayment(s)`}
                      valueClassName="text-[17px] leading-tight text-amber-700 dark:text-amber-300"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                      <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                        Status
                      </p>
                      <div className="mt-2">
                        <MovementChip
                          text={String(selectedLoan?.status || "OPEN")}
                          className={statusTone(selectedLoan?.status)}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                      <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                        Created by
                      </p>
                      <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                        {displayActor(selectedLoan)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                        Reference
                      </p>
                      <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                        {safe(selectedLoan?.reference) || "No reference"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                        Note
                      </p>
                      <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                        {safe(selectedLoan?.note) || "No note recorded"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState text="Select a loan to inspect details and take actions." />
              )}
            </div>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Net by payment method"
          subtitle="Each method shows money in, money out, and the net result."
        >
          {loading ? (
            <div className="grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : byMethodRows.length === 0 ? (
            <EmptyState text="No payment-method movement found for the selected filters." />
          ) : (
            <div className="grid gap-3">
              {byMethodRows.map((row, idx) => {
                const methodName = methodLabel(row?.method);
                const moneyIn = Number(row?.totalMoneyIn ?? 0);
                const moneyOut = Number(row?.totalMoneyOut ?? 0);
                const net = Number(row?.netAmount ?? 0);

                return (
                  <div
                    key={`${row?.method || "method"}-${idx}`}
                    className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <MovementChip
                            text={methodName}
                            className={methodTone(row?.method)}
                          />
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            {safeNumber(row?.count)} movement(s)
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Money in
                            </p>
                            <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                              {money(moneyIn)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Money out
                            </p>
                            <p className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
                              {money(moneyOut)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              Net
                            </p>
                            <p
                              className={[
                                "mt-1 text-sm font-semibold",
                                net >= 0
                                  ? "text-emerald-700 dark:text-emerald-300"
                                  : "text-rose-700 dark:text-rose-300",
                              ].join(" ")}
                            >
                              {money(net)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Net by branch and method"
          subtitle="Shows where money is strongest or weakest across branches."
        >
          {loading ? (
            <div className="grid gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : byLocationMethodRows.length === 0 ? (
            <EmptyState text="No branch-method movement found for the selected filters." />
          ) : (
            <div className="grid gap-3">
              {byLocationMethodRows.slice(0, 10).map((row, idx) => {
                const net = Number(row?.netAmount ?? 0);

                return (
                  <div
                    key={`${row?.locationId || "loc"}-${row?.method || "m"}-${idx}`}
                    className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                          {safe(row?.locationName) ||
                            `Branch #${safeNumber(row?.locationId)}`}
                          {safe(row?.locationCode)
                            ? ` (${safe(row.locationCode)})`
                            : ""}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <MovementChip
                            text={methodLabel(row?.method)}
                            className={methodTone(row?.method)}
                          />
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            {safeNumber(row?.count)} movement(s)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                          Net
                        </p>
                        <p
                          className={[
                            "mt-1 text-base font-black",
                            net >= 0
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-rose-700 dark:text-rose-300",
                          ].join(" ")}
                        >
                          {money(net)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Money movement history"
        subtitle="Every row shows whether money came in or went out, who was involved, the method used, and where it happened."
      >
        <div className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.8fr]">
            <FormInput
              placeholder="Search by person, supplier, note, reference, sale, bill, expense, refund, or loan"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <FormSelect
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="">All directions</option>
              <option value="IN">Money in</option>
              <option value="OUT">Money out</option>
            </FormSelect>

            <FormSelect
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
            >
              <option value="">All movement types</option>
              <option value="CUSTOMER_PAYMENT">Customer payment</option>
              <option value="SUPPLIER_BILL_PAYMENT">
                Supplier bill payment
              </option>
              <option value="EXPENSE">Expense</option>
              <option value="REFUND">Refund</option>
              <option value="DEPOSIT_OUT">Money sent out</option>
              <option value="OWNER_LOAN_OUT">Owner loan out</option>
              <option value="OWNER_LOAN_REPAYMENT_IN">
                Owner loan repayment
              </option>
            </FormSelect>
          </div>

          {loading ? (
            <div className="grid gap-3">
              <div className="h-28 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-28 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
              <div className="h-28 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            </div>
          ) : filteredMovements.length === 0 ? (
            <EmptyState text="No money movement found for the selected filters." />
          ) : (
            <>
              <div className="grid gap-3">
                {visibleRows.map((row) => {
                  const isSelected =
                    selectedMovement &&
                    String(selectedMovement.id) === String(row.id);

                  return (
                    <button
                      key={`${row.id}-${row.movementType}-${row.direction}`}
                      type="button"
                      onClick={() => setSelectedMovementId(row.id)}
                      className={[
                        "w-full rounded-[24px] border p-4 text-left transition",
                        isSelected
                          ? "border-stone-900 bg-stone-100 dark:border-stone-100 dark:bg-stone-900"
                          : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900",
                      ].join(" ")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <MovementChip
                              text={movementTypeLabel(row?.movementType)}
                              className={movementTone(row?.movementType)}
                            />
                            <MovementChip
                              text={directionLabel(row?.direction)}
                              className={directionTone(row?.direction)}
                            />
                            <MovementChip
                              text={methodLabel(row?.method)}
                              className={methodTone(row?.method)}
                            />
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Counterparty
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {counterpartyLabel(row)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Branch
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {displayBranch(row)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Related record
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {movementEntityLabel(row)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                Recorded by
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                                {displayActor(row)}
                              </p>
                            </div>
                          </div>

                          {(safe(row?.reference) || safe(row?.note)) && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Reference
                                </p>
                                <p className="mt-1 break-words text-sm text-stone-700 dark:text-stone-300">
                                  {safe(row?.reference) || "No reference"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                                  Note
                                </p>
                                <p className="mt-1 break-words text-sm text-stone-700 dark:text-stone-300">
                                  {safe(row?.note) || "No note"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Amount
                          </p>
                          <p
                            className={[
                              "mt-1 text-lg font-black",
                              String(row?.direction || "").toUpperCase() ===
                              "OUT"
                                ? "text-rose-700 dark:text-rose-300"
                                : "text-emerald-700 dark:text-emerald-300",
                            ].join(" ")}
                          >
                            {String(row?.direction || "").toUpperCase() ===
                            "OUT"
                              ? "-"
                              : "+"}
                            {money(row?.amount)}
                          </p>
                          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                            {safeDate(row?.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasMoreRows ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    Load more
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </SectionCard>

      {selectedMovement ? (
        <SectionCard
          title="Selected movement detail"
          subtitle="Focused owner view of what happened, where it happened, who recorded it, and which business record it belongs to."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Type"
              value={movementTypeLabel(selectedMovement?.movementType)}
              sub={directionLabel(selectedMovement?.direction)}
              valueClassName="text-[17px] leading-tight"
            />

            <StatCard
              label="Amount"
              value={money(selectedMovement?.amount)}
              sub={methodLabel(selectedMovement?.method)}
              valueClassName="text-[17px] leading-tight"
            />

            <StatCard
              label="Branch"
              value={displayBranch(selectedMovement)}
              sub={movementEntityLabel(selectedMovement)}
              valueClassName="text-[17px] leading-tight"
            />

            <StatCard
              label="Recorded by"
              value={displayActor(selectedMovement)}
              sub={safeDate(selectedMovement?.createdAt)}
              valueClassName="text-[17px] leading-tight"
            />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                Movement profile
              </p>

              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Direction
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {directionLabel(selectedMovement?.direction)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Method
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {methodLabel(selectedMovement?.method)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Counterparty
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {counterpartyLabel(selectedMovement)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Related record
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {movementEntityLabel(selectedMovement)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Reference
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {safe(selectedMovement?.reference) || "No reference"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Note
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                      {safe(selectedMovement?.note) || "No note recorded"}
                    </p>
                  </div>
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
                    {displayActor(selectedMovement)}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    Branch
                  </p>
                  <p className="mt-2 text-xl font-black text-stone-950 dark:text-stone-50">
                    {displayBranch(selectedMovement)}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <p className="text-xs uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                    Recorded at
                  </p>
                  <p className="mt-2 text-xl font-black text-amber-900 dark:text-amber-100">
                    {safeDate(selectedMovement?.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Selected movement detail"
          subtitle="This section appears after a movement is selected."
        >
          <EmptyState text="Select a movement above to inspect its detail." />
        </SectionCard>
      )}

      <CreateLoanModal
        open={creatingLoan}
        locations={locationOptions}
        onClose={() => setCreatingLoan(false)}
        onSaved={(result) =>
          handleLoanActionSaved("Owner loan created", result)
        }
      />

      <RepayLoanModal
        open={!!repayingLoan}
        loan={repayingLoan}
        onClose={() => setRepayingLoan(null)}
        onSaved={(result) =>
          handleLoanActionSaved("Loan repayment recorded", result)
        }
      />

      <VoidLoanModal
        open={!!voidingLoan}
        loan={voidingLoan}
        onClose={() => setVoidingLoan(null)}
        onSaved={(result) => handleLoanActionSaved("Loan voided", result)}
      />
    </div>
  );
}
