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

import { apiFetch } from "../../../lib/api";

const PAGE_SIZE = 50;

function normalizeRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.audit)) return result.audit;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeRow(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    userId: row.userId ?? row.user_id ?? null,
    userEmail: row.userEmail ?? row.user_email ?? "",
    action: row.action ?? "",
    entity: row.entity ?? "",
    entityId: row.entityId ?? row.entity_id ?? null,
    description: row.description ?? "",
    meta: row.meta ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
  };
}

function toneForAction(action) {
  const value = safe(action).toUpperCase();

  if (
    value.includes("DELETE") ||
    value.includes("VOID") ||
    value.includes("DEACTIVATE") ||
    value.includes("REMOVE") ||
    value.includes("CANCEL") ||
    value.includes("FAILED")
  ) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (
    value.includes("CREATE") ||
    value.includes("ADD") ||
    value.includes("PAYMENT") ||
    value.includes("REACTIVATE") ||
    value.includes("REOPEN") ||
    value.includes("OPEN")
  ) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (
    value.includes("UPDATE") ||
    value.includes("EDIT") ||
    value.includes("APPROVE")
  ) {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function toneForEntity(entity) {
  const value = safe(entity).toLowerCase();

  if (value === "sale") {
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300";
  }
  if (value === "supplier_bill" || value === "supplier") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (value === "user") {
    return "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300";
  }
  if (value === "location") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }
  if (value === "credit") {
    return "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function prettifyLabel(key) {
  const labels = {
    locationId: "Branch",
    userId: "User",
    entityId: "Entity ID",
    isActive: "Status",
    contactName: "Contact person",
    defaultCurrency: "Default currency",
    sourceType: "Source type",
    dueDate: "Due date",
    issuedDate: "Issued date",
    billNo: "Bill number",
    totalAmount: "Total amount",
    paidAmount: "Paid amount",
    toStatus: "To status",
    fromStatus: "From status",
  };

  if (labels[key]) return labels[key];

  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function getLocationLabel(locationId, locationsMap) {
  if (locationId == null || locationId === "") return "-";

  const location = locationsMap.get(String(locationId));
  if (!location) return `Branch #${locationId}`;

  return safe(location.code)
    ? `${safe(location.name)} (${safe(location.code)})`
    : safe(location.name);
}

function formatValue(key, value, locationsMap) {
  if (value === null || value === undefined || value === "") return "-";

  if (key === "locationId") {
    return getLocationLabel(value, locationsMap);
  }

  if (key === "isActive") {
    return value ? "Active" : "Inactive";
  }

  if (
    key === "createdAt" ||
    key === "updatedAt" ||
    key === "issuedDate" ||
    key === "dueDate" ||
    key === "paidAt"
  ) {
    return safeDate(value);
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function extractMetaChanges(meta, locationsMap) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];

  const changes = [];

  for (const [key, value] of Object.entries(meta)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("from" in value || "to" in value)
    ) {
      const fromRaw = value.from;
      const toRaw = value.to;

      if (JSON.stringify(fromRaw) === JSON.stringify(toRaw)) continue;

      changes.push({
        key,
        label: prettifyLabel(key),
        from: formatValue(key, fromRaw, locationsMap),
        to: formatValue(key, toRaw, locationsMap),
      });
    }
  }

  return changes;
}

function AuditMetaChanges({ meta, locationsMap }) {
  const changes = extractMetaChanges(meta, locationsMap);

  if (!changes.length) return null;

  return (
    <div className="mt-4 rounded-[22px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
        Changes
      </p>

      <div className="mt-3 space-y-3">
        {changes.map((row) => (
          <div
            key={row.key}
            className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 md:grid-cols-[160px_1fr_1fr]"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                Field
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-stone-50">
                {row.label}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                From
              </p>
              <p className="mt-1 break-words text-sm text-stone-700 dark:text-stone-300">
                {row.from}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                To
              </p>
              <p className="mt-1 break-words text-sm font-semibold text-stone-950 dark:text-stone-50">
                {row.to}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RawMetaBlock({ meta }) {
  const [open, setOpen] = useState(false);

  if (!meta || typeof meta !== "object") return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
      >
        {open ? "Hide raw details" : "View raw details"}
      </button>

      {open ? (
        <pre className="mt-3 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-950 p-4 text-xs leading-6 text-stone-200 dark:border-stone-800">
          {JSON.stringify(meta, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function AuditCard({ row, locationsMap }) {
  const placeText = getLocationLabel(row?.locationId, locationsMap);

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm transition dark:border-stone-800 dark:bg-stone-900 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${toneForAction(
                row?.action,
              )}`}
            >
              {safe(row?.action) || "-"}
            </span>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${toneForEntity(
                row?.entity,
              )}`}
            >
              {safe(row?.entity) || "-"}
            </span>

            <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
              #{safeNumber(row?.id)}
            </span>
          </div>

          <h3 className="mt-4 text-lg font-bold text-stone-950 dark:text-stone-50">
            {safe(row?.description) || "Audit event"}
          </h3>

          <div className="mt-4 grid gap-3 text-sm text-stone-600 dark:text-stone-400 sm:grid-cols-2 xl:grid-cols-4">
            <p className="break-all">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                User:
              </span>{" "}
              {safe(row?.userEmail) ||
                (row?.userId != null ? `User #${row.userId}` : "-")}
            </p>

            <p className="break-words">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Place:
              </span>{" "}
              {placeText}
            </p>

            <p>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Entity ID:
              </span>{" "}
              {row?.entityId != null ? safeNumber(row.entityId) : "-"}
            </p>

            <p>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Date:
              </span>{" "}
              {safeDate(row?.createdAt)}
            </p>
          </div>

          <AuditMetaChanges meta={row?.meta} locationsMap={locationsMap} />
          <RawMetaBlock meta={row?.meta} />
        </div>
      </div>
    </div>
  );
}

export default function OwnerAuditTab({ locations = [] }) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [rows, setRows] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [actionOptions, setActionOptions] = useState([]);

  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [userId, setUserId] = useState("");
  const [entityId, setEntityId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const locationsMap = useMemo(() => {
    const map = new Map();

    if (Array.isArray(locations)) {
      for (const row of locations) {
        if (row?.id == null) continue;

        map.set(String(row.id), {
          id: row.id,
          name: safe(row?.name) || `Branch #${row.id}`,
          code: safe(row?.code) || "",
        });
      }
    }

    return map;
  }, [locations]);

  const overview = useMemo(() => {
    const totalLogs = rows.length;

    const uniqueUsers = new Set(
      rows
        .map((row) => row?.userId)
        .filter((value) => value !== null && value !== undefined),
    ).size;

    const uniqueEntities = new Set(
      rows
        .map((row) => row?.entity)
        .filter(Boolean)
        .map((value) => String(value).toLowerCase()),
    ).size;

    const today = new Date();
    const todayKey = `${today.getUTCFullYear()}-${String(
      today.getUTCMonth() + 1,
    ).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

    const todayLogs = rows.filter((row) => {
      const d = row?.createdAt ? new Date(row.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;

      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
        2,
        "0",
      )}-${String(d.getUTCDate()).padStart(2, "0")}`;

      return key === todayKey;
    }).length;

    return {
      totalLogs,
      uniqueUsers,
      uniqueEntities,
      todayLogs,
    };
  }, [rows]);

  function buildParams(extra = {}) {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    if (userId) params.set("userId", userId);
    if (entityId) params.set("entityId", entityId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    params.set("limit", String(extra.limit || PAGE_SIZE));

    if (extra.cursor) params.set("cursor", String(extra.cursor));

    return params;
  }

  async function loadActionOptions() {
    try {
      const result = await apiFetch("/audit/actions", { method: "GET" });
      setActionOptions(
        Array.isArray(result?.actions) ? result.actions.filter(Boolean) : [],
      );
    } catch {
      setActionOptions([]);
    }
  }

  async function loadFirstPage() {
    setLoading(true);
    setErrorText("");

    try {
      const params = buildParams({ limit: PAGE_SIZE });
      const result = await apiFetch(`/audit?${params.toString()}`, {
        method: "GET",
      });

      const nextRows = normalizeRows(result).map(normalizeRow).filter(Boolean);

      setRows(nextRows);
      setNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setRows([]);
      setNextCursor(null);
      setErrorText(e?.data?.error || e?.message || "Failed to load audit logs");
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
      const result = await apiFetch(`/audit?${params.toString()}`, {
        method: "GET",
      });

      const nextRows = normalizeRows(result).map(normalizeRow).filter(Boolean);

      setRows((prev) => [...prev, ...nextRows]);
      setNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setErrorText(
        e?.data?.error || e?.message || "Failed to load more audit logs",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadActionOptions();
  }, []);

  useEffect(() => {
    loadFirstPage();
  }, [q, action, entity, userId, entityId, from, to]);

  return (
    <div className="space-y-6">
      <AlertBox message={errorText} />

      {loading ? (
        <SectionCard
          title="Audit log"
          subtitle="Loading operational traceability across the workspace."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Audit overview"
            subtitle="Searchable visibility into who changed what, where, and when."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Loaded logs"
                value={safeNumber(overview?.totalLogs)}
                sub="Currently loaded in this view"
              />
              <StatCard
                label="Users"
                value={safeNumber(overview?.uniqueUsers)}
                sub="Distinct actors in current results"
              />
              <StatCard
                label="Entities"
                value={safeNumber(overview?.uniqueEntities)}
                sub="Distinct record types touched"
              />
              <StatCard
                label="Today"
                value={safeNumber(overview?.todayLogs)}
                sub="Events recorded today"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Audit filters"
            subtitle="Filter by action, entity, actor, record id, date range, or description."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FormInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search description"
              />

              <FormSelect
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="">All actions</option>
                {actionOptions.map((row) => (
                  <option key={row} value={row}>
                    {safe(row)}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                placeholder="Entity e.g. supplier_bill"
              />

              <FormInput
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
              />

              <FormInput
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="Entity ID"
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

              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setAction("");
                  setEntity("");
                  setUserId("");
                  setEntityId("");
                  setFrom("");
                  setTo("");
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Clear filters
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Audit timeline"
            subtitle="Readable operational history with structured change details."
          >
            {rows.length === 0 ? (
              <EmptyState text="No audit records match the current filters." />
            ) : (
              <div className="space-y-4">
                {rows.map((row, index) => (
                  <AuditCard
                    key={row?.id ?? index}
                    row={row}
                    locationsMap={locationsMap}
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
        </>
      )}
    </div>
  );
}
