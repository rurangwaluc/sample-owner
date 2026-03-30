function normalizeBase(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.replace(/\/+$/, "");
}

const BASE = normalizeBase(
  process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL,
);

async function readBodySafe(res) {
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await res.text();
    return { error: text };
  } catch {
    return { error: "Failed to read response body" };
  }
}

export async function apiFetch(path, opts = {}) {
  if (!BASE) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE (or NEXT_PUBLIC_API_URL) in environment. Restart the dev server after setting it.",
    );
  }

  const normalizedPath = String(path || "").startsWith("/")
    ? String(path)
    : `/${String(path || "")}`;

  const url = `${BASE}${normalizedPath}`;
  const method = String(opts.method || "GET").toUpperCase();
  const hasBody = opts.body !== undefined && opts.body !== null;

  const isFormData =
    typeof FormData !== "undefined" && opts.body instanceof FormData;

  const headers = {
    ...(opts.headers || {}),
    ...(!isFormData && hasBody ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: hasBody
      ? isFormData
        ? opts.body
        : JSON.stringify(opts.body)
      : undefined,
    cache: "no-store",
  });

  const data = await readBodySafe(res);

  if (!res.ok) {
    const err = new Error(
      data?.error || data?.message || `Request failed (${res.status})`,
    );
    err.status = res.status;
    err.data = data;
    err.url = url;
    throw err;
  }

  return data;
}

export { BASE as API_BASE };
