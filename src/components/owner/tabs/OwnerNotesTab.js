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

function normalizeNotificationRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.notifications)) return result.notifications;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeNoteRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.notes)) return result.notes;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function normalizeNotification(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    recipientUserId: row.recipientUserId ?? row.recipient_user_id ?? null,
    actorUserId: row.actorUserId ?? row.actor_user_id ?? null,
    type: row.type ?? "",
    title: row.title ?? "",
    body: row.body ?? "",
    priority: String(row.priority || "normal").toLowerCase(),
    entity: row.entity ?? "",
    entityId: row.entityId ?? row.entity_id ?? null,
    isRead: !!(row.isRead ?? row.is_read),
    readAt: row.readAt ?? row.read_at ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    location: row.location ?? null,
    locationLabel: row.locationLabel ?? row.location_label ?? "",
  };
}

function normalizeNote(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    locationId: row.locationId ?? row.location_id ?? null,
    userId: row.userId ?? row.user_id ?? null,
    entity: row.entity ?? row.entityType ?? row.entity_type ?? "",
    entityId: row.entityId ?? row.entity_id ?? null,
    body: row.body ?? row.message ?? "",
    isPinned: !!(row.isPinned ?? row.is_pinned),
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function priorityTone(priority) {
  const value = String(priority || "normal").toLowerCase();

  if (value === "high") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (value === "warn") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
}

function notificationTypeTone(type) {
  const value = String(type || "").toLowerCase();

  if (
    value.includes("failed") ||
    value.includes("void") ||
    value.includes("reject") ||
    value.includes("overdue")
  ) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (
    value.includes("create") ||
    value.includes("payment") ||
    value.includes("approved") ||
    value.includes("settled") ||
    value.includes("success")
  ) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (
    value.includes("awaiting") ||
    value.includes("draft") ||
    value.includes("adjust") ||
    value.includes("note") ||
    value.includes("reminder")
  ) {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function entityTone(entity) {
  const value = String(entity || "").toLowerCase();

  if (value === "sale") {
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300";
  }

  if (value === "credit") {
    return "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300";
  }

  if (value === "customer") {
    return "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300";
  }

  if (value === "supplier" || value === "supplier_bill") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (value === "inventory_adjustment_request") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }

  return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
}

function displayLocationLabel(row, locationsMap) {
  if (safe(row?.locationLabel)) return safe(row.locationLabel);

  if (row?.location?.name) {
    return row.location?.code
      ? `${safe(row.location.name)} (${safe(row.location.code)})`
      : safe(row.location.name);
  }

  const id = row?.locationId;
  if (id == null) return "-";

  const mapped = locationsMap.get(String(id));
  if (mapped) {
    return mapped.code ? `${mapped.name} (${mapped.code})` : mapped.name;
  }

  return `Branch #${id}`;
}

function NotificationCard({ row, locationsMap, onMarkRead, markingId }) {
  const canMarkRead = !row?.isRead;

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${priorityTone(
                row?.priority,
              )}`}
            >
              {safe(row?.priority) || "normal"}
            </span>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${notificationTypeTone(
                row?.type,
              )}`}
            >
              {safe(row?.type) || "-"}
            </span>

            {safe(row?.entity) ? (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${entityTone(
                  row?.entity,
                )}`}
              >
                {safe(row?.entity)}
                {row?.entityId != null ? ` #${safeNumber(row.entityId)}` : ""}
              </span>
            ) : null}

            <span
              className={
                "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold " +
                (row?.isRead
                  ? "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300")
              }
            >
              {row?.isRead ? "Read" : "Unread"}
            </span>
          </div>

          <h3 className="mt-4 text-lg font-bold text-stone-950 dark:text-stone-50">
            {safe(row?.title) || "Notification"}
          </h3>

          {safe(row?.body) ? (
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
              {safe(row?.body)}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 text-sm text-stone-600 dark:text-stone-400 sm:grid-cols-2 xl:grid-cols-4">
            <p className="break-words">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Place:
              </span>{" "}
              {displayLocationLabel(row, locationsMap)}
            </p>

            <p>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Created:
              </span>{" "}
              {safeDate(row?.createdAt)}
            </p>

            <p>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Read at:
              </span>{" "}
              {safeDate(row?.readAt)}
            </p>

            <p>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                ID:
              </span>{" "}
              #{safeNumber(row?.id)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canMarkRead ? (
            <AsyncButton
              idleText="Mark as read"
              loadingText="Marking..."
              successText="Marked"
              onClick={async () => onMarkRead?.(row)}
              disabled={markingId === row?.id}
              variant="secondary"
            />
          ) : (
            <span className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
              Already read
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteCard({ row, locationsMap }) {
  const placeText = displayLocationLabel(row, locationsMap);

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${entityTone(
                row?.entity,
              )}`}
            >
              {safe(row?.entity) || "-"}
              {row?.entityId != null ? ` #${safeNumber(row.entityId)}` : ""}
            </span>

            {row?.isPinned ? (
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Pinned
              </span>
            ) : null}

            <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
              Note #{safeNumber(row?.id)}
            </span>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700 dark:text-stone-300">
            {safe(row?.body) || "-"}
          </p>

          <div className="mt-4 grid gap-3 text-sm text-stone-600 dark:text-stone-400 sm:grid-cols-2 xl:grid-cols-4">
            <p>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Place:
              </span>{" "}
              {placeText}
            </p>

            <p>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                User:
              </span>{" "}
              {row?.userId != null ? `User #${safeNumber(row.userId)}` : "-"}
            </p>

            <p>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Created:
              </span>{" "}
              {safeDate(row?.createdAt)}
            </p>

            <p>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Updated:
              </span>{" "}
              {safeDate(row?.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
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

function CreateNoteModal({ open, onClose, onSaved, entityType, entityId }) {
  const [form, setForm] = useState({
    entityType: entityType || "customer",
    entityId: entityId || "",
    message: "",
  });
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      entityType: entityType || "customer",
      entityId: entityId || "",
      message: "",
    });
    setErrorText("");
  }, [open, entityType, entityId]);

  if (!open) return null;

  async function handleSave() {
    setErrorText("");

    try {
      const payload = {
        entityType: String(form.entityType || "")
          .trim()
          .toLowerCase(),
        entityId: Number(form.entityId),
        message: String(form.message || "").trim(),
      };

      const result = await apiFetch("/notes", {
        method: "POST",
        body: payload,
      });

      onSaved?.(result);
    } catch (e) {
      setErrorText(e?.data?.error || e?.message || "Failed to create note");
    }
  }

  return (
    <ModalShell
      title="Create note"
      subtitle="Notes are entity-specific. Choose the record type and record id you want to attach this note to."
      onClose={onClose}
    >
      <AlertBox message={errorText} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Entity type
          </label>
          <FormSelect
            value={form.entityType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, entityType: e.target.value }))
            }
          >
            <option value="sale">Sale</option>
            <option value="credit">Credit</option>
            <option value="customer">Customer</option>
          </FormSelect>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Entity ID
          </label>
          <FormInput
            type="number"
            value={form.entityId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, entityId: e.target.value }))
            }
            placeholder="Record ID"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-stone-300">
            Note
          </label>
          <textarea
            value={form.message}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, message: e.target.value }))
            }
            rows={5}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
            placeholder="Write the operational note"
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
          idleText="Create note"
          loadingText="Creating..."
          successText="Created"
          onClick={handleSave}
        />
      </div>
    </ModalShell>
  );
}

export default function OwnerNotesTab({ locations = [] }) {
  const [mode, setMode] = useState("notifications");

  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingMoreNotifications, setLoadingMoreNotifications] =
    useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationsRows, setNotificationsRows] = useState([]);
  const [notificationsNextCursor, setNotificationsNextCursor] = useState(null);
  const [unreadCountValue, setUnreadCountValue] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [notificationsSuccess, setNotificationsSuccess] = useState("");

  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingMoreNotes, setLoadingMoreNotes] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [notesRows, setNotesRows] = useState([]);
  const [notesNextCursor, setNotesNextCursor] = useState(null);
  const [notesSuccess, setNotesSuccess] = useState("");
  const [noteEntityType, setNoteEntityType] = useState("customer");
  const [noteEntityId, setNoteEntityId] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);

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

  const notificationsOverview = useMemo(() => {
    const rows = Array.isArray(notificationsRows) ? notificationsRows : [];

    const unreadLoaded = rows.filter((row) => !row?.isRead).length;
    const highPriority = rows.filter(
      (row) => String(row?.priority || "").toLowerCase() === "high",
    ).length;
    const relatedEntities = new Set(
      rows
        .map((row) => row?.entity)
        .filter(Boolean)
        .map((value) => String(value).toLowerCase()),
    ).size;

    return {
      loaded: rows.length,
      unreadLoaded,
      highPriority,
      relatedEntities,
    };
  }, [notificationsRows]);

  const notesOverview = useMemo(() => {
    const rows = Array.isArray(notesRows) ? notesRows : [];

    return {
      loaded: rows.length,
      pinned: rows.filter((row) => row?.isPinned).length,
      latestAt: rows[0]?.createdAt || null,
      targetReady: !!String(noteEntityId || "").trim(),
    };
  }, [notesRows, noteEntityId]);

  function buildNotificationsParams(extra = {}) {
    const params = new URLSearchParams();
    params.set("limit", String(extra.limit || PAGE_SIZE));

    if (extra.cursor) params.set("cursor", String(extra.cursor));
    if (unreadOnly) params.set("unreadOnly", "true");

    return params;
  }

  function buildNotesParams(extra = {}) {
    const params = new URLSearchParams();
    params.set(
      "entityType",
      String(noteEntityType || "")
        .trim()
        .toLowerCase(),
    );
    params.set("entityId", String(noteEntityId || "").trim());
    params.set("limit", String(extra.limit || PAGE_SIZE));

    if (extra.cursor) params.set("cursor", String(extra.cursor));

    return params;
  }

  async function loadUnreadCount() {
    try {
      const result = await apiFetch("/notifications/unread-count", {
        method: "GET",
      });
      setUnreadCountValue(Number(result?.unread || 0));
    } catch {
      setUnreadCountValue(0);
    }
  }

  async function loadNotificationsFirstPage() {
    setLoadingNotifications(true);
    setNotificationsError("");

    try {
      const params = buildNotificationsParams({ limit: PAGE_SIZE });
      const result = await apiFetch(`/notifications?${params.toString()}`, {
        method: "GET",
      });

      const rows = normalizeNotificationRows(result)
        .map(normalizeNotification)
        .filter(Boolean);

      setNotificationsRows(rows);
      setNotificationsNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setNotificationsRows([]);
      setNotificationsNextCursor(null);
      setNotificationsError(
        e?.data?.error || e?.message || "Failed to load notifications",
      );
    } finally {
      setLoadingNotifications(false);
    }
  }

  async function loadMoreNotifications() {
    if (!notificationsNextCursor || loadingMoreNotifications) return;

    setLoadingMoreNotifications(true);
    setNotificationsError("");

    try {
      const params = buildNotificationsParams({
        limit: PAGE_SIZE,
        cursor: notificationsNextCursor,
      });

      const result = await apiFetch(`/notifications?${params.toString()}`, {
        method: "GET",
      });

      const rows = normalizeNotificationRows(result)
        .map(normalizeNotification)
        .filter(Boolean);

      setNotificationsRows((prev) => [...prev, ...rows]);
      setNotificationsNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setNotificationsError(
        e?.data?.error || e?.message || "Failed to load more notifications",
      );
    } finally {
      setLoadingMoreNotifications(false);
    }
  }

  async function handleMarkRead(row) {
    if (!row?.id) return;

    setMarkingId(row.id);
    setNotificationsError("");

    try {
      await apiFetch(`/notifications/${row.id}/read`, {
        method: "PATCH",
      });

      setNotificationsRows((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id)
            ? {
                ...item,
                isRead: true,
                readAt: item.readAt || new Date().toISOString(),
              }
            : item,
        ),
      );

      await loadUnreadCount();

      setNotificationsSuccess("Notification marked as read");
      setTimeout(() => setNotificationsSuccess(""), 2500);
    } catch (e) {
      setNotificationsError(
        e?.data?.error || e?.message || "Failed to mark notification as read",
      );
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllRead() {
    setNotificationsError("");

    try {
      await apiFetch("/notifications/read-all", {
        method: "PATCH",
      });

      setNotificationsRows((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );

      setUnreadCountValue(0);
      setNotificationsSuccess("All notifications marked as read");
      setTimeout(() => setNotificationsSuccess(""), 2500);
    } catch (e) {
      setNotificationsError(
        e?.data?.error ||
          e?.message ||
          "Failed to mark all notifications as read",
      );
    }
  }

  async function loadNotesFirstPage() {
    if (!String(noteEntityId || "").trim()) {
      setNotesRows([]);
      setNotesNextCursor(null);
      return;
    }

    setLoadingNotes(true);
    setNotesError("");

    try {
      const params = buildNotesParams({ limit: PAGE_SIZE });
      const result = await apiFetch(`/notes?${params.toString()}`, {
        method: "GET",
      });

      const rows = normalizeNoteRows(result).map(normalizeNote).filter(Boolean);

      setNotesRows(rows);
      setNotesNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setNotesRows([]);
      setNotesNextCursor(null);
      setNotesError(e?.data?.error || e?.message || "Failed to load notes");
    } finally {
      setLoadingNotes(false);
    }
  }

  async function loadMoreNotes() {
    if (!notesNextCursor || loadingMoreNotes) return;

    setLoadingMoreNotes(true);
    setNotesError("");

    try {
      const params = buildNotesParams({
        limit: PAGE_SIZE,
        cursor: notesNextCursor,
      });

      const result = await apiFetch(`/notes?${params.toString()}`, {
        method: "GET",
      });

      const rows = normalizeNoteRows(result).map(normalizeNote).filter(Boolean);

      setNotesRows((prev) => [...prev, ...rows]);
      setNotesNextCursor(result?.nextCursor ?? null);
    } catch (e) {
      setNotesError(
        e?.data?.error || e?.message || "Failed to load more notes",
      );
    } finally {
      setLoadingMoreNotes(false);
    }
  }

  async function handleNoteSaved() {
    setCreatingNote(false);
    setNotesSuccess("Note created");
    await loadNotesFirstPage();
    setTimeout(() => setNotesSuccess(""), 2500);
  }

  useEffect(() => {
    loadUnreadCount();
    loadNotificationsFirstPage();
  }, [unreadOnly]);

  useEffect(() => {
    loadNotesFirstPage();
  }, [noteEntityType, noteEntityId]);

  return (
    <div className="space-y-6">
      <AlertBox
        message={mode === "notifications" ? notificationsError : notesError}
      />
      <AlertBox
        message={mode === "notifications" ? notificationsSuccess : notesSuccess}
        tone="success"
      />

      <SectionCard
        title="Notes / Notifications"
        subtitle="Separate personal alerts from entity-specific internal notes."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setMode("notifications")}
            className={
              "inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition " +
              (mode === "notifications"
                ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800")
            }
          >
            Notifications
            {unreadCountValue > 0 ? ` (${safeNumber(unreadCountValue)})` : ""}
          </button>

          <button
            type="button"
            onClick={() => setMode("notes")}
            className={
              "inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition " +
              (mode === "notes"
                ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800")
            }
          >
            Notes
          </button>
        </div>
      </SectionCard>

      {mode === "notifications" ? (
        <>
          <SectionCard
            title="Notification overview"
            subtitle="Personal operational alerts for the signed-in account."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Loaded"
                value={safeNumber(notificationsOverview?.loaded)}
                sub="Notifications in current view"
              />
              <StatCard
                label="Unread"
                value={safeNumber(unreadCountValue)}
                sub="Unread notifications"
              />
              <StatCard
                label="High priority"
                value={safeNumber(notificationsOverview?.highPriority)}
                sub="Marked high in current view"
              />
              <StatCard
                label="Entities"
                value={safeNumber(notificationsOverview?.relatedEntities)}
                sub="Distinct related record types"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Notification controls"
            subtitle="Filter unread notifications and clear them when reviewed."
            right={
              <AsyncButton
                idleText="Mark all read"
                loadingText="Updating..."
                successText="Done"
                onClick={handleMarkAllRead}
                variant="secondary"
              />
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <FormSelect
                value={unreadOnly ? "true" : "false"}
                onChange={(e) => setUnreadOnly(e.target.value === "true")}
              >
                <option value="false">All notifications</option>
                <option value="true">Unread only</option>
              </FormSelect>

              <div className="flex items-center text-sm text-stone-500 dark:text-stone-400 sm:col-span-2">
                This feed is user-specific. It only shows notifications
                addressed to the signed-in user.
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Notification feed"
            subtitle="Recent alerts, reminders, and workflow events addressed to you."
          >
            {loadingNotifications ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-56 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
                  />
                ))}
              </div>
            ) : notificationsRows.length === 0 ? (
              <EmptyState text="No notifications match the current view." />
            ) : (
              <div className="space-y-4">
                {notificationsRows.map((row, index) => (
                  <NotificationCard
                    key={row?.id ?? index}
                    row={row}
                    locationsMap={locationsMap}
                    onMarkRead={handleMarkRead}
                    markingId={markingId}
                  />
                ))}
              </div>
            )}

            {notificationsNextCursor ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={loadMoreNotifications}
                  disabled={loadingMoreNotifications}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  {loadingMoreNotifications ? "Loading..." : "Load more"}
                </button>
              </div>
            ) : null}
          </SectionCard>
        </>
      ) : (
        <>
          <SectionCard
            title="Notes overview"
            subtitle="Internal notes are attached to a specific sale, credit, or customer."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Loaded"
                value={safeNumber(notesOverview?.loaded)}
                sub="Notes for current target"
              />
              <StatCard
                label="Pinned"
                value={safeNumber(notesOverview?.pinned)}
                sub="Pinned notes in current results"
              />
              <StatCard
                label="Latest"
                value={safeDate(notesOverview?.latestAt)}
                sub="Most recent note timestamp"
              />
              <StatCard
                label="Target ready"
                value={notesOverview?.targetReady ? "Yes" : "No"}
                sub="Entity id entered"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Note target"
            subtitle="This backend lists notes only for one exact entity type and one exact entity id."
            right={
              <AsyncButton
                idleText="Create note"
                loadingText="Opening..."
                successText="Ready"
                onClick={async () => setCreatingNote(true)}
              />
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FormSelect
                value={noteEntityType}
                onChange={(e) => setNoteEntityType(e.target.value)}
              >
                <option value="customer">Customer</option>
                <option value="sale">Sale</option>
                <option value="credit">Credit</option>
              </FormSelect>

              <FormInput
                type="number"
                value={noteEntityId}
                onChange={(e) => setNoteEntityId(e.target.value)}
                placeholder="Entity ID"
              />

              <div className="flex items-center text-sm text-stone-500 dark:text-stone-400 sm:col-span-2">
                Example: choose customer + enter customer id to load only notes
                for that customer.
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Notes timeline"
            subtitle="Entity-specific internal notes for the selected record."
          >
            {!String(noteEntityId || "").trim() ? (
              <EmptyState text="Enter an entity id above to load notes." />
            ) : loadingNotes ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800"
                  />
                ))}
              </div>
            ) : notesRows.length === 0 ? (
              <EmptyState text="No notes found for the selected entity." />
            ) : (
              <div className="space-y-4">
                {notesRows.map((row, index) => (
                  <NoteCard
                    key={row?.id ?? index}
                    row={row}
                    locationsMap={locationsMap}
                  />
                ))}
              </div>
            )}

            {notesNextCursor ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={loadMoreNotes}
                  disabled={loadingMoreNotes}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  {loadingMoreNotes ? "Loading..." : "Load more"}
                </button>
              </div>
            ) : null}
          </SectionCard>
        </>
      )}

      <CreateNoteModal
        open={creatingNote}
        onClose={() => setCreatingNote(false)}
        onSaved={handleNoteSaved}
        entityType={noteEntityType}
        entityId={noteEntityId}
      />
    </div>
  );
}
