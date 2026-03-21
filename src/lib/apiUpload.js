function normalizeBase(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

const BASE = normalizeBase(
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL,
);

function resolveUrl(path) {
  const clean = String(path || "").trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${BASE}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

export async function uploadFiles(files) {
  if (!BASE) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE in environment. Restart dev server after setting it.",
    );
  }

  const list = Array.from(files || []).filter(Boolean);
  if (!list.length) {
    return { files: [], urls: [] };
  }

  const form = new FormData();
  for (const file of list) {
    form.append("files", file);
  }

  const res = await fetch(`${BASE}/uploads`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await res.json()
    : { error: await res.text() };

  if (!res.ok) {
    const err = new Error(data?.error || `Upload failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  const urls = Array.isArray(data?.urls) ? data.urls : [];
  return {
    ...data,
    urls,
    absoluteUrls: urls.map(resolveUrl),
  };
}

export function resolveAssetUrl(path) {
  return resolveUrl(path);
}
