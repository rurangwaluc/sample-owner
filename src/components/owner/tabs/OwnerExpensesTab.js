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

function money(v, currency = "RWF") {
  return `${String(currency || "RWF").toUpperCase()} ${safeNumber(
    v,
  ).toLocaleString()}`;
}

function normalizeExpensesResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.expenses)) return result.expenses;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeExpense(row) {
  if (!row) return null;

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
    reference: row.reference ?? "",
    note: row.note ?? "",
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

function categoryTone(category) {
  const value = String(category || "")
    .trim()
    .toUpperCase();

  if (value.includes("TRANSPORT")) {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  if (value.includes("UTILITY") || value.includes("BILL")) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (value.includes("SALARY") || value.includes("PAYROLL")) {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }

  if (value.includes("STOCK") || value.includes("SUPPLIER")) {
    return "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
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
                    : categoryTone(row?.category))
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
                <span className="font-medium">Cashier:</span>{" "}
                {displayCashier(row)}
              </p>
              <p className="truncate">
                <span className="font-medium">Session:</span>{" "}
                {row?.cashSessionId != null
                  ? `#${safeNumber(row.cashSessionId)}`
                  : "-"}
              </p>
              <p className="truncate">
                <span className="font-medium">Created:</span>{" "}
                {safeDate(row?.createdAt)}
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
              Recorded expense value
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
  const [form, setForm] = useState({
    locationId: "",
    cashSessionId: "",
    category: "GENERAL",
    amount: "",
    reference: "",
    note: "",
  });
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      locationId: "",
      cashSessionId: "",
      category: "GENERAL",
      amount: "",
      reference: "",
      note: "",
    });
    setErrorText("");
  }, [open]);

  if (!open) return null;

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        locationId: Number(form.locationId),
        cashSessionId: form.cashSessionId
          ? Number(form.cashSessionId)
          : undefined,
        category: String(form.category || "").trim() || "GENERAL",
        amount: Number(form.amount),
        reference: form.reference.trim() || undefined,
        note: form.note.trim() || undefined,
      };

      const result = await apiFetch("/cash/expenses", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to create expense");
    }
  }

  return (
    <ModalShell
      title="Create expense"
      subtitle="Owner can record expenses across branches."
      onClose={onClose}
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
            Cash session ID
          </label>
          <FormInput
            type="number"
            value={form.cashSessionId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cashSessionId: e.target.value }))
            }
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Category
          </label>
          <FormInput
            value={form.category}
            maxLength={60}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, category: e.target.value }))
            }
            placeholder="GENERAL"
          />
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
            Reference
          </label>
          <FormInput
            value={form.reference}
            maxLength={80}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reference: e.target.value }))
            }
            placeholder="Optional reference"
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
            placeholder="Optional note"
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
          idleText="Create expense"
          loadingText="Creating..."
          successText="Created"
          onClick={handleSave}
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
  const [cashierId, setCashierId] = useState("");
  const [cashSessionId, setCashSessionId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [creatingExpense, setCreatingExpense] = useState(false);

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
    let withReferenceCount = 0;
    let withSessionCount = 0;

    const categories = new Set();
    const branches = new Set();

    for (const row of rows) {
      totalAmount += Number(row?.amount || 0);

      if (safe(row?.reference)) withReferenceCount += 1;
      if (row?.cashSessionId != null) withSessionCount += 1;
      if (safe(row?.category))
        categories.add(String(row.category).toUpperCase());
      if (row?.locationId != null) branches.add(String(row.locationId));
    }

    return {
      totalCount,
      totalAmount,
      withReferenceCount,
      withSessionCount,
      categoryCount: categories.size,
      branchCount: branches.size,
    };
  }, [expenses]);

  function buildParams(extra = {}) {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (locationId) params.set("locationId", locationId);
    if (category) params.set("category", category);
    if (cashierId) params.set("cashierId", cashierId);
    if (cashSessionId) params.set("cashSessionId", cashSessionId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    params.set("limit", String(extra.limit || PAGE_SIZE));

    if (extra.cursor) {
      params.set("cursor", String(extra.cursor));
    }

    return params;
  }

  async function loadFirstPage() {
    setLoading(true);
    setErrorText("");

    try {
      const params = buildParams({ limit: PAGE_SIZE });
      const result = await apiFetch(`/cash/expenses?${params.toString()}`, {
        method: "GET",
      });

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
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    setErrorText("");

    try {
      const params = buildParams({ limit: PAGE_SIZE, cursor: nextCursor });
      const result = await apiFetch(`/cash/expenses?${params.toString()}`, {
        method: "GET",
      });

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
  }

  useEffect(() => {
    loadFirstPage();
  }, [q, locationId, category, cashierId, cashSessionId, from, to]);

  async function handleSaved(result) {
    setCreatingExpense(false);
    setSuccessText("Expense created");

    await loadFirstPage();

    const nextId = result?.expense?.id ?? null;
    if (nextId) setSelectedExpenseId(nextId);

    setTimeout(() => setSuccessText(""), 2500);
  }

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      {loading ? (
        <SectionCard
          title="Expenses"
          subtitle="Loading owner-wide expense visibility."
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
            subtitle="Owner-wide, cross-branch visibility into recorded expenses."
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
                label="Categories"
                value={safeNumber(overview?.categoryCount)}
                sub="Distinct categories"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="With reference"
                value={safeNumber(overview?.withReferenceCount)}
                sub="Reference captured"
                valueClassName="text-[17px] leading-tight"
              />

              <StatCard
                label="With session"
                value={safeNumber(overview?.withSessionCount)}
                sub="Linked cash session"
                valueClassName="text-[17px] leading-tight"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Expense filters"
            subtitle="Search cross-branch by note, reference, category, cashier, session, branch, and date."
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
                placeholder="Search note, reference, cashier, branch"
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
              />

              <FormInput
                type="number"
                value={cashierId}
                onChange={(e) => setCashierId(e.target.value)}
                placeholder="Cashier ID"
              />

              <FormInput
                type="number"
                value={cashSessionId}
                onChange={(e) => setCashSessionId(e.target.value)}
                placeholder="Cash session ID"
              />

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
              subtitle="Cross-branch expense timeline. Select an expense to inspect its profile."
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
                subtitle="Focused owner view of branch context, cashier, category, and traceability."
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Expense"
                    value={`#${safeNumber(selectedExpense?.id)}`}
                    sub={safeDate(selectedExpense?.createdAt)}
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Branch"
                    value={displayBranch(selectedExpense)}
                    sub={safe(selectedExpense?.locationCode) || "No code"}
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Amount"
                    value={money(selectedExpense?.amount, "RWF")}
                    sub={safe(selectedExpense?.category) || "GENERAL"}
                    valueClassName="text-[17px] leading-tight"
                  />

                  <StatCard
                    label="Cashier"
                    value={displayCashier(selectedExpense)}
                    sub={
                      selectedExpense?.cashSessionId != null
                        ? `Session #${safeNumber(selectedExpense.cashSessionId)}`
                        : "No session"
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
                            Cash session
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-950 dark:text-stone-50">
                            {selectedExpense?.cashSessionId != null
                              ? `#${safeNumber(selectedExpense.cashSessionId)}`
                              : "-"}
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
                          Note
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
                          Cashier
                        </p>
                        <p className="mt-2 text-xl font-black text-stone-950 dark:text-stone-50">
                          {displayCashier(selectedExpense)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                        <p className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                          Branch
                        </p>
                        <p className="mt-2 text-xl font-black text-stone-950 dark:text-stone-50">
                          {displayBranch(selectedExpense)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <p className="text-xs uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                          Recorded at
                        </p>
                        <p className="mt-2 text-xl font-black text-amber-900 dark:text-amber-100">
                          {safeDate(selectedExpense?.createdAt)}
                        </p>
                      </div>
                    </div>
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
        onSaved={handleSaved}
      />
    </div>
  );
}
