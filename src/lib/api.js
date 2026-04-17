"use client";

function normalizeBase(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

const BASE = normalizeBase(process.env.NEXT_PUBLIC_API_BASE);

async function readBodySafe(res) {
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  try {
    const text = await res.text();
    return text ? { error: text } : {};
  } catch {
    return {};
  }
}

function buildQuery(params = {}) {
  const source =
    params && typeof params === "object" && !Array.isArray(params)
      ? params
      : {};

  const qs = new URLSearchParams();

  Object.entries(source).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, String(value));
  });

  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function apiFetch(path, opts = {}) {
  if (!BASE) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE in .env.local (restart dev server after setting it).",
    );
  }

  const safeOpts =
    opts && typeof opts === "object" && !Array.isArray(opts) ? opts : {};

  const url = `${BASE}${path}`;
  const hasBody =
    Object.prototype.hasOwnProperty.call(safeOpts, "body") &&
    safeOpts.body !== undefined &&
    safeOpts.body !== null;

  const safeHeaders =
    safeOpts.headers &&
    typeof safeOpts.headers === "object" &&
    !Array.isArray(safeOpts.headers)
      ? safeOpts.headers
      : {};

  const headers = {
    ...safeHeaders,
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method: safeOpts.method || "GET",
    headers,
    credentials: "include",
    body: hasBody ? JSON.stringify(safeOpts.body) : undefined,
  });

  const data = await readBodySafe(res);

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    err.url = url;
    throw err;
  }

  return data;
}

/**
 * Expenses API
 */

export function listExpenses(params = {}) {
  return apiFetch(`/cash/expenses${buildQuery(params)}`);
}

export function createExpense(payload) {
  return apiFetch("/cash/expenses", {
    method: "POST",
    body: payload,
  });
}

export function voidExpense(expenseId, reason) {
  return apiFetch(`/cash/expenses/${expenseId}/void`, {
    method: "POST",
    body: { reason },
  });
}

export { buildQuery };
