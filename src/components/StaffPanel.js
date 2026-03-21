"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "../lib/api";

/**
 * BACKEND (CONFIRMED by your routes):
 * - POST   /users         (USER_MANAGE)
 * - GET    /users         (USER_VIEW)
 * - PATCH  /users/:id     (USER_MANAGE)
 * - DELETE /users/:id     (USER_MANAGE)   // "delete" = deactivate
 *
 * NOTE:
 * Activate is NOT defined in routes. We implement activate using PATCH.
 * I cannot confirm the exact field name for "active" without usersController/schema.
 * So we attempt { isActive: true } and show the backend error if it differs.
 */
const ENDPOINTS = {
  LIST: "/users",
  CREATE: "/users",
  UPDATE: (id) => `/users/${id}`,
  DEACTIVATE: (id) => `/users/${id}`, // DELETE
};

function s(v) {
  return v == null ? "" : String(v);
}

function safeDate(v) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function normalizeActive(u) {
  // Supports common shapes. If yours differs, we’ll adjust after seeing the controller.
  if (typeof u?.isActive === "boolean") return u.isActive;
  if (typeof u?.active === "boolean") return u.active;

  const st = s(u?.status).toUpperCase();
  if (st === "ACTIVE") return true;
  if (st === "INACTIVE") return false;

  // If backend returns deletedAt to mark deactivated
  if (u?.deletedAt || u?.deleted_at) return false;

  // Unknown -> treat as active so UI doesn’t hide staff
  return true;
}

function statusLabel(u) {
  return normalizeActive(u) ? "ACTIVE" : "INACTIVE";
}

export default function StaffPanel({ locationId }) {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [actionId, setActionId] = useState(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editing, setEditing] = useState(null);

  // Form
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fRole, setFRole] = useState("cashier");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await apiFetch(ENDPOINTS.LIST, { method: "GET" });
      const list = data?.users || data?.items || data?.rows || data || [];
      const arr = Array.isArray(list) ? list : [];

      const byLocation = locationId
        ? arr.filter(
            (u) =>
              String(u.locationId ?? u.location_id ?? "") ===
              String(locationId),
          )
        : arr;

      setRows(byLocation);
    } catch (e) {
      setRows([]);
      setErr(e?.data?.error || e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const qq = s(q).trim().toLowerCase();
    if (!qq) return rows;

    return rows.filter((u) => {
      const id = s(u?.id);
      const name = s(u?.name || u?.fullName || u?.username).toLowerCase();
      const email = s(u?.email).toLowerCase();
      const role = s(u?.role).toLowerCase();
      const st = statusLabel(u).toLowerCase();
      return (
        id.includes(qq) ||
        name.includes(qq) ||
        email.includes(qq) ||
        role.includes(qq) ||
        st.includes(qq)
      );
    });
  }, [rows, q]);

  function openCreate() {
    setMode("create");
    setEditing(null);
    setFName("");
    setFEmail("");
    setFPassword("");
    setFRole("cashier");
    setMsg("");
    setErr("");
    setModalOpen(true);
  }

  function openEdit(u) {
    setMode("edit");
    setEditing(u);
    setFName(s(u?.name || u?.fullName || u?.username));
    setFEmail(s(u?.email));
    setFPassword("");
    setFRole(s(u?.role || "cashier"));
    setMsg("");
    setErr("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setSaving(false);
  }

  async function saveUser() {
    setSaving(true);
    setMsg("");
    setErr("");

    const name = s(fName).trim();
    const email = s(fEmail).trim().toLowerCase();
    const role = s(fRole).trim();
    const password = s(fPassword);

    if (!name) {
      setErr("Name is required.");
      setSaving(false);
      return;
    }
    if (!email || !email.includes("@")) {
      setErr("Valid email is required.");
      setSaving(false);
      return;
    }

    try {
      if (mode === "create") {
        if (password.length < 4) {
          setErr("Password is required (min 4 chars).");
          setSaving(false);
          return;
        }

        // locationId included because your system is multi-location; if backend ignores it, fine.
        const body = { name, email, password, role, locationId };

        await apiFetch(ENDPOINTS.CREATE, { method: "POST", body });
        setMsg("✅ User created");
        closeModal();
        await load();
        return;
      }

      const id = editing?.id;
      if (!id) {
        setErr("Missing user id to edit.");
        setSaving(false);
        return;
      }

      const body = { name, email, role };
      await apiFetch(ENDPOINTS.UPDATE(id), { method: "PATCH", body });

      setMsg("✅ User updated");
      closeModal();
      await load();
    } catch (e) {
      setErr(e?.data?.error || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Deactivate = DELETE /users/:id (confirmed)
  async function deactivateUser(u) {
    const id = u?.id;
    if (!id) return;

    setActionId(id);
    setMsg("");
    setErr("");

    try {
      await apiFetch(ENDPOINTS.DEACTIVATE(id), { method: "DELETE" });
      setMsg("✅ Deactivated");
      await load();
    } catch (e) {
      setErr(e?.data?.error || e?.message || "Deactivate failed");
    } finally {
      setActionId(null);
    }
  }

  // Activate = PATCH /users/:id (route exists, field unknown)
  async function activateUser(u) {
    const id = u?.id;
    if (!id) return;

    setActionId(id);
    setMsg("");
    setErr("");

    try {
      // TRY #1: common pattern
      await apiFetch(ENDPOINTS.UPDATE(id), {
        method: "PATCH",
        body: { isActive: true },
      });

      setMsg("✅ Activated");
      await load();
    } catch (e) {
      // Show the real backend error so we can match field name exactly
      setErr(
        (e?.data?.error || e?.message || "Activate failed") +
          " (Your backend may use a different field than isActive.)",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border">
      <div className="p-4 border-b flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-zinc-900">Staff</div>
          <div className="text-sm text-zinc-600 mt-1">
            Owner manages staff. No delete: deactivate/activate only.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-xl border text-sm hover:bg-zinc-50 disabled:opacity-60"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>

          <button
            onClick={openCreate}
            className="px-3 py-2 rounded-xl text-sm bg-zinc-900 text-white hover:bg-black"
          >
            + New user
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {msg ? (
          <div className="text-sm p-3 rounded-xl border border-green-200 bg-green-50 text-green-900">
            {msg}
          </div>
        ) : null}

        {err ? (
          <div className="text-sm p-3 rounded-xl border border-red-200 bg-red-50 text-red-900">
            {err}
          </div>
        ) : null}

        <input
          className="w-full border rounded-xl px-3 py-2 text-sm"
          placeholder="Search id / name / email / role / status"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="px-4 pb-4">
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-700">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => {
                const id = u?.id;
                const active = normalizeActive(u);
                const busy = actionId === id;

                return (
                  <tr key={id} className="border-t">
                    <td className="p-3 font-medium text-zinc-900">
                      {id ?? "-"}
                    </td>
                    <td className="p-3 text-zinc-900">
                      {u?.name || u?.fullName || u?.username || "-"}
                    </td>
                    <td className="p-3 text-zinc-700">{u?.email || "-"}</td>
                    <td className="p-3 text-zinc-900">{u?.role || "-"}</td>

                    <td className="p-3">
                      <span
                        className={
                          "inline-flex items-center px-2 py-1 rounded-lg text-xs border " +
                          (active
                            ? "bg-green-50 text-green-900 border-green-200"
                            : "bg-zinc-100 text-zinc-800 border-zinc-200")
                        }
                      >
                        {active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td className="p-3 text-zinc-600">
                      {safeDate(u?.createdAt || u?.created_at)}
                    </td>

                    <td className="p-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => openEdit(u)}
                          className="px-3 py-2 rounded-xl border text-sm hover:bg-zinc-50"
                        >
                          Edit
                        </button>

                        {active ? (
                          <button
                            onClick={() => deactivateUser(u)}
                            disabled={busy}
                            className="px-3 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {busy ? "…" : "Deactivate"}
                          </button>
                        ) : (
                          <button
                            onClick={() => activateUser(u)}
                            disabled={busy}
                            className="px-3 py-2 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            {busy ? "…" : "Activate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-zinc-600">
                    {loading ? "Loading…" : "No staff found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-900">
                  {mode === "create"
                    ? "Create user"
                    : `Edit user #${editing?.id}`}
                </div>
                <div className="text-sm text-zinc-600 mt-1">
                  {mode === "create"
                    ? "Add a staff member."
                    : "Update name/email/role. No delete."}
                </div>
              </div>

              <button
                onClick={closeModal}
                className="px-3 py-2 rounded-xl border text-sm hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              {err ? (
                <div className="text-sm p-3 rounded-xl border border-red-200 bg-red-50 text-red-900">
                  {err}
                </div>
              ) : null}

              <div>
                <div className="text-xs text-zinc-600 mb-1">Name</div>
                <input
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                />
              </div>

              <div>
                <div className="text-xs text-zinc-600 mb-1">Email</div>
                <input
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="text-xs text-zinc-600 mb-1">Role</div>
                <select
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={fRole}
                  onChange={(e) => setFRole(e.target.value)}
                >
                  <option value="cashier">cashier</option>
                  <option value="seller">seller</option>
                  <option value="store_keeper">store_keeper</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                  <option value="owner">owner</option>
                </select>
              </div>

              {mode === "create" ? (
                <div>
                  <div className="text-xs text-zinc-600 mb-1">Password</div>
                  <input
                    type="password"
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                    value={fPassword}
                    onChange={(e) => setFPassword(e.target.value)}
                  />
                </div>
              ) : (
                <div className="text-xs text-zinc-500">
                  Password is not edited here.
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl border text-sm hover:bg-zinc-50"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                onClick={saveUser}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm hover:bg-black disabled:opacity-60"
              >
                {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
