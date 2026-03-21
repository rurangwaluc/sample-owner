function normalizeBase(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

const BASE = normalizeBase(process.env.NEXT_PUBLIC_API_BASE);

async function readBodySafe(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { error: text };
}

export async function apiFetch(path, opts = {}) {
  if (!BASE) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE in .env.local (restart dev server after setting it).",
    );
  }

  const url = `${BASE}${path}`;
  const hasBody = opts.body !== undefined && opts.body !== null;

  // ✅ Only set JSON header if we actually send a JSON body
  const headers = {
    ...(opts.headers || {}),
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    credentials: "include",
    body: hasBody ? JSON.stringify(opts.body) : undefined,
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
