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
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function normalizeEvaluation(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    supplierId: row.supplierId ?? row.supplier_id ?? null,
    reliabilityRating: Number(
      row.reliabilityRating ?? row.reliability_rating ?? 0,
    ),
    priceRating: Number(row.priceRating ?? row.price_rating ?? 0),
    qualityRating: Number(row.qualityRating ?? row.quality_rating ?? 0),
    speedRating: Number(row.speedRating ?? row.speed_rating ?? 0),
    communicationRating: Number(
      row.communicationRating ?? row.communication_rating ?? 0,
    ),
    issueCount: Number(row.issueCount ?? row.issue_count ?? 0),
    lastIssueAt: row.lastIssueAt ?? row.last_issue_at ?? null,
    isPreferred: !!(row.isPreferred ?? row.is_preferred),
    isWatchlist: !!(row.isWatchlist ?? row.is_watchlist),
    overallScore: Number(row.overallScore ?? row.overall_score ?? 0),
    riskLevel: row.riskLevel ?? row.risk_level ?? "LOW",
    ownerAssessmentNote:
      row.ownerAssessmentNote ?? row.owner_assessment_note ?? "",
    evaluatedByUserId:
      row.evaluatedByUserId ?? row.evaluated_by_user_id ?? null,
    evaluatedAt: row.evaluatedAt ?? row.evaluated_at ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function evaluationDefaults(evaluation) {
  return {
    reliabilityRating: String(evaluation?.reliabilityRating ?? 0),
    priceRating: String(evaluation?.priceRating ?? 0),
    qualityRating: String(evaluation?.qualityRating ?? 0),
    speedRating: String(evaluation?.speedRating ?? 0),
    communicationRating: String(evaluation?.communicationRating ?? 0),
    issueCount: String(evaluation?.issueCount ?? 0),
    lastIssueAt: evaluation?.lastIssueAt
      ? String(evaluation.lastIssueAt).slice(0, 10)
      : "",
    isPreferred: !!evaluation?.isPreferred,
    isWatchlist: !!evaluation?.isWatchlist,
    riskLevel: safe(evaluation?.riskLevel) || "LOW",
    ownerAssessmentNote: safe(evaluation?.ownerAssessmentNote) || "",
  };
}

function supplierTone(sourceType) {
  const v = safe(sourceType).toUpperCase();
  return v === "ABROAD" ? "info" : "success";
}

function activeTone(isActive) {
  return isActive ? "success" : "neutral";
}

function riskTone(risk) {
  const v = safe(risk).toUpperCase();
  if (v === "HIGH" || v === "CRITICAL") return "danger";
  if (v === "MEDIUM") return "warn";
  return "success";
}

function booleanTone(value) {
  return value ? "success" : "neutral";
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

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
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

function ScoreTile({ label, value }) {
  return (
    <div className="rounded-[20px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-stone-950 dark:text-stone-50">
        {safeNumber(value)}
      </div>
      <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        Out of 5
      </div>
    </div>
  );
}

function EvaluationCard({ supplier, evaluation, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(supplier?.id)}
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
              {safe(supplier?.name) || "-"}
            </div>
            <Pill tone={supplierTone(supplier?.sourceType)}>
              {safe(supplier?.sourceType) || "LOCAL"}
            </Pill>
            <Pill tone={activeTone(!!supplier?.isActive)}>
              {supplier?.isActive ? "ACTIVE" : "INACTIVE"}
            </Pill>
            <Pill tone={riskTone(evaluation?.riskLevel)}>
              {safe(evaluation?.riskLevel) || "NO RISK"}
            </Pill>
          </div>

          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Contact person:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safe(supplier?.contactName) || "-"}
            </b>{" "}
            • Phone:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safe(supplier?.phone) || "-"}
            </b>
          </div>

          <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Issue count:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safeNumber(evaluation?.issueCount)}
            </b>{" "}
            • Last issue date:{" "}
            <b className="text-stone-900 dark:text-stone-100">
              {safeDate(evaluation?.lastIssueAt)}
            </b>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Overall score
          </div>
          <div className="mt-1 text-lg font-black text-stone-950 dark:text-stone-50">
            {safeNumber(evaluation?.overallScore)}
          </div>
          <div className="mt-1 flex justify-end gap-1">
            <Pill tone={booleanTone(!!evaluation?.isPreferred)}>
              {evaluation?.isPreferred ? "PREFERRED" : "STANDARD"}
            </Pill>
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

function SupplierEvaluationModal({
  open,
  supplier,
  evaluation,
  onClose,
  onSaved,
}) {
  if (!open || !supplier) return null;

  return (
    <SupplierEvaluationModalInner
      key={`evaluation-${supplier.id}-${evaluation?.id || "new"}`}
      supplier={supplier}
      evaluation={evaluation}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function SupplierEvaluationModalInner({
  supplier,
  evaluation,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => evaluationDefaults(evaluation));
  const [errorText, setErrorText] = useState("");

  async function handleSave() {
    setErrorText("");

    const payload = {
      reliabilityRating: Number(form.reliabilityRating || 0),
      priceRating: Number(form.priceRating || 0),
      qualityRating: Number(form.qualityRating || 0),
      speedRating: Number(form.speedRating || 0),
      communicationRating: Number(form.communicationRating || 0),
      issueCount: Number(form.issueCount || 0),
      lastIssueAt: form.lastIssueAt || undefined,
      isPreferred: !!form.isPreferred,
      isWatchlist: !!form.isWatchlist,
      riskLevel: String(form.riskLevel || "LOW")
        .trim()
        .toUpperCase(),
      ownerAssessmentNote:
        String(form.ownerAssessmentNote || "").trim() || undefined,
    };

    try {
      const result = await apiFetch(
        `/owner/suppliers/${supplier.id}/evaluation`,
        {
          method: evaluation?.id ? "PUT" : "POST",
          body: payload,
        },
      );
      onSaved?.(result);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to save supplier evaluation",
      );
    }
  }

  return (
    <ModalShell
      title={
        evaluation?.id
          ? "Edit supplier evaluation"
          : "Create supplier evaluation"
      }
      subtitle={`Owner evaluation for ${safe(supplier?.name) || "supplier"}.`}
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Reliability rating
          </label>
          <FormInput
            type="number"
            min="0"
            max="5"
            value={form.reliabilityRating}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                reliabilityRating: e.target.value,
              }))
            }
            placeholder="0 to 5"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Price rating
          </label>
          <FormInput
            type="number"
            min="0"
            max="5"
            value={form.priceRating}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, priceRating: e.target.value }))
            }
            placeholder="0 to 5"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Quality rating
          </label>
          <FormInput
            type="number"
            min="0"
            max="5"
            value={form.qualityRating}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, qualityRating: e.target.value }))
            }
            placeholder="0 to 5"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Speed rating
          </label>
          <FormInput
            type="number"
            min="0"
            max="5"
            value={form.speedRating}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, speedRating: e.target.value }))
            }
            placeholder="0 to 5"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Communication rating
          </label>
          <FormInput
            type="number"
            min="0"
            max="5"
            value={form.communicationRating}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                communicationRating: e.target.value,
              }))
            }
            placeholder="0 to 5"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Risk level
          </label>
          <FormSelect
            value={form.riskLevel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, riskLevel: e.target.value }))
            }
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Issue count
          </label>
          <FormInput
            type="number"
            min="0"
            value={form.issueCount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, issueCount: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Last issue date
          </label>
          <FormInput
            type="date"
            value={form.lastIssueAt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, lastIssueAt: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Preferred supplier
          </label>
          <FormSelect
            value={form.isPreferred ? "true" : "false"}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                isPreferred: e.target.value === "true",
              }))
            }
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Watchlist
          </label>
          <FormSelect
            value={form.isWatchlist ? "true" : "false"}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                isWatchlist: e.target.value === "true",
              }))
            }
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </FormSelect>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            Owner assessment note
          </label>
          <textarea
            value={form.ownerAssessmentNote}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                ownerAssessmentNote: e.target.value,
              }))
            }
            rows={5}
            className="w-full rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Owner judgment about supplier reliability, risk, pricing behavior, and whether this supplier should stay preferred."
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
          idleText="Save supplier evaluation"
          loadingText="Saving..."
          successText="Saved"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerSupplierEvaluationsTab() {
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedDetail, setSelectedDetail] = useState({
    supplier: null,
    evaluation: null,
  });

  const [q, setQ] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [active, setActive] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [preferredOnly, setPreferredOnly] = useState("");
  const [watchlistOnly, setWatchlistOnly] = useState("");
  const [hasEvaluation, setHasEvaluation] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editingEvaluation, setEditingEvaluation] = useState(false);

  const detailSupplier = normalizeSupplier(selectedDetail?.supplier);
  const detailEvaluation = normalizeEvaluation(selectedDetail?.evaluation);

  const filteredRows = useMemo(() => {
    const query = String(q || "")
      .trim()
      .toLowerCase();

    return suppliers.filter((item) => {
      const supplier = item?.supplier;
      const evaluation = item?.evaluation;

      if (
        sourceType &&
        safe(supplier?.sourceType).toUpperCase() !== sourceType
      ) {
        return false;
      }

      if (active === "true" && !supplier?.isActive) return false;
      if (active === "false" && supplier?.isActive) return false;

      if (
        riskLevel &&
        safe(evaluation?.riskLevel).toUpperCase() !== riskLevel
      ) {
        return false;
      }

      if (preferredOnly === "yes" && !evaluation?.isPreferred) return false;
      if (preferredOnly === "no" && !!evaluation?.isPreferred) return false;

      if (watchlistOnly === "yes" && !evaluation?.isWatchlist) return false;
      if (watchlistOnly === "no" && !!evaluation?.isWatchlist) return false;

      if (hasEvaluation === "yes" && !evaluation) return false;
      if (hasEvaluation === "no" && !!evaluation) return false;

      if (!query) return true;

      const haystack = [
        supplier?.name,
        supplier?.contactName,
        supplier?.phone,
        supplier?.email,
        supplier?.country,
        supplier?.city,
        evaluation?.riskLevel,
        evaluation?.ownerAssessmentNote,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [
    suppliers,
    q,
    sourceType,
    active,
    riskLevel,
    preferredOnly,
    watchlistOnly,
    hasEvaluation,
  ]);

  const overview = useMemo(() => {
    let total = 0;
    let withEvaluation = 0;
    let preferredCount = 0;
    let watchlistCount = 0;
    let lowRisk = 0;
    let mediumRisk = 0;
    let highRisk = 0;
    let totalScore = 0;
    let scoredCount = 0;

    for (const row of filteredRows) {
      total += 1;

      if (row?.evaluation) {
        withEvaluation += 1;
        if (row.evaluation.isPreferred) preferredCount += 1;
        if (row.evaluation.isWatchlist) watchlistCount += 1;

        const risk = safe(row.evaluation.riskLevel).toUpperCase();
        if (risk === "LOW") lowRisk += 1;
        else if (risk === "MEDIUM") mediumRisk += 1;
        else highRisk += 1;

        if (Number.isFinite(Number(row.evaluation.overallScore))) {
          totalScore += Number(row.evaluation.overallScore || 0);
          scoredCount += 1;
        }
      }
    }

    const averageScore =
      scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : "0.0";

    return {
      total,
      withEvaluation,
      missingEvaluation: Math.max(0, total - withEvaluation),
      preferredCount,
      watchlistCount,
      lowRisk,
      mediumRisk,
      highRisk,
      averageScore,
    };
  }, [filteredRows]);

  const visibleRows = filteredRows.slice(0, visibleCount);

  async function load() {
    setLoading(true);
    setErrorText("");

    try {
      const result = await apiFetch("/owner/suppliers?limit=300", {
        method: "GET",
      });

      const supplierRows = Array.isArray(result?.suppliers)
        ? result.suppliers.map(normalizeSupplier).filter(Boolean)
        : [];

      const detailResults = await Promise.all(
        supplierRows.map(async (supplier) => {
          try {
            const detail = await apiFetch(`/owner/suppliers/${supplier.id}`, {
              method: "GET",
            });

            return {
              supplier: normalizeSupplier(detail?.supplier || supplier),
              evaluation: normalizeEvaluation(detail?.evaluation),
            };
          } catch {
            return {
              supplier,
              evaluation: null,
            };
          }
        }),
      );

      setSuppliers(detailResults);
      setSelectedSupplierId((prev) =>
        prev &&
        detailResults.some((x) => String(x?.supplier?.id) === String(prev))
          ? String(prev)
          : detailResults[0]?.supplier?.id != null
            ? String(detailResults[0].supplier.id)
            : "",
      );
    } catch (e) {
      setSuppliers([]);
      setSelectedSupplierId("");
      setSelectedDetail({ supplier: null, evaluation: null });
      setErrorText(
        e?.data?.error || e?.message || "Failed to load supplier evaluations",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setSelectedDetail({ supplier: null, evaluation: null });
      return;
    }

    setDetailLoading(true);
    try {
      const detail = await apiFetch(`/owner/suppliers/${id}`, {
        method: "GET",
      });

      setSelectedDetail({
        supplier: detail?.supplier || null,
        evaluation: detail?.evaluation || null,
      });
    } catch (e) {
      setSelectedDetail({ supplier: null, evaluation: null });
      setErrorText(
        e?.data?.error ||
          e?.message ||
          "Failed to load supplier evaluation detail",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadDetail(selectedSupplierId);
  }, [selectedSupplierId]);

  async function handleSaved(message) {
    setSuccessText(message);
    const nextId = selectedSupplierId;

    setEditingEvaluation(false);
    await load();

    if (nextId) {
      setSelectedSupplierId(String(nextId));
      await loadDetail(String(nextId));
    }

    setTimeout(() => setSuccessText(""), 2500);
  }

  function handleFilterChange(setter, value) {
    setter(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="grid gap-4">
      <AlertBox message={errorText} />
      <AlertBox message={successText} tone="success" />

      <SectionShell
        title="Supplier Evaluations"
        hint="Owner scoring, preferred suppliers, watchlist, risk, issue tracking, and performance judgment."
        right={
          detailSupplier ? (
            <AsyncButton
              idleText={
                detailEvaluation
                  ? "Edit supplier evaluation"
                  : "Create supplier evaluation"
              }
              loadingText="Opening..."
              successText="Ready"
              onClick={async () => setEditingEvaluation(true)}
              variant="secondary"
            />
          ) : null
        }
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
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Evaluation overview
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Suppliers"
                    value={safeNumber(overview?.total)}
                    sub="Current filtered rows"
                  />
                  <MetricCard
                    label="With evaluation"
                    value={safeNumber(overview?.withEvaluation)}
                    sub="Owner judgment exists"
                  />
                  <MetricCard
                    label="Missing evaluation"
                    value={safeNumber(overview?.missingEvaluation)}
                    sub="Needs owner review"
                  />
                  <MetricCard
                    label="Preferred"
                    value={safeNumber(overview?.preferredCount)}
                    sub="Approved suppliers"
                  />
                  <MetricCard
                    label="Watchlist"
                    value={safeNumber(overview?.watchlistCount)}
                    sub="Needs attention"
                  />
                  <MetricCard
                    label="Low risk"
                    value={safeNumber(overview?.lowRisk)}
                    sub="Healthy suppliers"
                  />
                  <MetricCard
                    label="Medium risk"
                    value={safeNumber(overview?.mediumRisk)}
                    sub="Monitor closely"
                  />
                  <MetricCard
                    label="High risk"
                    value={safeNumber(overview?.highRisk)}
                    sub="Immediate caution"
                  />
                </div>

                <div className="mt-3">
                  <MetricCard
                    label="Average overall score"
                    value={overview?.averageScore || "0.0"}
                    sub="Across evaluated suppliers"
                  />
                </div>
              </Surface>

              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Evaluation filters
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <FormInput
                    value={q}
                    onChange={(e) => handleFilterChange(setQ, e.target.value)}
                    placeholder="Search supplier, owner note, risk"
                  />

                  <FormSelect
                    value={sourceType}
                    onChange={(e) =>
                      handleFilterChange(setSourceType, e.target.value)
                    }
                  >
                    <option value="">All source types</option>
                    <option value="LOCAL">Local</option>
                    <option value="ABROAD">Abroad</option>
                  </FormSelect>

                  <FormSelect
                    value={active}
                    onChange={(e) =>
                      handleFilterChange(setActive, e.target.value)
                    }
                  >
                    <option value="">All activity states</option>
                    <option value="true">Active only</option>
                    <option value="false">Inactive only</option>
                  </FormSelect>

                  <FormSelect
                    value={riskLevel}
                    onChange={(e) =>
                      handleFilterChange(setRiskLevel, e.target.value)
                    }
                  >
                    <option value="">All risk levels</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </FormSelect>

                  <FormSelect
                    value={preferredOnly}
                    onChange={(e) =>
                      handleFilterChange(setPreferredOnly, e.target.value)
                    }
                  >
                    <option value="">All preferred states</option>
                    <option value="yes">Preferred only</option>
                    <option value="no">Not preferred only</option>
                  </FormSelect>

                  <FormSelect
                    value={watchlistOnly}
                    onChange={(e) =>
                      handleFilterChange(setWatchlistOnly, e.target.value)
                    }
                  >
                    <option value="">All watchlist states</option>
                    <option value="yes">Watchlist only</option>
                    <option value="no">Not watchlist only</option>
                  </FormSelect>

                  <FormSelect
                    value={hasEvaluation}
                    onChange={(e) =>
                      handleFilterChange(setHasEvaluation, e.target.value)
                    }
                  >
                    <option value="">All evaluation states</option>
                    <option value="yes">Has evaluation</option>
                    <option value="no">Missing evaluation</option>
                  </FormSelect>

                  <FormSelect
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                  >
                    <option value="">Select supplier</option>
                    {filteredRows.map((row) => (
                      <option
                        key={row?.supplier?.id}
                        value={String(row?.supplier?.id || "")}
                      >
                        {safe(row?.supplier?.name) || "-"}
                      </option>
                    ))}
                  </FormSelect>
                </div>

                <div className="mt-4 rounded-[22px] border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                    Selected supplier
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
                      Overall score:{" "}
                      <b>
                        {detailLoading
                          ? "..."
                          : safeNumber(detailEvaluation?.overallScore)}
                      </b>
                    </div>

                    <div className="rounded-[18px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
                      Risk level:{" "}
                      <b>
                        {detailLoading
                          ? "..."
                          : safe(detailEvaluation?.riskLevel) || "—"}
                      </b>
                    </div>
                  </div>
                </div>
              </Surface>
            </div>

            <div className="mt-4 grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
              <Surface>
                <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                  Supplier evaluation directory
                </div>
                <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Select a supplier to inspect and manage supplier evaluation
                  details.
                </div>

                <div className="mt-4">
                  {filteredRows.length === 0 ? (
                    <EmptyState text="No supplier evaluations match the current filters." />
                  ) : (
                    <div className="grid gap-3">
                      {visibleRows.map((row) => (
                        <EvaluationCard
                          key={row?.supplier?.id}
                          supplier={row?.supplier}
                          evaluation={row?.evaluation}
                          active={
                            String(row?.supplier?.id) ===
                            String(selectedSupplierId)
                          }
                          onSelect={(id) =>
                            setSelectedSupplierId(String(id || ""))
                          }
                        />
                      ))}
                    </div>
                  )}

                  {visibleCount < filteredRows.length ? (
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

              {detailSupplier ? (
                <Surface>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                        Selected supplier evaluation
                      </div>
                      <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        Focused owner view of supplier performance, risk, and
                        judgment.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Pill tone={supplierTone(detailSupplier?.sourceType)}>
                        {safe(detailSupplier?.sourceType) || "LOCAL"}
                      </Pill>
                      <Pill tone={activeTone(!!detailSupplier?.isActive)}>
                        {detailSupplier?.isActive ? "ACTIVE" : "INACTIVE"}
                      </Pill>
                      <Pill tone={riskTone(detailEvaluation?.riskLevel)}>
                        {safe(detailEvaluation?.riskLevel) || "NO RISK"}
                      </Pill>
                      <Pill tone={booleanTone(!!detailEvaluation?.isPreferred)}>
                        {detailEvaluation?.isPreferred
                          ? "PREFERRED"
                          : "STANDARD"}
                      </Pill>
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
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <MetricCard
                          label="Supplier"
                          value={safe(detailSupplier?.name) || "-"}
                          sub={
                            safe(detailSupplier?.contactName) ||
                            "No contact person"
                          }
                        />
                        <MetricCard
                          label="Overall score"
                          value={safeNumber(detailEvaluation?.overallScore)}
                          sub="Calculated by backend"
                        />
                        <MetricCard
                          label="Risk level"
                          value={safe(detailEvaluation?.riskLevel) || "-"}
                          sub="Owner risk posture"
                        />
                        <MetricCard
                          label="Issue count"
                          value={safeNumber(detailEvaluation?.issueCount)}
                          sub="Recorded supplier issues"
                        />
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <Surface className="bg-stone-50 dark:bg-stone-950">
                          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Supplier identity
                          </div>

                          <div className="mt-4 grid gap-3">
                            <InfoTile
                              label="Supplier"
                              value={safe(detailSupplier?.name) || "-"}
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="Phone"
                                value={safe(detailSupplier?.phone) || "-"}
                              />
                              <InfoTile
                                label="Email"
                                value={safe(detailSupplier?.email) || "-"}
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoTile
                                label="Country / City"
                                value={
                                  [
                                    safe(detailSupplier?.country),
                                    safe(detailSupplier?.city),
                                  ]
                                    .filter(Boolean)
                                    .join(" / ") || "-"
                                }
                              />
                              <InfoTile
                                label="Current debt"
                                value={money(
                                  detailSupplier?.balanceDue,
                                  detailSupplier?.defaultCurrency,
                                )}
                              />
                            </div>
                            <InfoTile
                              label="Supplier notes"
                              value={
                                safe(detailSupplier?.notes) ||
                                "No supplier notes"
                              }
                            />
                          </div>
                        </Surface>

                        <Surface className="bg-stone-50 dark:bg-stone-950">
                          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Score breakdown
                          </div>

                          {detailEvaluation ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <ScoreTile
                                label="Reliability"
                                value={detailEvaluation?.reliabilityRating}
                              />
                              <ScoreTile
                                label="Price"
                                value={detailEvaluation?.priceRating}
                              />
                              <ScoreTile
                                label="Quality"
                                value={detailEvaluation?.qualityRating}
                              />
                              <ScoreTile
                                label="Speed"
                                value={detailEvaluation?.speedRating}
                              />
                              <ScoreTile
                                label="Communication"
                                value={detailEvaluation?.communicationRating}
                              />
                              <InfoTile
                                label="Last issue date"
                                value={safeDate(detailEvaluation?.lastIssueAt)}
                              />
                            </div>
                          ) : (
                            <div className="mt-4">
                              <EmptyState text="This supplier does not have a supplier evaluation yet." />
                            </div>
                          )}
                        </Surface>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <Surface className="bg-stone-50 dark:bg-stone-950">
                          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Evaluation status
                          </div>

                          {detailEvaluation ? (
                            <div className="mt-4 grid gap-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <InfoTile
                                  label="Preferred supplier"
                                  value={
                                    detailEvaluation?.isPreferred ? "Yes" : "No"
                                  }
                                />
                                <InfoTile
                                  label="Watchlist"
                                  value={
                                    detailEvaluation?.isWatchlist ? "Yes" : "No"
                                  }
                                />
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <InfoTile
                                  label="Evaluated at"
                                  value={safeDate(
                                    detailEvaluation?.evaluatedAt,
                                  )}
                                />
                                <InfoTile
                                  label="Updated at"
                                  value={safeDate(detailEvaluation?.updatedAt)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4">
                              <EmptyState text="No evaluation status recorded yet." />
                            </div>
                          )}
                        </Surface>

                        <Surface className="bg-stone-50 dark:bg-stone-950">
                          <div className="text-xs font-black uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                            Owner assessment note
                          </div>

                          {detailEvaluation ? (
                            <div className="mt-4 rounded-[20px] border border-stone-200 bg-white p-4 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                              {safe(detailEvaluation?.ownerAssessmentNote) ||
                                "No owner assessment note recorded."}
                            </div>
                          ) : (
                            <div className="mt-4">
                              <EmptyState text="No owner assessment note recorded yet." />
                            </div>
                          )}
                        </Surface>
                      </div>
                    </>
                  )}
                </Surface>
              ) : (
                <Surface>
                  <div className="text-sm font-black text-stone-950 dark:text-stone-50">
                    Selected supplier evaluation
                  </div>
                  <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    This section appears after a supplier is selected.
                  </div>
                  <div className="mt-4">
                    <EmptyState text="Select a supplier evaluation card above to inspect performance and risk." />
                  </div>
                </Surface>
              )}
            </div>
          </>
        )}
      </SectionShell>

      <SupplierEvaluationModal
        open={editingEvaluation}
        supplier={detailSupplier}
        evaluation={detailEvaluation}
        onClose={() => setEditingEvaluation(false)}
        onSaved={() => handleSaved("Supplier evaluation saved")}
      />
    </div>
  );
}
